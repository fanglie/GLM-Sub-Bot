# 智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本

## 📋 功能说明

本脚本用于在每天 10:00 库存开放时，自动访问智谱 AI GLM Coding 订阅页面并点击 Pro 套餐订阅按钮，帮助你突破网页卡顿，快速进入支付流程。

**脚本仅自动化点击订阅按钮，支付环节需要手动完成。**

### 🎯 优化版特性

`auto-buy-glm-pro-optimized.js` 是基于实际页面分析的优化版本，包含：

- ✅ **精确选择器**：使用从页面分析得到的真实 ref 和 class
- ✅ **库存监控**：实时检测库存状态（售罄/可用）
- ✅ **自动登录检测**：未登录时等待用户手动登录
- ✅ **快速重试**：200ms 重试间隔，确保不错过库存释放
- ✅ **定期刷新**：每 10 次尝试自动刷新页面
- ✅ **成功截图**：进入支付页面后自动截图保存
- ✅ **好友推荐链接**：自动使用推荐链接访问，享受优惠

**推荐使用优化版脚本！**

### 🔗 好友推荐链接

脚本已配置使用好友推荐链接：

```
https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH
```

使用推荐链接订阅的好处：
- 🎁 你可能获得额外优惠或折扣
- 🤝 推荐人可能获得返利奖励
- 📊 双方都可能获得额外权益

**注意**：推荐链接参数 `ic=GVUM2QVEWH` 已内置在所有脚本中，无需手动添加。

## 🚀 快速开始

### 1. 安装 Node.js

如果尚未安装，请从 [https://nodejs.org/](https://nodejs.org/) 下载并安装 Node.js（推荐 LTS 版本）。

### 2. 安装依赖

打开命令行（CMD 或 PowerShell），进入脚本目录：

```bash
cd F:\glmCodePlan
```

安装 Playwright 浏览器自动化库：

```bash
npm install
```

安装 Playwright 浏览器（首次运行会自动下载）：

```bash
npx playwright install chromium
```

### 3. 首次测试（强烈推荐）

在正式抢购前，先测试脚本是否能正常工作：

```bash
npm run test
```

测试脚本会：
- 打开浏览器访问智谱 AI 订阅页面
- 尝试查找订阅按钮
- 截图保存页面状态
- 列出所有找到的按钮

**如果测试失败**，说明需要调整选择器配置（见下方"高级配置"）。

### 4. 正式使用

#### 方法 A：运行优化版（推荐）

```bash
node auto-buy-glm-pro-optimized.js
```

优化版特性：
- 精确的页面选择器（基于实际分析）
- 实时库存状态监控
- 自动登录检测
- 快速重试机制（200ms 间隔）
- 定期页面刷新

#### 方法 B：运行标准版

```bash
npm start
```

标准版适合在优化版无法工作时使用。

### 方法 C：修改为立即执行（用于测试）

编辑 `auto-buy-glm-pro-optimized.js` 文件，找到最后一行附近：

```javascript
const RUN_IMMEDIATELY = false;
```

改为：

```javascript
const RUN_IMMEDIATELY = true;
```

然后运行 `node auto-buy-glm-pro-optimized.js` 即可立即测试。

## ⚙️ 高级配置

### 保持登录状态（推荐）

如果每次运行都需要重新登录，可以配置使用 Chrome 用户数据：

1. 找到你的 Chrome 用户数据路径：
   - **Windows**: `C:\Users\你的用户名\AppData\Local\Google\Chrome\User Data`
   - **Mac**: `/Users/你的用户名/Library/Application Support/Google/Chrome/Default`

2. 编辑 `auto-buy-glm-pro.js`，找到：

```javascript
USER_DATA_DIR: false,
```

改为你的路径（Windows 示例）：

```javascript
USER_DATA_DIR: 'C:\\Users\\YourName\\AppData\\Local\\Google\\Chrome\\User Data',
```

注意：路径中的反斜杠需要双写 `\\`。

### 调整抢购时间

编辑 `auto-buy-glm-pro.js`，找到：

```javascript
BUY_HOUR: 10,
BUY_MINUTE: 0,
BUY_SECOND: 0,
```

修改为你需要的时间（24 小时制）。

### 调整重试策略

```javascript
MAX_RETRIES: 10,        // 最大重试次数
RETRY_DELAY: 500,       // 重试间隔（毫秒）
```

如果网络很慢，可以增加重试次数和间隔。

### 自定义选择器

如果页面结构变化导致找不到按钮，需要更新选择器配置：

```javascript
const SELECTORS = {
  proPlanCard: '[data-plan="pro"], .plan-card:has-text("Pro")',
  
  proButtonTexts: [
    '立即订阅 Pro',
    '订阅 Pro 套餐',
    '购买 Pro',
    'Pro 连续包月',
    '选择 Pro',
  ],
  // ... 其他配置
};
```

运行测试脚本 (`npm run test`) 可以查看当前页面的按钮列表，帮助你找到正确的选择器。

## 💡 使用技巧

### 1. 提前登录

在抢购前 5-10 分钟，手动打开浏览器登录账号，这样可以：
- 避免登录验证耗时
- 确保账号状态正常
- 提前加载页面资源

### 2. 使用用户数据目录

配置 `USER_DATA_DIR` 后，脚本会复用你已登录的 Chrome 会话，无需每次重新登录。

### 3. 监控日志

脚本运行时会输出详细日志：
- `[INFO]`: 正常信息
- `[SUCCESS]`: 成功操作
- `[WARNING]`: 警告（可忽略）
- `[ERROR]`: 错误（需要关注）

### 4. 失败处理

如果抢购失败，脚本会：
- 保持浏览器打开
- 你可以手动尝试订阅
- 查看错误日志分析原因

常见失败原因：
- **库存不足**: 需要第二天继续
- **未登录**: 先手动登录
- **选择器失效**: 页面结构变化，需要更新配置

## 🔧 故障排查

### 问题 1：找不到订阅按钮

**解决方案**：
1. 运行测试脚本：`npm run test`
2. 查看输出的按钮列表
3. 找到包含"订阅"或"Pro"的按钮文本
4. 更新 `proButtonTexts` 配置

### 问题 2：每次都需要重新登录

**解决方案**：
配置 `USER_DATA_DIR` 为你的 Chrome 用户数据路径（见"高级配置"）。

### 问题 3：脚本报错 "Cannot find module 'playwright'"

**解决方案**：
```bash
npm install
```

### 问题 4：浏览器无法启动

**解决方案**：
```bash
npx playwright install chromium
```

### 问题 5：点击后没有进入支付页面

**可能原因**：
- 库存已售罄
- 账号不符合条件（如未实名认证）
- 页面加载太慢

**解决方案**：
查看日志输出，根据错误信息调整策略。

## ⚠️ 重要提示

1. **本脚本仅用于自动化点击订阅按钮**，不能替代支付流程
2. **请确保账号已完成实名认证**，否则无法完成订阅
3. **脚本不能保证 100% 成功**，受网络、服务器状态等影响
4. **请合法使用**，不要用于恶意抢购或攻击

## 📝 文件说明

- `auto-buy-glm-pro.js` - 主脚本（定时执行）
- `auto-buy-glm-pro-test.js` - 测试脚本（立即执行）
- `package.json` - 项目配置
- `README.md` - 说明文档

## 🆘 获取帮助

如果遇到问题：

1. 查看脚本输出的日志
2. 运行测试脚本诊断问题
3. 检查智谱 AI 官网是否正常访问
4. 确认账号登录状态和实名认证

## 📄 许可证

MIT License
