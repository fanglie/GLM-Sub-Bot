# 📁 智谱 AI 自动抢购 - 项目结构

## 🏗️ 目录结构

```
F:\glmCodePlan/
├── 📄 README.md                    # 主文档（项目说明、快速开始）
├── 📄 package.json                 # 项目配置、依赖管理
├── 📄 package-lock.json            # 依赖版本锁定
│
├── 📂 src/                         # 源代码目录
│   ├── auto-buy-logger.js          # 日志核心模块
│   ├── auto-buy-glm-pro-optimized.js  # 优化版抢购脚本（推荐使用）
│   ├── auto-buy-glm-pro.js         # 标准版抢购脚本
│   └── auto-buy-glm-pro-test.js    # 测试脚本
│
├── 📂 tests/                       # 测试文件目录
│   └── test-logger-system.js       # 日志系统测试
│
├── 📂 docs/                        # 文档目录
│   ├── 抢购失败分析指南.md         # 重点阅读：失败分析方法
│   ├── 日志系统说明.md             # 日志系统总结
│   ├── LOGGER_USAGE.md             # 日志 API 文档
│   ├── REFERRAL_LINK.md            # 推荐链接说明
│   ├── QUICKSTART.md               # 快速开始指南
│   ├── 配置完成.md                 # 配置总结
│   └── 文件索引.md                 # 原文件索引（已更新）
│
├── 📂 logs/                        # 日志文件目录（自动生成）
│   └── auto-buy_YYYY-MM-DD.log     # 按时间戳命名的日志文件
│
├── 📂 screenshots/                 # 截图目录（自动生成）
│   ├── payment_page_*.png          # 支付页面截图
│   ├── error_*.png                 # 错误截图
│   └── progress_*.png              # 进度截图
│
└── 📂 config/                      # 配置文件目录（预留）
    └── .gitkeep                    # 保持目录存在
```

---

## 📂 目录说明

### `src/` - 源代码
存放所有可执行的脚本文件。

| 文件 | 用途 | 推荐使用 |
|------|------|----------|
| `auto-buy-logger.js` | 日志核心模块 | 内部使用 |
| `auto-buy-glm-pro-optimized.js` | **优化版抢购脚本** | ✅ 强烈推荐 |
| `auto-buy-glm-pro.js` | 标准版抢购脚本 | 备用 |
| `auto-buy-glm-pro-test.js` | 测试脚本 | 测试用 |

### `tests/` - 测试文件
存放所有测试脚本和测试输出。

| 文件 | 用途 |
|------|------|
| `test-logger-system.js` | 测试日志系统功能 |

### `docs/` - 文档
存放所有 Markdown 格式的文档。

| 文档 | 用途 | 阅读优先级 |
|------|------|-----------|
| `抢购失败分析指南.md` | 抢购失败后的分析方法 | ⭐⭐⭐ 必读 |
| `日志系统说明.md` | 日志系统快速总结 | ⭐⭐ 推荐 |
| `LOGGER_USAGE.md` | 日志 API 详细文档 | ⭐ 参考 |
| `REFERRAL_LINK.md` | 推荐链接说明 | ⭐ 参考 |
| `QUICKSTART.md` | 快速开始指南 | ⭐⭐ 推荐 |
| `配置完成.md` | 配置总结 | ⭐ 参考 |
| `文件索引.md` | 原文件索引（已更新） | - |

### `logs/` - 日志文件
**自动生成**，存放每次运行生成的日志文件。

- 文件名格式：`auto-buy_YYYY-MM-DDTHH-mm-ss-SSSZ.log`
- 自动保留最近 50 个日志文件
- 每次会话约 1-10MB

### `screenshots/` - 截图
**自动生成**，存放关键时刻的截图。

- 错误截图：`error_*.png`
- 成功截图：`payment_page_*.png`
- 进度截图：`progress_*.png`
- 每张截图约 100-500KB

### `config/` - 配置文件
**预留目录**，用于存放未来可能的配置文件。

---

## 🚀 快速开始

### 1. 运行抢购脚本（优化版）

```bash
# 方法 A：使用 npm
npm start

# 方法 B：直接运行
node src/auto-buy-glm-pro-optimized.js
```

### 2. 运行测试脚本

```bash
# 方法 A：使用 npm
npm test

# 方法 B：直接运行
node src/auto-buy-glm-pro-test.js
```

### 3. 测试日志系统

```bash
npm run test:logger
```

### 4. 运行标准版脚本

```bash
npm run start:standard
```

---

## 📖 文档导航

### 新手必读
1. **主 README.md** - 项目说明和快速开始
2. **docs/QUICKSTART.md** - 快速开始指南
3. **docs/抢购失败分析指南.md** - 失败分析方法

### 参考资料
- **docs/日志系统说明.md** - 日志系统总结
- **docs/LOGGER_USAGE.md** - 日志 API 文档
- **docs/REFERRAL_LINK.md** - 推荐链接说明

---

## 🔧 常用命令

### Windows PowerShell

```powershell
# 运行抢购脚本
npm start

# 查看最新日志
Get-Content logs\auto-buy_*.log -Tail 100

# 查看所有错误
Select-String -Path logs\auto-buy_*.log -Pattern "\[ERROR\]" -Context 3

# 查看库存状态
Select-String -Path logs\auto-buy_*.log -Pattern "库存状态"

# 打开截图目录
explorer screenshots
```

### Linux/Mac

```bash
# 运行抢购脚本
npm start

# 查看最新日志
tail -n 100 logs/auto-buy_*.log

# 查看所有错误
grep "\[ERROR\]" logs/auto-buy_*.log -A 3

# 实时查看日志
tail -f logs/auto-buy_*.log

# 打开截图目录
open screenshots  # Mac
xdg-open screenshots  # Linux
```

---

## 📊 文件组织原则

### 1. **代码与文档分离**
- 可执行代码 → `src/`
- 文档说明 → `docs/`
- 测试代码 → `tests/`

### 2. **自动生成文件独立存放**
- 日志文件 → `logs/`
- 截图文件 → `screenshots/`

### 3. **清晰的引用路径**
- 脚本间引用：`require('./auto-buy-logger')`（同目录）
- 跨目录引用：`require('../src/auto-buy-logger')`（tests 引用 src）

### 4. **便于扩展**
- 配置文件预留 `config/` 目录
- 测试文件集中到 `tests/`

---

## 🎯 项目结构优势

### 之前（混乱）
```
F:\glmCodePlan/
├── auto-buy-logger.js
├── auto-buy-glm-pro-optimized.js
├── auto-buy-glm-pro.js
├── auto-buy-glm-pro-test.js
├── test-logger-system.js
├── README.md
├── QUICKSTART.md
├── LOGGER_USAGE.md
├── REFERRAL_LINK.md
├── 抢购失败分析指南.md
├── 日志系统说明.md
├── 配置完成.md
├── 文件索引.md
├── package.json
├── page-snapshot-*.png
└── logs/
└── screenshots/
```
❌ 问题：所有文件堆在根目录，难以查找

### 现在（清晰）
```
F:\glmCodePlan/
├── README.md              # 只需看这个
├── package.json
├── src/                   # 所有脚本
├── tests/                 # 所有测试
├── docs/                  # 所有文档
├── logs/                  # 日志自动存放
└── screenshots/           # 截图自动存放
```
✅ 优势：结构清晰，易于维护

---

## 📝 迁移说明

所有文件已从根目录迁移到新位置：

| 原位置 | 新位置 |
|--------|--------|
| `auto-buy-logger.js` | `src/auto-buy-logger.js` |
| `auto-buy-glm-pro-optimized.js` | `src/auto-buy-glm-pro-optimized.js` |
| `auto-buy-glm-pro.js` | `src/auto-buy-glm-pro.js` |
| `auto-buy-glm-pro-test.js` | `src/auto-buy-glm-pro-test.js` |
| `test-logger-system.js` | `tests/test-logger-system.js` |
| `*.md`（文档） | `docs/*.md` |
| `*.png`（截图） | `screenshots/*.png` |

**所有引用路径已更新**，脚本可以正常运行。

---

## 🔍 快速查找文件

### 我要运行脚本
```bash
npm start  # 优化版
npm test   # 测试版
```

### 我要看文档
```bash
# 主文档
cat README.md

# 快速开始
cat docs/QUICKSTART.md

# 失败分析
cat docs/抢购失败分析指南.md
```

### 我要查看日志
```bash
# Windows
Get-Content logs\auto-buy_*.log -Tail 100

# Mac/Linux
tail -n 100 logs/auto-buy_*.log
```

### 我要查看截图
```bash
# Windows
explorer screenshots

# Mac
open screenshots

# Linux
xdg-open screenshots
```

---

*最后更新：2026-04-08*
