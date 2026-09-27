# PhysAlign GitHub Pages 网站部署与排行榜维护指南

版本：2026-09-26。本文对应本压缩包的实际文件，而不是只描述一个尚未实现的设计。

初始论文结果来源：用户提供的 `ICLR27_PhysAlign.pdf`。网站使用论文 Table 2、Appendix B.5、Table 8–10 的数据及配置。网站制作与部署方法参考 GitHub、Hugging Face 官方文档；文末提供链接。

---

## 1. 先确定三件事

**推荐结构：宣传网站一个仓库，评测代码另一个仓库，数据集放 Hugging Face。** 网站只加载少量静态文件和成绩汇总，不在浏览器中运行模型，也不保存模型 API Key、隐藏答案或私有评测映射。这样后续更新模型成绩只改 JSON，不必修改排版代码。

网站采用原生 HTML + CSS + JavaScript。部署不要求安装 Node.js、npm、React、数据库或购买服务器。Python 只用于可选的本地预览与数据检查，不是网站的线上后端。

网站页面使用英文，方便国际学术传播；本操作指南使用中文。页面的信息结构参考 SeePhys 的“论文与资源入口—工作介绍—模型结果—数据与案例—引用”，但网页代码独立编写，没有把 SeePhys 的模型分数、研究图像或品牌标识搬到 PhysAlign。

### 1.1 选择网址

**本站已采用组织首页：** 组织 `physalign-lab`，仓库 [physalign-lab/physalign-lab.github.io](https://github.com/physalign-lab/physalign-lab.github.io)，正式网址 [https://physalign-lab.github.io/](https://physalign-lab.github.io/)。后续将修改推送至该仓库的 `main` 分支即可自动发布，不需要购买域名或配置自定义 DNS。原个人仓库保留旧网站，不会自动同步更新。下表为其他部署方式的通用参考。

| 方式 | 需要创建的仓库 | 最终网址形态 | 推荐情形 |
|---|---|---|---|
| 项目专用组织首页 | 在组织 `physalign` 下建 `physalign.github.io` | `https://physalign.github.io/` | 项目长期维护、多人协作，且组织名可用 |
| 个人/已有组织的项目页 | 在 `YOUR_OWNER` 下建 `PhysAlign` | `https://YOUR_OWNER.github.io/PhysAlign/` | 最快上线，不需要申请专用组织名 |
| 个人首页 | 在 `YOUR_OWNER` 下建 `YOUR_OWNER.github.io` | `https://YOUR_OWNER.github.io/` | 尚未使用个人首页，愿意让该首页展示项目 |

**注意：网址前面的名字由 GitHub 用户名/组织名决定，不是任意仓库名。** 在 `alice` 账户下新建一个 `physalign.github.io` 仓库，并不能直接取得 `https://physalign.github.io/`。它是 `alice` 所有的项目仓库，而不是 `physalign` 的组织首页。

如果将模板用于其他项目，需要另行确认组织名是否可用；上表的 `physalign` 仅为示例，不是本站组织。模板全站使用相对资源路径，组织首页和带 `/PhysAlign/` 子路径的项目页都能部署。

### 1.2 明确当前是哪版结果

初始成绩绑定论文快照 `paper-2026-09-26`，使用完整 retained release，而不是 Test-only。这个标签是本网站为保留历史而设置的标识，不是声称论文已经公开了名为该标签的正式数据版本。

不要把附录审计修正后的候选版本、补充的 1,089 个探针或新 Test-only 评测直接拼到旧表里。新版本应新建 track，重新评测后记录成绩。

### 1.3 准备正式发表信息

作者顺序、单位、共同一作、通讯作者邮箱、代码仓库、Hugging Face 数据集和结果提交入口已经配置。正式站点 URL 是 `https://physalign-lab.github.io/`。arXiv 仍在审核，因此 `links.paper` 与最终 BibTeX 暂时保留为空。当前 PDF 是本地匿名投稿版本，已加入 `.gitignore`，不随网页上传。

---

## 2. 压缩包里有什么

```text
physalign-site/
├── index.html                        # 主页面，根目录必须有此文件
├── .nojekyll                         # 空文件，保留它
├── .gitignore
├── README.md
├── LICENSE                           # 仅新写的网站代码
├── assets/
│   ├── css/style.css                 # 配色和响应式排版
│   ├── js/app.js                     # 排序、筛选、详情、导出、放大图片
│   └── img/                          # 从你的论文裁出的图像预览，无字体文件
├── data/
│   ├── site.json                     # 作者、资源地址、引用、默认显示配置
│   ├── leaderboard.json              # 成绩、版本、配置、覆盖范围
│   └── archive/paper-2026-09-26.json   # 初始论文快照备份
├── scripts/
│   ├── validate.py                   # 检查本地数据与文件，不是模型评测器
│   └── prepare_release.py            # 可选：更新静态元信息
├── docs/
│   ├── DEPLOY_ZH.md                  # 本文
│   ├── LEADERBOARD_PROTOCOL.md        # 排名、版本及结果审核规则
│   ├── new-result.example.json        # 新结果空白模板
│   ├── DATASET_CARD_TEMPLATE.md       # Hugging Face 数据卡说明模板
│   ├── ASSET_NOTICE.md               # 图片来源和许可边界
│   └── asset-provenance.json
└── .github/ISSUE_TEMPLATE/
    └── submit_result.yml             # 他人提交成绩的 GitHub issue 表单
```

日常通常只改两个文件：`data/site.json` 和 `data/leaderboard.json`。调整研究介绍或换图时，再改 `index.html` 和 `assets/img/`。

---

## 3. 配置作者和 arXiv / GitHub / Hugging Face 链接

用 VS Code 打开解压后的 `physalign-site` 文件夹，打开 `data/site.json`。

### 3.1 资源链接

需要修改的字段：

```json
"website_url": "",
"links": {
  "paper": "",
  "code": "",
  "dataset": "",
  "contact": "",
  "submission": ""
}
```

将引号里的空值替换为正式地址。下面是**地址形态示例，不是你的已存在资源**：

```text
website_url  → https://physalign.github.io/
paper        → https://arxiv.org/abs/你的正式arXiv编号
code         → https://github.com/你的用户名或组织名/PhysAlign
dataset      → https://huggingface.co/datasets/你的用户名或组织名/PhysAlign
contact      → mailto:你的公开联系邮箱
submission   → https://github.com/网站所有者/网站仓库名/issues/new?template=submit_result.yml
```

论文按钮建议指向 arXiv 的 `abs` 页面，而不是仅 PDF：读者能看到摘要、作者、版本和其他下载入口。代码按钮应指向**实际评测代码仓库**，不必指向这个宣传网站仓库。Hugging Face 链接应包含 `/datasets/`，不要误写成模型仓库地址。

未发布的资源继续保留 `""`，其按钮会显示 `Coming soon` 且没有可点击目标。`contact` 和 `submission` 没准备好也可留空。

网站没有创建这些外部资源，只预留并实现了入口。

### 3.2 作者与单位

将空数组改成最终批准的信息。以下仅演示字段形态：

```json
"authors": [
  {
    "name": "第一位作者的英文姓名",
    "url": "",
    "affiliations": ["1"],
    "note": ""
  },
  {
    "name": "第二位作者的英文姓名",
    "url": "",
    "affiliations": ["1", "2"],
    "note": ""
  }
],
"affiliations": [
  {"id": "1", "name": "第一所单位的正式英文名称"},
  {"id": "2", "name": "第二所单位的正式英文名称"}
],
"author_note": ""
```

`url` 可填个人主页，也可留空；`note` 可填 `*` 等标记，含义在 `author_note` 解释。不要在正式网站留下上述中文占位姓名。保持空数组时，整个作者区隐藏，而不是显示“Anonymous authors”。这只是展示行为，不能据此宣称网站满足匿名评审要求。

### 3.3 BibTeX

把最终作者确认的 BibTeX 填入 `bibtex`。JSON 字符串不能直接跨行，可将换行写成 `\n`。更稳妥的做法：将真实 BibTeX 保存成 UTF-8 的 `citation.bib`，在项目根目录执行：

```python
from pathlib import Path
import json

p = Path("data/site.json")
config = json.loads(p.read_text(encoding="utf-8"))
config["bibtex"] = Path("citation.bib").read_text(encoding="utf-8").strip()
p.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
```

可以将这段保存为临时 `.py` 文件执行，成功后删除临时脚本。网站将显示引用并启用复制按钮。未正式确定时保留空字符串，不生成虚构 arXiv 编号、会议信息或作者列表。

### 3.4 默认排名

```json
"default_metric": "gacc_all",
"default_track": "paper-2026-09-26"
```

允许的指标为 `gacc_all`、`jacc`、`cacc`、`gacc_joint`、`solveacc`。默认用全部 Grounding 探针的 GAcc，覆盖面最大且对应核心任务；读者可以切换到 JAcc 等指标。这个默认值是网站设计选择，论文没有因此多出一个综合总分。

---

## 4. 本地运行：先预览，再发布

### Windows

进入包含 `index.html` 的目录，在文件夹空白处右键打开终端，或者在 VS Code 菜单中选择 Terminal → New Terminal。

```powershell
py --version
py scripts/validate.py
py -m http.server 8000 --bind 127.0.0.1
```

若系统使用 `python` 命令，则将 `py` 换成 `python`。若两者都不存在，可安装 Python，或者使用 VS Code 的本地静态 HTTP 预览工具。

### macOS / Linux

```bash
python3 --version
python3 scripts/validate.py
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开：

```text
http://localhost:8000/
```

**不要直接双击 `index.html`。** 双击后是 `file://`，浏览器可能不允许页面读取 `data/*.json`。模板需要通过 HTTP 访问，不代表需要线上后端。

预览时终端需要保持运行；结束时按 Ctrl+C。这个本地服务器仅供预览，GitHub Pages 不需要它一直开着。

`validate.py` 的普通模式允许作者、链接和 BibTeX 未配置，显示 WARNING 后仍可 PASS。它会检查 JSON、重复 ID、分数范围、基本指标关系、独立舍入容差和本地文件，但不会重新跑模型、验证隐藏答案、确认实际样本相同或判定数据许可。

正式信息都填写好后，可执行更严格检查：

```powershell
py scripts/validate.py --release
```

这是可选的“所有主要发布信息齐全”检查；提前发布带 Coming soon 的页面不需要此模式通过。

---

## 5. 创建 GitHub 网站仓库

### 方案 A：做成 `physalign.github.io` 风格

在 GitHub 创建专用组织，选择你拥有使用权限且可用的组织名。然后在该组织下创建公开仓库，名称必须是 `组织名.github.io`。

例如组织名为 `physalign`，则仓库为：

```text
physalign/physalign.github.io
```

**不要新建为其他所有者名下的同名仓库。** 仓库命名不能替代组织名。

### 方案 B：最快用现有账号

在现有账号下创建公开仓库 `PhysAlign`，以后地址是：

```text
https://你的GitHub用户名.github.io/PhysAlign/
```

若 `PhysAlign` 仓库已用于代码，可将网站仓库命名为 `PhysAlign-website`，对应网址的最后一段也变化。不要为了抢占仓库名覆盖已有代码。

本教程使用公开仓库路线；GitHub Free 对公开仓库支持 Pages，私有仓库的 Pages 能力受账户方案影响。即使某个私有仓库可部署 Pages，也不要默认部署内容仍然私有。

---

## 6. 上传文件：任选一种方法

### 方法一：GitHub 网页上传，适合第一次操作

打开刚创建的仓库，选择 Add file → Upload files。上传 `physalign-site` **里面的文件和子目录**，不是把整个最外层文件夹作为一个目录上传。

正确的仓库首页应直接看到：

```text
index.html
assets/
data/
docs/
scripts/
README.md
.nojekyll
```

错误结构：

```text
你的仓库/
└── physalign-site/
    └── index.html
```

上传后填写提交说明，比如 `Add PhysAlign project website`，提交到 `main`。

确认 `.nojekyll` 和 `.github/ISSUE_TEMPLATE/submit_result.yml` 也上传了。点号文件/文件夹可能被系统隐藏。`.nojekyll` 是正常的空文件；若没有上传成功，在 GitHub 的 Add file → Create new file 中补建根目录 `.nojekyll` 即可。它告诉 Pages 不需要用 Jekyll 处理本模板。

### 方法二：Git 命令上传，适合后续频繁更新

以下命令假定远端是**刚创建且未初始化 README 的空仓库**。在本地模板根目录执行，把 URL 中的所有者与仓库名替换成你的真实值：

```bash
git init
git add .
git commit -m "Add PhysAlign project website"
git branch -M main
git remote add origin https://github.com/YOUR_OWNER/YOUR_WEBSITE_REPO.git
git push -u origin main
```

首次 push 需要完成 GitHub 支持的登录认证。不要将密码、令牌写入代码、JSON 或公开命令日志。若已经有 `origin`，先检查 `git remote -v`，不要不加确认地覆盖远端。

如果远端已经初始化 README 或已有文件，更稳妥的是先 `git clone` 那个仓库，再把模板内容拷进去提交；不要通过强制推送覆盖远端已有历史。

---

## 7. 开启 GitHub Pages

进入仓库的：

```text
Settings
  → Pages
  → Build and deployment
  → Source: Deploy from a branch
  → Branch: main
  → Folder: /(root)
  → Save
```

本模板的推荐路线是**从分支根目录发布**，不需要自建 Actions 部署脚本。不要一边选 Source = GitHub Actions，一边又按分支部署教程等待根目录发布。

保存后进入 Actions，查看 Pages 构建/部署任务是否成功。分支发布也可能显示 GitHub 管理的 Pages 工作流，这是正常的，不代表你需要编写工作流。

在 Pages 设置页查看 GitHub 给出的实际网址，以该网址为准。官方文档说明更改可能需要最多约 10 分钟发布；不要在刚保存的几秒内就认定失败。部署成功后访问页面，确认没有 404；可用时启用 Enforce HTTPS。

整个站点使用相对路径 `./assets/...` 和 `./data/...`，所以部署在项目子路径下时也能找到资源。不要随意把它们改为 `/assets/...`，否则项目页会错误地从域名根目录寻找文件。

---

## 8. 设置分享预览与正式主页地址

确认实际部署地址后，将它写入 `data/site.json` 的 `website_url`。项目页需要完整子路径和末尾 `/`：

```text
https://YOUR_OWNER.github.io/PhysAlign/
```

执行：

```powershell
py scripts/prepare_release.py
```

macOS/Linux 换成 `python3`。这个可选脚本把 canonical、分享预览图片及作者引用信息写入 HTML 的静态 meta 标签，再将修改后的 `index.html` 一并提交。它不是必须的前端构建过程。

只用 JavaScript 更新内容不一定能让不执行脚本的分享爬虫读到新元信息，因此这里单独提供静态更新工具。该步骤不会保证搜索引擎收录或保证任何社交平台立刻刷新缓存；也没有内置访问量统计。

---

## 9. 当前六个模型到底填了哪些成绩

所有数值来自论文 Table 2，单位为百分数；Δ 的单位为百分点。此处顺序按论文，网站默认按整体 GAcc 自动排序。

| Model | CAcc | GAcc L | JAcc | GAcc G | Base Pm | +GT Pm | Δ pp | SolveAcc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Qwen3.5-4B | 53.97 | 46.51 | 32.09 | 40.21 | 46.51 | 54.61 | +8.10 | 9.94 |
| Qwen3.5-9B | 65.81 | 54.55 | 37.55 | 40.52 | 54.55 | 56.53 | +1.98 | 12.12 |
| Qwen3.5-27B | 84.14 | 80.29 | 68.12 | 84.11 | 80.29 | 82.00 | +1.71 | 18.39 |
| InternVL3.5-8B | 2.12 | 33.36 | 1.05 | 23.52 | 33.36 | 34.81 | +1.45 | 7.47 |
| GPT-6 Astra | 89.44 | 83.31 | 77.13 | 81.94 | 83.59 | 84.90 | +1.32 | 71.72 |
| Gemini 3.8 Flash | 85.20 | 79.33 | 70.59 | 90.71 | 78.67 | 80.86 | +2.20 | 21.31 |

特别注意：

- `GAcc G` 使用 986 母题 / 3,341 探针；`CAcc`、`JAcc`、`GAcc L` 使用 311 母题 / 412 探针。
- 553 是 paired-eligible 的库存数量。实际 Base/+GT 比较用 Pm：开放权重模型 311 / 412；API 模型 304 / 397。
- 所有初始实验合并 Development + Test，不能写成 held-out Test leaderboard。
- SolveAcc 是原题归一化得分平均值，包含部分分，不是“完整答对题目占比”。
- GPT 的 84.90 − 83.59 在显示值上等于 1.31，但论文独立舍入的 Δ 为 1.32；Gemini 对应为 2.20 而非 2.19。模板保留论文值。
- 不将 InternVL 的 CAcc 2.12 当作录入错误擅自改正。论文配置及异常现象可通过模型详情查看。
- 未提供的人类基线、模型参数量、原始哈希、API 权重快照和数值 CI 端点不填造数。没有默认 Human = 100。

网页 Main results 有排名；Paired reading control 和 Error diagnostics 不设名次。后两者的样本支持或条件分母不同，不能伪装成完全同口径的统一排行。

---

## 10. 以后新增一个模型：完整维护流程

### 10.1 先跑真实评测，不在网页里算成绩

使用你项目真正的评测代码，在明确的数据修订版本与协议上运行模型。由于你没有提供评测仓库的实际 CLI，本模板不虚构 `evaluate.py` 的命令。

至少保留：模型/检查点或请求 API alias；推理模式；temperature/解码规则；输出上限；图像处理；创建时间；数据版本；scorer commit；样本 membership；各集合的母题/探针数；配对覆盖及失败分类；正式聚合后的成绩。

使用论文定义的 parent/task-balanced 聚合，不能把所有探针直接求平均代替；SolveAcc 还涉及相应的原题计分流程。配对置信区间也应由原始预测和官方统计流程产生，不从本页面的两位小数推导。

### 10.2 复制结果模板

打开 `docs/new-result.example.json`，复制整个对象，填写真实记录。这个模板本身不会被网站加载。成绩字段示意如下：

```json
"metrics": {
  "gacc_all": null,
  "cacc": null,
  "jacc": null,
  "gacc_joint": null,
  "solveacc": null
},
"paired": {
  "parents": 0,
  "probes": 0,
  "base": null,
  "gt": null,
  "delta_pp": null,
  "ci95_pp": null,
  "membership_sha256": null
}
```

真实分数填数字，例如百分数值应直接填 `84.11` 而非 `0.8411`；不要写字符串 `"84.11%"`。未测指标保持 `null`。示例中的 0/0 代表尚未填写覆盖范围；一旦有相应成绩，就必须填写真实的非零支持。

### 10.3 决定能不能与旧表比较

完全相同的固定数据、支持和协议，可以挂在已有 track；不同数据修订、协议、训练用途或新 Test-only 结果另建 track。对于 API 的默认行为不可观测，应如实记录，不虚构已固定的内部权重版本。

`paper-reported` 仅用于从原论文录入的记录。你们新跑且完成审核的结果使用 `maintainer-verified`。别人提交但尚未审核的结果使用 `community-unverified`，不会进入页面上的正式排名。

这些状态只是维护规则，不会自动证明真实性。网站会检查部分元数据和支持范围来避免明显混比，但真正的样本 membership 仍需要维护者核验。相同样本数不代表样本相同。

### 10.4 追加到 leaderboard.json

打开 `data/leaderboard.json`，将完整新对象追加到 `models` 数组末尾。前一个对象后需要逗号，最后一个对象后不要多余逗号。使用新的唯一 `id`，不要复用旧模型的记录 ID。

不要只粘贴上面的 `metrics` 局部片段，必须使用 `new-result.example.json` 的完整字段结构。维护 `support.G`、`support.L`、`support.solve`，它们决定对应指标是否能参与该 track 的排名。

将顶层 `updated` 改为实际网页数据维护日期；不要把这个日期伪装成模型评测完成日期。保持 `data/archive/paper-2026-09-26.json` 不变以便追踪旧成绩。

### 10.5 检查并发布

```powershell
py scripts/validate.py
py -m http.server 8000 --bind 127.0.0.1
```

核对新增行、排名、模型配置弹窗、配对样本数和 CSV 导出。确认后提交：

```bash
git add data/leaderboard.json
git commit -m "Add reviewed results for MODEL_NAME"
git push
```

分支更新后 Pages 自动重新发布。网页运行时读取 JSON 并排序，不需要你手动写第 1 名、第 2 名，不需要改 HTML 表格。

未测某指标时，该单元格显示 `—`，不会被当成零分。排名在筛选前对整个选中 track 计算，所以只看开放权重模型时，第一行可能仍显示整体第 2 名，这是刻意保留原始排名的行为。

---

## 11. 后续新版数据的 track 怎么建

在 `tracks` 数组复制旧对象，设置新的 `id`、`label`、`description`、`benchmark_id`、`protocol_id` 和实际集合规模；填写能获得的真实 revision/commit/hash。新结果的 `track_id` 等字段必须匹配。网页下拉框自动出现新 track，一次只显示选中版本的成绩。

不要只把标签改成 `v2` 就以为版本管理完成。至少应冻结数据清单和 scorer，在更新日志里说明修正/移除/新增内容，保存旧快照，并明确哪些模型已经在新版重测。

页面顶部的 986/3341/553、“Models in the paper = 6”、论文图片与默认 population 说明框仍是**论文快照介绍**。新的 track 不会自动改写论文图中的数字。发布新版本时，按实际需要修改 `index.html` 的介绍或新增新版专门说明，不要用新版库存数字搭配旧论文图和旧成绩却不说明。

---

## 12. 接入他人的模型结果

模板包含 GitHub issue 表单。确认网站仓库已启用 Issues，并在 `site.json` 配置 `links.submission` 后，按钮会打开实际仓库的结果提交表单。

推荐流程为：第三方提交 → 你们审核版本、配置、覆盖和成绩产物 → 必要时复跑 → 更新 JSON → 合并发布。这不需要数据库，初期足够使用。

GitHub issue 不是自动评分服务；提交不会自动运行模型、写入成绩或进入排名。将来规模大了，再考虑真正的后端评测队列或受控 CI。不要让任意 PR 代码接触你的隐藏目标、云凭据或 API Key。

---

## 13. 把数据集发布到 Hugging Face 后接上按钮

在 Hugging Face 选择 New Dataset，确认所属账号/组织、数据集名与可见性。公开后地址通常形如：

```text
https://huggingface.co/datasets/OWNER/PhysAlign
```

将其放入 `links.dataset`。在真实数据仓库填写 `README.md` 数据卡；模板 `docs/DATASET_CARD_TEMPLATE.md` 可作为内容起点，但不是已经完成的数据集发布。

数据卡需要补齐真实的文件结构、字段含义、来源许可、数据修订、加载方法、评测方法和局限。请不要照搬一个未经真实数据测试的 `load_dataset` configuration 名。大体量数据和图片放数据仓库，宣传页面只保留少量缩略图。

原论文在 release statement 中区分源题图的上游权限和 PhysAlign 新增内容。不要给全部数据随意统一标 MIT/CC-BY 并假定能覆盖第三方材料；可发布的内容和重建索引应按真实许可逐项处理。私有目标或评分映射不能先上传公开仓库再仅在 Dataset Viewer 隐藏。

---

## 14. 图片与视觉修改

已从本次 PDF 裁入 Figure 1、2、3、4、9、10，页面可点击放大。它们是原论文图的预览，不是重新生成的实验图，也不是从 SeePhys 网站复制的图。

定稿发布时可从你原始图源导出清晰 WebP/PNG 或合适的 SVG，覆盖 `assets/img/` 中同名文件。如果更换格式、文件名或宽高，同步修改 `index.html` 的 `src`、`data-zoom`、`width` 和 `height`，避免链接失效或页面跳动。复杂图宜保留大图放大入口，手机上不要只依靠小字号全图阅读。

配色在 `assets/css/style.css` 顶部集中定义，例如：

```css
--ink: #182b38;
--accent: #176b70;
--accent-dark: #123b47;
--soft: #f3f7f7;
```

模板使用系统字体，不需要下载字体，不包含字体二进制文件。无需外部 CDN 就能显示基础界面。

首次公开前核查题图/示意图/标志的使用范围。代码的 MIT 许可不覆盖论文图、来源题目、数据集或第三方标志。

---

## 15. ICLR 匿名评审期间的注意事项

ICLR 2027 官方指南允许在评审期间将论文提交 arXiv，但仍要求投稿材料保持匿名，并对投稿中引用的代码、演示链接作相应匿名要求。因此，公开宣传页与供评审访问的匿名材料应分开考虑。

带作者、单位、实名组织、提交历史的 GitHub Pages 页面不能因为删掉一个作者区就自动视为匿名。不要机械地把正式宣传主页链接塞进匿名投稿材料；也不要写“ICLR 2027 accepted”，除非确实已经录用。

模板没有放访问统计脚本，但托管服务本身的日志、仓库元数据等不是本模板可以消除的。发布前按当时正式指南和组内决定处理，不把此处的通用提示当作会议合规保证。

---

## 16. 发布验收

至少实际检查以下项目，而不是只看到首页标题就结束：

1. 首屏的论文标题、作者顺序、单位、BibTeX 和三个资源按钮都正确；没有示例用户名、虚构发表信息或误链。
2. Main results 默认首行为 Gemini 3.8 Flash（GAcc 90.71）；切换 JAcc 后首行为 GPT-6 Astra（77.13）。这些是当前论文快照的结果，不是实时模型实力结论。
3. 搜索与开放权重/API 筛选正确；排序用数值而非字符串；空结果有提示；名次和筛选范围解释清楚。
4. 配对视图保留 412/397 实际样本数以及 +1.32/+2.20；诊断视图不把条件错误率当统一排行榜。
5. 点击模型能看到正确配置和运行创建日期；缺失的信息标为未提供，不被补成伪造元数据。
6. 手机视图正常；宽表允许横向滚动，整页不要出现横向溢出；图片可以放大且关闭。
7. CSV 能下载，BibTeX 在配置后能复制；正式部署网址下的 JSON 和图片没有 404。
8. 仓库与部署文件没有 API Key、私有目标、个人敏感数据或未授权源文件。

---

## 17. 常见故障

| 现象 | 优先检查 |
|---|---|
| 首页 404 | `index.html` 是否位于所选发布根目录；仓库名与所有者是否匹配；Pages 是否启用；Actions 是否成功 |
| 页面有标题但表格为空 | 是否双击 HTML 而不是 HTTP 预览；两个 JSON 是否语法错误/路径错误；运行 validator；查看浏览器 Console/Network |
| CSS、图片在项目页 404 | 是否误用了 `/assets/` 绝对根路径；资源是否漏传；文件名大小写是否一致 |
| 发了 commit 还看不到修改 | 查看 Actions 和实际访问网址；等待发布；Ctrl+F5 强制刷新；不要把本地 server 页面当线上页面 |
| 新模型没出现 | 是否加到 `models` 数组；track 是否选对；status 是否仍 unverified；当前筛选条件是否排除了该模型 |
| 新模型某指标没有名次 | 该指标是否 null；其支持集合/协议/固定版本标识是否匹配 track |
| 上传图片后仍是旧图 | 浏览器缓存、部署未完成、`src` 与 `data-zoom` 是否同时更新 |
| BibTeX 复制失败 | 先配置真实 BibTeX；访问 HTTPS 或 localhost；浏览器拒绝剪贴板时页面会选中文本供手动复制 |
| `.nojekyll` 看不到 | 点号文件可能被系统隐藏；直接在 GitHub 根目录新建 |
| `--release` 报错但普通检查通过 | 还有正式作者/URL/BibTeX 未填写；这不妨碍本地预览 |

---

## 18. 官方资料和参考页面

以下是制作时核查的公开资料；界面名称以后可能调整，以官方页面为准。

- SeePhys 项目页：https://seephys.github.io/
- GitHub Pages 类型与网址规则：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- 创建 GitHub Pages 网站：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- 配置分支发布源：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Pages HTTPS：https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Hugging Face 创建数据集：https://huggingface.co/docs/hub/datasets-adding
- Hugging Face Dataset Card：https://huggingface.co/docs/hub/datasets-cards
- ICLR 2027 Author Guidelines：https://iclr.cc/Conferences/2027/AuthorGuidelines

论文依据：主体标题与任务定义；§3.3 数据规模；§4.2 指标集合与聚合；Table 2 主结果；Appendix B.3–B.5 计分、SolveAcc 与 observed paired coverage；Table 8 设置；Tables 9–10 条件诊断与四象限；Appendix A.4–A.5 旧库存/补充候选/后续修订的边界；Appendix F 的权限与发布说明。
