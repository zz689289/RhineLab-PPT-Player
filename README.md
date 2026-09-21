# RhineLab PPT Player

[简体中文](README.md) | [English](README_EN.md)

> **PUBLIC SOURCE PREVIEW / 公开源码预览**

本项目是一个受到 RhineLab 风格档案终端启发的 PPT/PDF 预览与放映播放器。

核心理念：**PPT 负责内容本身；播放器负责档案终端式的空间、交互和动画。**

当前本地 `v1.0.0` 候选已经冻结，但完整 Windows Release 仍等待第三方非代码资产的公开再分发许可确认。本仓库预览只公开权利边界清楚的源码、设计说明、文档和 GitHub 配置；由于运行资产暂未全部公开，此 Source Preview 不承诺能够独立构建出与冻结候选完全一致的程序。

## 当前状态

- 冻结候选：`PLAYER-PRESENTATION-001-R1 C001`
- 当前定位：Public Source Preview
- 正式 Windows Release：仍为 `PUBLIC_RELEASE_BLOCKED`
- 本仓库：不包含 EXE、GLB、Blend、PV 提取音频/PCM、争议 Logo、截图/GIF 或用户文稿

## 已实现的方向

- PDF/PPTX 静态内容导入管线的 Rust/TypeScript 代码
- 文件串、文件盒、Preview 与 Presentation 的状态和交互逻辑
- 普通、Shift、QUICK / FAST 的逐页动画逻辑
- 设置、身份显示、页面记忆和输入校验
- PDF/JSON 内容边界与本地路径安全检查

这里列的是冻结候选已有方向，不代表本 Source Preview 是完整可构建源码或正式 v1.0 开源发布。

## 尚未公开的部分

争议或授权尚未闭合的 GLB/Blend、PV 衍生音频及 PCM、精确 Logo/图标向量、字体 kit、运行截图/GIF、内部验证材料和 Windows EXE 均被白名单排除。授权闭合后，才会重新评估正式源码和 Windows Release。

## 技术栈

TypeScript、Three.js、PDF.js、Vite、Tauri 2、Rust。公开目录是审阅用源码快照，不承诺当前可直接构建；请先阅读 [公开范围说明](docs/PUBLIC_SOURCE_PREVIEW.md) 和 [第三方通知](THIRD_PARTY_NOTICES.md)。

## Known Issues / 已知问题

完整用户原文保留在 [`docs/KNOWN_ISSUES_zh-CN.txt`](docs/KNOWN_ISSUES_zh-CN.txt)，这里只做简短归类，不替换、不重写、不标记原条目为已解决：

- 交互/BUG：主界面 PPT 串命中与跨界面未完成滚动打断。
- QA_GAP：预览、放映快速切页和 Shift 大范围切换的连续性取证。
- VISUAL_TUNING：放映 HUD、文件盒动效和速度曲线。
- FEATURE：放映进度滑块及其他后续设计。

## Roadmap

见 [ROADMAP.md](ROADMAP.md)。后续方向包括交互细化、原生 PPT 动画、音视频、更广 Windows/GPU/DPI 覆盖和性能优化；本 Source Preview 不授权这些功能开发。

## 特别致谢 / Special Thanks

特别感谢 [LBEILC / RhineLabUI](https://github.com/LBEILC/RhineLabUI)：

- 本项目受到 RhineLabUI 重要启发；
- 复用了其部分 MIT 程序代码；
- 后续播放器功能在此基础上扩展；
- 对应版权和 MIT 许可证必须保留；
- 非代码资产不因 MIT 自动获得许可。

当前正在通过 [RhineLabUI Issue #10](https://github.com/LBEILC/RhineLabUI/issues/10) 征求 GLB 模型再分发许可：`currently pending / 当前正在征求授权`。

## 贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。不要上传私人或机密 PPT/PDF、账号信息、token、浏览器 profile、日志或本机绝对路径；问题模板只要求脱敏信息。

## License status / 许可证状态

本项目自身新增代码的最终开源许可证将在正式 v1.0 Release 前确定。当前不在仓库根目录放置会造成误导的项目级 `LICENSE`。RhineLabUI 的 MIT 许可证和第三方许可证见 [LICENSE_STATUS.md](LICENSE_STATUS.md) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

本项目是非官方玩家项目，不代表 Arknights / 明日方舟、Rhine Lab / 莱茵生命或任何相关权利人的授权、合作或背书。相关名称、角色、Logo、原作视觉和 PV 权利归相应权利人所有。
