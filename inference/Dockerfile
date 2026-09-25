# GPU image for the Glow image server (Qwen-Image-Edit-2511 by default).
# Needs an NVIDIA GPU: ~60 GB VRAM for full bf16, or ~24 GB with GLOW_OSS_OFFLOAD=1.
FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .
ENV HF_HOME=/models
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
