# 🚀 Git 仓库设置指南

## 📋 项目已准备好提交到 Git

项目结构已优化，`.gitignore` 已配置，可以直接提交到 Git 仓库。

---

## 🎯 Git 仓库结构

```
F:\glmCodePlan/
├── ✅ 应该提交的文件
│   ├── src/              # 所有源代码
│   ├── tests/            # 测试文件
│   ├── docs/             # 所有文档
│   ├── package.json      # 项目配置
│   ├── .gitignore        # 忽略规则
│   ├── README.md         # 主文档
│   ├── 快速开始.md        # 快速指南
│   └── PROJECT_STRUCTURE.md  # 结构说明
│
└── ❌ 不会提交的文件（已忽略）
    ├── node_modules/     # 依赖包
    ├── logs/             # 日志文件
    ├── screenshots/      # 截图文件
    └── package-lock.json # 依赖锁定（可选）
```

---

## 📝 Git 提交步骤

### 1. 初始化仓库（如果尚未初始化）

```bash
cd F:\glmCodePlan
git init
```

### 2. 添加文件

```bash
# 添加所有未忽略的文件
git add .
```

### 3. 查看状态

```bash
# 确认哪些文件会被提交
git status
```

**预期输出**：
```
On branch master
No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   .gitignore
        new file:   PROJECT_STRUCTURE.md
        new file:   README.md
        new file:   docs/精准对时策略.md
        new file:   docs/时间同步解决方案.md
        new file:   docs/抢购失败分析指南.md
        ...
        new file:   package.json
        new file:   src/auto-buy-glm-pro-optimized.js
        new file:   src/auto-buy-glm-pro-precision.js
        ...
        new file:   tests/test-logger-system.js
        new file:   快速开始.md
```

### 4. 提交

```bash
git commit -m "Initial commit: 智谱 AI 自动抢购脚本"
```

### 5. 关联远程仓库（可选）

```bash
# 添加远程仓库
git remote add origin https://github.com/your-username/glm-auto-buy.git

# 推送到远程
git push -u origin master
```

---

## 🔍 .gitignore 说明

项目已配置完善的 `.gitignore` 文件，自动忽略：

### 1. 依赖目录

```
node_modules/
```
- npm 安装的依赖包
- 体积大，可通过 `npm install` 重新安装

### 2. 自动生成的文件

```
logs/
screenshots/
*.log
*.png
```
- 脚本运行时自动生成的日志和截图
- 每次运行都会产生新文件

### 3. 系统临时文件

```
.DS_Store          # macOS
Thumbs.db          # Windows
desktop.ini        # Windows
```
- 操作系统自动生成的缓存文件

### 4. IDE 和编辑器

```
.vscode/           # VS Code
.idea/             # IntelliJ IDEA
*.iml              # 项目文件
```
- 编辑器配置（可选提交）

### 5. 敏感信息

```
.env
*.key
*.pem
credentials.json
```
- 环境变量和密钥文件
- **绝对不要提交**

---

## 📊 文件大小统计

### 会提交的文件

| 类别 | 数量 | 总大小 |
|------|------|--------|
| 源代码 | 5 | ~50 KB |
| 文档 | 10 | ~100 KB |
| 配置 | 2 | ~5 KB |
| **总计** | **17** | **~155 KB** |

### 不会提交的文件

| 类别 | 数量 | 总大小 |
|------|------|--------|
| node_modules | ~200 | ~200 MB |
| logs (每次运行) | ~50 | ~50 MB |
| screenshots | 可变 | ~10 MB |
| **总计** | **~250** | **~260 MB** |

**忽略后仓库体积减少 99.9%！**

---

## 🎯 分支管理建议

### 主分支

- `master` / `main` - 稳定版本
- 只接受经过测试的代码

### 开发分支

- `develop` - 开发分支
- 功能开发在此分支进行

### 功能分支

- `feature/precision-timing` - 精准对时功能
- `feature/logger-system` - 日志系统
- 完成后合并到 `develop`

---

## 📝 提交信息规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具配置

### 示例

```bash
# 新功能
git commit -m "feat: 添加精准对时版本脚本"

# 修复
git commit -m "fix: 修复时间同步问题"

# 文档
git commit -m "docs: 更新 Git 设置指南"

# 重构
git commit -m "refactor: 优化项目结构"
```

---

## 🔄 同步到远程仓库

### 推送到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/your-username/glm-auto-buy.git

# 推送
git push -u origin master
```

### 推送到 Gitee（国内）

```bash
# 添加远程仓库
git remote add origin https://gitee.com/your-username/glm-auto-buy.git

# 推送
git push -u origin master
```

### 推送到多个远程

```bash
# 添加多个远程
git remote add github https://github.com/your-username/glm-auto-buy.git
git remote add gitee https://gitee.com/your-username/glm-auto-buy.git

# 推送到所有远程
git push github master
git push gitee master
```

---

## 🛡️ 安全提示

### 不要提交的内容

- ❌ API 密钥
- ❌ 账号密码
- ❌ 数据库连接字符串
- ❌ 个人身份信息
- ❌ 公司机密代码

### 检查敏感信息

```bash
# 搜索可能的敏感信息
grep -r "password" src/
grep -r "secret" src/
grep -r "key" src/
grep -r "token" src/
```

### 如果不小心提交了

```bash
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销提交并删除更改
git reset --hard HEAD~1

# 从历史记录中删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret/file" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📦 分享给他人使用

### 1. 推送到公开仓库

```bash
# GitHub
git push origin master

# Gitee
git push origin master
```

### 2. 提供安装说明

```bash
# 克隆仓库
git clone https://github.com/your-username/glm-auto-buy.git
cd glm-auto-buy

# 安装依赖
npm install
npx playwright install chromium

# 运行
npm start
```

### 3. 添加开源许可证（可选）

```bash
# MIT License
echo "MIT License" > LICENSE
git add LICENSE
git commit -m "docs: add MIT license"
```

---

## 🎯 总结

### ✅ 已完成

- [x] 项目结构优化
- [x] `.gitignore` 配置
- [x] 清理临时文件
- [x] 文档整理
- [x] Git 仓库初始化

### 🚀 下一步

1. 提交到本地 Git
2. 关联远程仓库（可选）
3. 推送到 GitHub/Gitee
4. 分享给他人使用

---

*祝你使用愉快！🎉*

*最后更新：2026-04-08*
