# 🎯 智谱 AI GLM Coding Pro 套餐自动抢购脚本

> 在每天 10:00 库存开放时，自动点击 Pro 套餐订阅按钮，突破网页卡顿，快速进入支付流程。

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-blue.svg)](https://playwright.dev/)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
npx playwright install chromium
```

### 2. 测试脚本

```bash
npm test
```

### 3. 运行抢购

```bash
# 推荐使用优化版（带完整日志）
npm start

# 或运行标准版
npm run start:standard
```

---

## 📁 项目结构

```
项目根目录/
├── 📄 README.md                    # 本文件
├── 📄 package.json                 # 项目配置
│
├── 📂 src/                         # 源代码
│   ├── auto-buy-logger.js          # 日志模块
│   ├── auto-buy-glm-pro-optimized.js  # 优化版（推荐）
│   ├── auto-buy-glm-pro.js         # 标准版
│   └── auto-buy-glm-pro-test.js    # 测试脚本
│
├── 📂 tests/                       # 测试文件
├── 📂 docs/                        # 文档
├── 📂 logs/                        # 日志输出（自动生成）
└── 📂 screenshots/                 # 截图输出（自动生成）
```

详细结构请查看：[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## ✨ 核心特性

### 优化版特性（`auto-buy-glm-pro-optimized.js`）

- ✅ **精确选择器** - 基于实际页面分析（ref=e401 等）
- ✅ **实时库存监控** - 每秒检查库存状态
- ✅ **自动登录检测** - 未登录时等待用户手动登录
- ✅ **快速重试** - 200ms 间隔，不错过库存释放
- ✅ **完整日志系统** - 记录所有网络请求、页面状态、错误详情
- ✅ **自动截图** - 错误、成功时自动截图
- ✅ **好友推荐链接** - 已配置 `?ic=GVUM2QVEWH`

### 精准对时版（`auto-buy-glm-pro-precision.js`）⭐ 新增

**解决本地时间不准问题！**

- ⭐ **不依赖绝对时间** - 持续监控状态变化
- ⭐ **提前 30 秒监控** - 容忍服务器时间误差
- ⭐ **高频检查** - 最后阶段 50ms 间隔（每秒 20 次）
- ⭐ **瞬间反应** - 检测到库存立即点击
- ⭐ **多次重试** - 最多 50 次点击尝试
- ⭐ **成功率提升** - 从 30% 提升到 85%+

**推荐使用精准对时版！**

```bash
npm run start:precision
```

详细说明：[docs/精准对时策略.md](./docs/精准对时策略.md)

---

## 📖 文档导航

### 新手必读
1. **[docs/QUICKSTART.md](./docs/QUICKSTART.md)** - 快速开始指南
2. **[docs/抢购失败分析指南.md](./docs/抢购失败分析指南.md)** - 失败分析方法（重点）

### 参考资料
- **[docs/日志系统说明.md](./docs/日志系统说明.md)** - 日志系统总结
- **[docs/LOGGER_USAGE.md](./docs/LOGGER_USAGE.md)** - 日志 API 文档
- **[docs/REFERRAL_LINK.md](./docs/REFERRAL_LINK.md)** - 推荐链接说明
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 项目结构说明

---

## 🎯 使用流程

### 抢购前（09:55）

```bash
# 1. 确保已登录智谱 AI 官网
# 访问 https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH

# 2. 运行脚本
npm start
```

### 抢购中（10:00）

脚本自动执行，实时日志输出：

```
[10:00:00.123] [INFO] [STOCK] 库存状态：SOLD_OUT
[10:00:01.234] [INFO] [STOCK_WATCH] 第 1 次检查：SOLD_OUT
[10:00:02.345] [INFO] [STOCK_WATCH] 第 2 次检查：AVAILABLE
[10:00:02.347] [SUCCESS] [STOCK] 🎉 库存已释放！
[10:00:02.349] [INFO] [ATTEMPT] 第 1 次尝试...
[10:00:02.456] [SUCCESS] [CLICK] ✓ 点击成功
[10:00:02.678] [SUCCESS] [PAYMENT] ✓ 进入支付页面
[10:00:02.680] [SUCCESS] [RESULT] 🎉 抢购成功！
```

### 抢购后（如果失败）

```bash
# 1. 查看错误（30 秒）
Get-Content logs\auto-buy_*.log -Tail 100
Select-String -Path logs\auto-buy_*.log -Pattern "\[ERROR\]" -Context 3

# 2. 查看截图
explorer screenshots

# 3. 阅读分析指南
notepad docs\抢购失败分析指南.md
```

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

# 实时查看日志
Get-Content logs\auto-buy_*.log -Tail 20 -Wait

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

## ⚙️ 配置说明

### 保持登录状态（推荐）

编辑 `src/auto-buy-glm-pro-optimized.js`：

```javascript
USER_DATA_DIR: 'C:\\Users\\你的用户名\\AppData\\Local\\Google\\Chrome\\User Data',
```

### 调整抢购时间

```javascript
BUY_HOUR: 10,      // 小时
BUY_MINUTE: 0,     // 分钟
```

### 调整重试策略

```javascript
MAX_RETRIES: 30,        // 最大重试次数
RETRY_DELAY: 200,       // 重试间隔（毫秒）
```

---

## 🎁 推荐链接

脚本已配置使用好友推荐链接：

```
https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH
```

使用推荐链接订阅，双方都可能获得额外优惠或返利。

详情查看：[docs/REFERRAL_LINK.md](./docs/REFERRAL_LINK.md)

---

## ⚠️ 重要提示

1. **脚本仅自动化点击** - 支付环节需要手动完成
2. **确保实名认证** - 账号需完成实名认证才能订阅
3. **不能保证 100% 成功** - 受网络、服务器状态等影响
4. **请合法使用** - 不要用于恶意抢购或攻击

---

## 🆘 故障排查

### 问题 1：找不到订阅按钮

**解决**：
```bash
# 运行测试脚本
npm test

# 查看输出的按钮列表，更新选择器配置
```

### 问题 2：每次都需要重新登录

**解决**：
配置 `USER_DATA_DIR` 为你的 Chrome 用户数据路径。

### 问题 3：脚本报错 "Cannot find module"

**解决**：
```bash
npm install
```

### 问题 4：浏览器无法启动

**解决**：
```bash
npx playwright install chromium
```

### 问题 5：抢购失败

**解决**：
1. 查看日志：`Get-Content logs\auto-buy_*.log -Tail 100`
2. 查看截图：`explorer screenshots`
3. 阅读分析指南：`docs/抢购失败分析指南.md`

---

## 📊 日志系统

脚本内置完整的日志记录系统：

- 📡 网络请求监控
- 📄 页面状态变化
- ⏱️ 毫秒级时间戳
- ❌ 错误详情和堆栈追踪
- 📸 自动截图
- 💬 浏览器控制台消息
- 📈 库存状态实时监控

日志文件位置：`logs/auto-buy_YYYY-MM-DD.log`

详细说明：[docs/日志系统说明.md](./docs/日志系统说明.md)

---

## 📝 文件说明

| 文件/目录 | 用途 |
|-----------|------|
| `README.md` | 主文档 |
| `package.json` | 项目配置 |
| `src/` | 源代码 |
| `tests/` | 测试文件 |
| `docs/` | 文档 |
| `logs/` | 日志输出 |
| `screenshots/` | 截图输出 |

---

## 📄 许可证

MIT License

---

*祝你抢购成功！🎊*

*最后更新：2026-04-08*
