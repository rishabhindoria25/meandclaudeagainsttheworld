"""
Glow image server — runs an open-source image-editing model for the
photoreal "after" photo.

Default model: Qwen-Image-Edit-2511 (Apache-2.0, 20B MMDiT), chosen for how
well it keeps a person's identity, pose and lighting while making targeted
edits. Any diffusers pipeline with the same call shape can be swapped in via
GLOW_OSS_MODEL.

    POST /edit   {"image": "<data URL or base64>", "prompt": "...", "steps": 40, "seed": 0}
              -> {"image": "data:image/png;base64,...", "model": "...", "seconds": 12.3}
    GET  /health -> {"ok": true, "model": "...", "device": "cuda"}

Environment:
    GLOW_OSS_MODEL    Hugging Face id (default Qwen/Qwen-Image-Edit-2511)
    GLOW_OSS_TOKEN    if set, requests must send "Authorization: Bearer <token>"
    GLOW_OSS_OFFLOAD  "1" to enable CPU offload (fits ~24 GB GPUs, slower)
    GLOW_OSS_STEPS    default inference steps (40)
    GLOW_OSS_FAKE     "1" to skip loading the model and echo a lightly
                      adjusted image (for wiring tests without a GPU)
"""

from __future__ import annotations

import base64
import io
import os
import threading
import time

from fastapi import Depends, FastAPI, Header, HTTPException
from PIL import Image, ImageEnhance, ImageOps
from pydantic import BaseModel, Field

MODEL_ID = os.environ.get("GLOW_OSS_MODEL", "Qwen/Qwen-Image-Edit-2511")
TOKEN = os.environ.get("GLOW_OSS_TOKEN", "")
OFFLOAD = os.environ.get("GLOW_OSS_OFFLOAD") == "1"
FAKE = os.environ.get("GLOW_OSS_FAKE") == "1"
DEFAULT_STEPS = int(os.environ.get("GLOW_OSS_STEPS", "40"))
MAX_SIDE = 1536

NEGATIVE = (
    "different person, changed face shape, changed ethnicity, changed skin tone, plastic skin, "
    "over-smoothed, cartoon, painting, distorted features, extra fingers, text, watermark, border"
)

app = FastAPI(title="Glow image server")
_lock = threading.Lock()  # one generation at a time per GPU
_pipe = None
_device = "cpu"


def _load():
    global _pipe, _device
    if FAKE or _pipe is not None:
        return
    import torch
    from diffusers import QwenImageEditPlusPipeline

    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
    pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL_ID, torch_dtype=dtype)
    if torch.cuda.is_available():
        _device = "cuda"
        if OFFLOAD:
            pipe.enable_model_cpu_offload()
        else:
            pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)
    _pipe = pipe


@app.on_event("startup")
def startup() -> None:
    _load()


def auth(authorization: str | None = Header(default=None)) -> None:
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


class EditRequest(BaseModel):
    image: str = Field(..., description="data URL or raw base64 (JPEG/PNG/WebP)")
    prompt: str = Field(..., min_length=5, max_length=4000)
    steps: int | None = Field(default=None, ge=4, le=80)
    seed: int | None = None
    cfg: float = Field(default=4.0, ge=1.0, le=10.0)


def decode_image(data: str) -> Image.Image:
    if data.startswith("data:"):
        data = data.split(",", 1)[1]
    try:
        img = Image.open(io.BytesIO(base64.b64decode(data, validate=True)))
        img = ImageOps.exif_transpose(img).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"unreadable image: {exc}") from exc
    scale = min(1.0, MAX_SIDE / max(img.size))
    if scale < 1:
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    return img


def encode_png(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "fake" if FAKE else MODEL_ID, "device": _device, "loaded": FAKE or _pipe is not None}


@app.post("/edit", dependencies=[Depends(auth)])
def edit(req: EditRequest) -> dict:
    src = decode_image(req.image)
    started = time.time()
    with _lock:
        if FAKE:
            out = ImageEnhance.Color(ImageEnhance.Brightness(src).enhance(1.04)).enhance(1.06)
        else:
            import torch

            generator = torch.Generator(device="cpu").manual_seed(req.seed if req.seed is not None else 0)
            result = _pipe(
                image=[src],
                prompt=req.prompt,
                negative_prompt=NEGATIVE,
                true_cfg_scale=req.cfg,
                num_inference_steps=req.steps or DEFAULT_STEPS,
                generator=generator,
                num_images_per_prompt=1,
            )
            out = result.images[0]
    if out.size != src.size:
        out = out.resize(src.size, Image.LANCZOS)
    return {"image": encode_png(out), "model": "fake" if FAKE else MODEL_ID, "seconds": round(time.time() - started, 2)}
