# RhineLab PPT Player

[简体中文](README.md) | [English](README_EN.md)

> **v1.0.0 released / First Public Release**

RhineLab PPT Player is an unofficial fan-made PPT/PDF preview and presentation player inspired by archive-terminal aesthetics.

## Download and demo

- [v1.0.0 GitHub Release](https://github.com/zz689289/RhineLab-PPT-Player/releases/tag/v1.0.0)
- Windows x64 package: download `RhineLab-PPT-Player-v1.0.0-Windows-x64.zip` from the v1.0.0 Release.
- Functional demo: the same Release provides `RhineLab-PPT-Player-Demo-v1.0.0.pptx` and the matching PDF attachment.

The PPTX tests the PowerPoint conversion path. The PDF can be loaded directly without PowerPoint. The demo covers 4:3 Chinese pages, Preview, Presentation, page switching, and first/last-page boundaries. The GitHub Release page is the intended download location.

## What it does

- Imports local PDF and PPTX-derived page content.
- Provides archive streams, file boxes, Preview, and Presentation states.
- Supports normal, Shift, QUICK, and FAST navigation paths.
- Keeps page memory, settings, identity display, and local-path safety checks.

## Known Issues / Roadmap

The complete post-v1.0 design issue list remains in the original project file [`docs/KNOWN_ISSUES_zh-CN.txt`](docs/KNOWN_ISSUES_zh-CN.txt). The short categories below do not rewrite, replace, or mark any original item resolved:

- interaction and motion refinement;
- continuity evidence for rapid Preview/Presentation navigation;
- Presentation HUD and timing-curve tuning;
- future native animation, audio/video, and wider Windows/GPU/DPI coverage.

The project-local original issue list is the source of truth for complete wording and priorities.

## Special thanks and third-party boundaries

Special thanks to [LBEILC / RhineLabUI](https://github.com/LBEILC/RhineLabUI). Reused or adapted RhineLabUI code and content that LBEILC is entitled to license retain the separate MIT notice and copyright in [`licenses/RhineLabUI-MIT.txt`](licenses/RhineLabUI-MIT.txt). The model authorization record is [RhineLabUI Issue #10](https://github.com/LBEILC/RhineLabUI/issues/10), and the README license clarification is commit [`6185da2`](https://github.com/LBEILC/RhineLabUI/commit/6185da2).

The project's own code and clearly project-owned technical documentation use MIT, Copyright (c) 2026 Hug800mhz. The project MIT License does not relicense Arknights / 明日方舟, Rhine Lab / 莱茵生命 names, logos, settings, original visual design, PV material, audio, or other third-party rights.

This is an unofficial player project. It is not authorized, endorsed, or affiliated with Hypergryph, Yostar, Arknights, Rhine Lab, or their respective rights holders. Official permission for the related IP remains pending; this release records user risk acceptance, not legal authorization. If an official rights holder requests restriction, replacement, or takedown, the project will comply.

See [`LICENSE_STATUS.md`](LICENSE_STATUS.md) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the complete boundary.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. Do not upload private PPT/PDF files, account data, tokens, browser profiles, logs, or local absolute paths.
