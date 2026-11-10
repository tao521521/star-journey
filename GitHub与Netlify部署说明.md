# GitHub 版本管理与 Netlify 持续部署

## 当前项目的实际参数

本项目为原生 HTML/CSS/JavaScript 静态网站，没有 package.json，无需 npm 安装或构建。dist 是网站源码目录，必须提交到 Git，不能将其加入忽略列表。

| 项目 | 配置 |
| --- | --- |
| 建议仓库名 | star-journey |
| 正式分支 | main |
| Base directory | 留空（仓库根目录） |
| Package directory | 留空 |
| Build command | 留空 |
| Publish directory | dist |

根目录 netlify.toml 已声明空构建命令和发布目录，适用于正式部署与预览部署。Python run.py 只负责本地展示，不应当配置为线上服务。

## 首次上传

在 GitHub 的个人账号或团队组织下建立空仓库 star-journey。建议先使用私有仓库；不要同时自动创建 README，以免与本地已有历史冲突。

从本文件所在的 xinghuo 目录上传整个仓库，包括 dist、tests、文档、netlify.toml 和 .github。不要仅上传压缩包，也不要把外层“星火征程”目录整体上传。

本地已存在 main 分支及初始提交。账号连接后配置 GitHub 远程并推送即可，不需要重新初始化，也不要强制推送覆盖已有远程历史。

## 连接 Netlify

如果已有 Netlify 站点，在该站点的持续部署设置中连接 GitHub，并选择正确仓库，正式分支选择 main。若尚无 Netlify 站点，可在 Netlify 新建站点并从 Git 导入。

连接时授权范围优先仅包含 star-journey 仓库。按上面的实际参数配置，并检查 Netlify 的部署预览功能是否已开启。GitHub 私有仓库不等同于网页私密访问，网页访问权限需在 Netlify 单独确认。

不要为了部署此静态项目配置付费数据库、服务器或环境密钥。

## 日常协作

1. 从 main 创建功能分支，例如 feature/chapter-improvements。
2. 修改、运行本地测试并提交，推送到 GitHub。
3. 创建面向 main 的 Pull Request。GitHub 会运行 Site checks；连接正常且启用预览时，Netlify 会生成预览网址。
4. 团队在电脑与手机检查预览，通过后合并到 main，触发正式站点部署。
5. 在 GitHub 仓库规则中为 main 配置 PR 审查及 Site checks 必须通过，可避免未经检查的代码合入。当前配置本身不会自动创建仓库保护规则。

本地测试命令：node --test tests/core.test.cjs。

## 回退

共享仓库优先用 git revert 创建撤销提交，再推送到 main 触发重新部署。避免使用 reset 后强制推送，防止改写伙伴已经拉取的历史。

Netlify 的预览部署与 GitHub 检查是两套机制：Actions 失败不会自动阻止 Netlify 部署；需要通过 main 的合并保护落实质量要求。

## 官方参考

- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://docs.netlify.com/deploy/deploy-types/deploy-previews/
