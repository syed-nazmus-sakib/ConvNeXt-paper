# ConvNeXt — A ConvNet for the 2020s

An interactive, animated slide deck explaining the paper
**[A ConvNet for the 2020s](https://arxiv.org/abs/2201.03545)** (Liu, Mao, Wu, Feichtenhofer, Darrell, Xie — CVPR 2022).

Built as a self-contained web presentation (vanilla HTML/CSS/JS — no framework, no build step) with a warm "milk-tea" theme, custom CSS/JS animations, and a step-by-step walk through ConvNeXt's modernization of the ResNet.

> Course project for **Introduction to Machine Learning**, Dept. of Robotics & Mechatronics Engineering, University of Dhaka.

## Run it

Just open `index.html` in any modern browser.

Or serve it locally (recommended — avoids any `file://` quirks):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls

| Key / action            | Effect                          |
| ----------------------- | ------------------------------- |
| `→` / `Space` / click   | next step (reveals or advances) |
| `←`                     | previous step                   |
| `Home` / `End`          | first / last slide              |
| `F`                     | toggle fullscreen               |
| `↻ replay` buttons      | replay an animation             |

## What's inside

The talk follows ConvNeXt's controlled experiment — take a ResNet-50 and walk it toward a Swin Transformer, one decision at a time, at fixed (~4.5 GFLOPs) compute:

1. **Motivation** — a decade of ConvNets, the Transformer earthquake, and the question ConvNeXt asks.
2. **Training recipe** — the "free" +2.7% before touching the architecture (augmentation, Stochastic Depth, Label Smoothing).
3. **Architecture, five moves** — stage compute ratio, "patchify" stem, depthwise convolutions, inverted bottleneck, larger kernels.
4. **Micro design** — GELU, fewer norms, BatchNorm → LayerNorm, separate downsampling → **82.0% > Swin-T 81.3%**.
5. **Results, verdict, and a goodbye** to convolutions.

## Project structure

```
index.html        all slides (semantic <section> per slide)
styles.css        milk-tea theme, layout, and animation styles
presentation.js   navigation engine, fragment stepping, and the animations
figures/          images used in the deck
```

The animated diagrams (modernization roadmap, depthwise space-vs-channel mixing,
inverted-bottleneck morph, receptive-field growth, stage-ratio and patchify visuals,
training-recipe visuals, era timeline) are all drawn in CSS/JS — `figures/` holds only
the static reference images.

## Credits

**Presented by** — Syed Nazmus Sakib `[AE-172-009]`, M. M. Mahabub Morshed `[SH-172-010]`
**Presented to** — Md Shifat-E-Arman Bhuiyan, Assistant Professor, Dept. of Robotics & Mechatronics Engineering, University of Dhaka

Figures reproduced from the cited papers are used for academic, non-commercial purposes.
