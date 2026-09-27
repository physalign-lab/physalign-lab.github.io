# PhysAlign project website

可直接部署到 GitHub Pages 的纯静态学术主页。英文展示页面，中文操作指南。已录入用户提供的 `ICLR27_PhysAlign.pdf` 中 6 个模型的论文结果，并区分整体 Grounding、联合指标、配对阅读控制与错误诊断。

**完整教程：[docs/DEPLOY_ZH.md](docs/DEPLOY_ZH.md)**

项目页地址：[physalign-lab.github.io](https://physalign-lab.github.io/)。网站仓库为 [physalign-lab/physalign-lab.github.io](https://github.com/physalign-lab/physalign-lab.github.io)，发布源为 `main` 分支根目录。

后续更新推送到此组织仓库即可自动发布。原个人仓库保留旧网站，但不会自动同步新仓库的修改。

## 本地预览

Windows 在此目录打开 PowerShell：

```powershell
py scripts/validate.py
py -m http.server 8000 --bind 127.0.0.1
```

macOS / Linux：

```bash
python3 scripts/validate.py
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 `http://localhost:8000/`。不要双击 HTML：页面用 `fetch()` 读取 JSON，需要 HTTP 服务。服务器不运行模型；关闭终端或 Ctrl+C 即停止本地预览。

## 上线前最少修改

作者、单位、代码仓库、Hugging Face 数据集、通讯邮箱、正式站点 URL 和结果提交入口已经写入 `data/site.json`。arXiv 审核完成后补充 `links.paper` 和最终 `bibtex`，再运行 `scripts/prepare_release.py` 更新分享元数据；暂未发布的资源保留空字符串，页面会禁用相应按钮。

GitHub Pages 使用 `Settings → Pages → Deploy from a branch → main → /(root)`。`index.html` 必须直接处在仓库根目录，不要多套一层解压目录。保留 `.nojekyll`。

## 维护位置

| 文件 | 用途 |
|---|---|
| `data/site.json` | 作者、链接、默认排序、BibTeX |
| `data/leaderboard.json` | 实验结果及版本/配置/覆盖范围 |
| `data/archive/paper-2026-09-26.json` | 初始论文快照，保留历史，不覆盖 |
| `index.html` | 页面文字、论文示意图、数据概览 |
| `assets/css/style.css` | 配色、排版、手机布局 |
| `assets/js/app.js` | 排序、筛选、详情、导出、图像放大 |
| `scripts/validate.py` | 数据与本地文件检查，不是模型评测器 |
| `scripts/prepare_release.py` | 可选，生成静态 SEO/分享预览元信息 |
| `docs/new-result.example.json` | 新评测记录的空白模板，不会自动上榜 |
| `docs/LEADERBOARD_PROTOCOL.md` | 版本/排名/提交和审核规则 |
| `.github/ISSUE_TEMPLATE/submit_result.yml` | GitHub 模型结果提交表单 |

代码无需 Node.js、npm、数据库或付费服务器。实验代码通过页面的 Code 按钮访问。用于本地设计的 `ICLR27_PhysAlign.pdf` 已加入 `.gitignore`，不随网页上传；论文公开地址待 arXiv 审核后补充。

默认 GAcc 排名只是展示选择；不混合多个指标构造总分。配对和条件错误诊断不设跨模型名次。未知分数用 `null`，不是 0。初始页面数字均为论文快照，而非后续修订数据的成绩。

代码许可与论文图像/数据许可分开：[LICENSE](LICENSE)、[docs/ASSET_NOTICE.md](docs/ASSET_NOTICE.md)。在公开原始题图、数据或评审链接前检查许可和当前匿名评审要求。

## 本地检查记录

最近一次改版完成了源码结构、数据、资源路径和本地 HTTP 检查。该次检查没有可用浏览器实例，不能视为桌面/手机截图或交互验收。详见 [docs/LOCAL_TEST_REPORT.json](docs/LOCAL_TEST_REPORT.json)。
