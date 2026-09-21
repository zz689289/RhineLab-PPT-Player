# RhineLab PPT Player

[简体中文](README.md) | [English](README_EN.md)

> **PUBLIC SOURCE PREVIEW**

An unofficial PPT/PDF preview and presentation player inspired by RhineLab-style archive terminals.

Core idea: **PPT owns the content; the player owns the archive-terminal space, interaction, and motion.**

The local `v1.0.0` candidate is frozen, but the complete Windows Release remains pending confirmation of public redistribution rights for third-party non-code assets. This preview publishes only source, design notes, documentation, and GitHub configuration whose rights boundary is clear. Because runtime assets are not all public, this Source Preview does not promise an independent build that reproduces the frozen candidate.

## Current status

- Frozen candidate: `PLAYER-PRESENTATION-001-R1 C001`
- Positioning: Public Source Preview
- Formal Windows Release: still `PUBLIC_RELEASE_BLOCKED`
- This repository contains no EXE, GLB, Blend, PV-derived audio/PCM, disputed logo, screenshot/GIF, or user document

## Implemented direction

- Rust/TypeScript pipeline for static PDF/PPTX content import
- Archive streams, file boxes, Preview, and Presentation state/interaction logic
- Per-page motion for normal, Shift, QUICK, and FAST navigation
- Settings, identity display, page memory, and input validation
- PDF/JSON content boundaries and local-path safety checks

These describe the frozen candidate's direction. They do not mean that this Source Preview is a complete buildable source tree or a formal v1.0 open-source release.

## Not publicly included

GLB/Blend assets, PV-derived audio and PCM, exact logo/icon vectors, font kits, runtime screenshots/GIFs, internal verification material, and the Windows EXE are excluded because their redistribution status is unresolved or out of scope. A formal source and Windows Release will be reconsidered after authorization is closed.

## Technology

TypeScript, Three.js, PDF.js, Vite, Tauri 2, and Rust. This repository is an audit-oriented source snapshot and is not promised to build as-is. Read [the public scope note](docs/PUBLIC_SOURCE_PREVIEW.md) and [third-party notices](THIRD_PARTY_NOTICES.md) first.

## Known Issues / Roadmap

The complete user-authored list is preserved in [`docs/KNOWN_ISSUES_zh-CN.txt`](docs/KNOWN_ISSUES_zh-CN.txt). The short categories here do not rewrite or mark any original item resolved:

- Interaction/BUG: archive-stream hit testing and interrupting unfinished scroll motion when switching surfaces.
- QA_GAP: continuity evidence for rapid Preview/Presentation navigation and Shift wide switching.
- VISUAL_TUNING: Presentation HUD, file-box motion, and timing curves.
- FEATURE: presentation progress slider and other follow-up design items.

See [ROADMAP.md](ROADMAP.md). Future areas include interaction refinement, native PPT animations, audio/video, broader Windows/GPU/DPI coverage, and performance work; this Source Preview does not authorize that development.

## Special Thanks

Special thanks to [LBEILC / RhineLabUI](https://github.com/LBEILC/RhineLabUI):

- this project was importantly inspired by RhineLabUI;
- parts of its MIT-licensed program code were reused;
- subsequent player behavior was extended on that basis;
- the corresponding copyright and MIT license must be retained;
- MIT does not automatically license non-code assets.

GLB model redistribution permission is currently pending through [RhineLabUI Issue #10](https://github.com/LBEILC/RhineLabUI/issues/10).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Do not upload private or confidential PPT/PDF files, account data, tokens, browser profiles, logs, or local absolute paths. The issue templates request only redacted information.

## License status

The final open-source license for this project's newly authored code will be decided before the formal v1.0 Release. No project-level `LICENSE` is placed at the repository root because that would be misleading. See [LICENSE_STATUS.md](LICENSE_STATUS.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for RhineLabUI's MIT license and other notices.

This is an unofficial fan project and is not authorized, endorsed, or affiliated with Arknights, Rhine Lab, or their respective rights holders. Related names, characters, logos, original visuals, and PV rights belong to their respective owners.
