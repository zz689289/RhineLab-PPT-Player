# RhineLab PPT Player

[简体中文](README.md) | [English](README_EN.md)

> **v1.0.0 发布包已准备 / Release assets prepared**

这是一个受到 RhineLab 风格档案终端启发的 PPT/PDF 预览与放映播放器。

核心理念：**PPT 负责内容本身；播放器负责档案终端式的空间、交互和动画。**

## 下载与演示

正式公开版本页面：<https://github.com/zz689289/RhineLab-PPT-Player/releases/tag/v1.0.0>

- Windows x64：Release 创建后下载 `RhineLab-PPT-Player-v1.0.0-Windows-x64.zip`
- Functional Demo：Release 创建后提供 PPTX 与 PDF，可直接测试导入、页面边界、Preview、Presentation 和连续切页
- 源码：本仓库提供经过白名单审阅的公开源码与文档快照，不包含 Windows EXE 或用户私人文件

## 主要功能

- PDF/PPTX 静态内容导入与页面预览
- 文件串、文件盒、Preview 与 Presentation 模式
- 普通、Shift、QUICK / FAST 的逐页动画
- 设置、身份显示、可选页面记忆和输入校验
- 4:3 中文演示文稿的导入与放映路径

PPTX 静态转换依赖 Windows 本机 PowerPoint；PDF 可以直接加载。程序不支持原生 PPT 动画、音视频和完整 PowerPoint 兼容。

## Known Issues / 已知问题

完整用户原文保留在 [`docs/KNOWN_ISSUES_zh-CN.txt`](docs/KNOWN_ISSUES_zh-CN.txt)，这里只做简短归类，不替换、不重写、不标记原条目为已解决：

- 交互/BUG：主界面 PPT 串命中与跨界面未完成滚动打断
- QA_GAP：预览、放映快速切页和 Shift 大范围切换的连续性取证
- VISUAL_TUNING：放映 HUD、文件盒动效和速度曲线
- FEATURE：放映进度滑块及其他后续设计

完整设计问题和优先级以项目内原始问题清单为准。

## 特别致谢与权利边界

特别感谢 [LBEILC / RhineLabUI](https://github.com/LBEILC/RhineLabUI)。本项目复用或改编的 RhineLabUI 内容保留 `Copyright (c) 2026 LBEILC` 及 MIT License，详见 [licenses/RhineLabUI-MIT.txt](licenses/RhineLabUI-MIT.txt)。作者许可记录见 [RhineLabUI Issue #10](https://github.com/LBEILC/RhineLabUI/issues/10)，README 许可更新见 [commit 6185da2](https://github.com/LBEILC/RhineLabUI/commit/6185da2)。

本项目自身代码及明确由项目作者拥有权利的技术文档采用 MIT License，`Copyright (c) 2026 Hug800mhz`，详见根目录 [LICENSE](LICENSE)。项目许可证不会重新许可第三方 IP、字体、PDF.js、Three.js、Rust crates 或其他依赖。

本项目是非官方玩家项目，不代表鹰角、Yostar、Arknights / 明日方舟、Rhine Lab / 莱茵生命或其他权利人的授权、合作或背书。相关名称、Logo、设定和原作视觉设计的官方许可申请仍在等待回复；本版本不声称取得官方授权。若官方提出限制、拒绝或下架要求，项目将按要求替换、调整或下架相关内容。

## 贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。不要上传私人或机密 PPT/PDF、账号信息、token、浏览器 profile、日志或本机绝对路径；问题模板只要求脱敏信息。
