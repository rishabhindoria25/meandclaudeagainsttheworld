# Pairing

Zephyr has to work out which infrared protocol your unit speaks before it can
control it. This takes a couple of minutes, once, ever.

## Why it isn't already known

GE has never manufactured room air conditioner electronics. The chassis is built
by Midea, LG, Samsung, Haier, TCL or another OEM, and **the IR protocol follows
the builder, not the badge**. Two GE units bought the same year from the same
shop can speak entirely different protocols.

Normally you would point the original remote at a receiver and learn the codes.
With no remote, there is nothing to learn from — so instead Zephyr guesses, in a
sensible order, and lets you judge the result.

## Running the wizard

1. Open the bridge (`http://zephyr.local/`) and go to **Setup**.
2. Stand where you can see the unit's display **and** hear its fan.
3. Press **Start the wizard**.

For each candidate the bridge sends the most unmissable command it can: if the
unit is off, *turn on, cooling, 60 °F, high fan*. If it is on, *turn off*.

Then you answer one question: **did anything happen?**

- **Yes, it reacted** — a beep, the fan spinning up or stopping, the display
  changing or lighting up. The protocol is stored in flash and you are finished.
- **Nothing happened** — moves to the next candidate and sends again.
- **Send again** — re-sends the same one. Worth using if you weren't looking, or
  if the room is sunlit.

Most GE room A/Cs land on **COOLIX** (Midea) or **MIDEA**, the first two
candidates. The full list is eighteen long; working through all of it takes about
two minutes.

## If nothing in the list works

Check these in order — a wiring fault looks exactly like a wrong protocol:

1. **Is the LED actually emitting?** Point a phone camera at it and press *Send
   again*. Most phone front cameras show IR as a faint purple-white flicker.
   Nothing there means a wiring problem, not a protocol problem.
2. **Is the transistor the right way round?** A backwards 2N2222 passes just
   enough current to look alive and not enough to reach anything.
3. **Are you aimed at the receiver?** It is the dark rectangle at the top-left of
   the control panel, left of the digits.
4. **Is the unit in direct sun?** Try again after dark.
5. **Is the unit powered?** The LCDI plug on its cord trips and needs a manual
   RESET.

If the LED emits, the aim is good, and all eighteen candidates fail, the unit
uses a protocol that isn't in `IRremoteESP8266` yet. That is what the optional
TSOP38238 receiver is for: borrow any A/C remote, capture raw timings with the
library's `IRrecvDumpV2` example, and the maintainers of that project are very
receptive to new protocol submissions.

## Changing it later

**Setup → Or set the protocol directly** applies any candidate immediately,
without the wizard. Useful if you already know what the unit is, or to try a
close relative — `LG` and `LG2`, or `HAIER_AC` and `HAIER_AC_YRW02`, are worth
testing against each other if one is *almost* right.

## "Almost right"

If the unit responds but gets something wrong — powers on but ignores the
setpoint, or reads 5 °F off — you have a near miss rather than a hit. Try the
neighbouring variant of the same OEM. Protocol families share framing but differ
in how they encode temperature, so a partial response is a strong signal you are
in the right family.
