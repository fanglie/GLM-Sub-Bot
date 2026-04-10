# 🚀 快速开始 - 智谱 AI GLM Coding Pro 套餐抢购

## 第一步：安装依赖（仅需一次）

```bash
# 进入项目目录（克隆仓库后自动位于正确目录）

# 安装 npm 包
npm install

# 安装 Playwright 浏览器（首次运行需要）
npx playwright install chromium
```

## 第二步：测试脚本（强烈推荐）

```bash
# 运行测试脚本，查看页面按钮
node auto-buy-glm-pro-test.js
```

测试脚本会：
1. 打开浏览器访问智谱 AI 订阅页面（带推荐链接）
2. 列出所有找到的按钮
3. 截图保存页面状态
4. 帮助你确认脚本能正常工作

## 第三步：配置用户数据目录（保持登录状态）

编辑 `auto-buy-glm-pro-optimized.js`，找到第 21 行附近：

```javascript
USER_DATA_DIR: 'C:\\Users\\fanglie\\AppData\\Local\\Google\\Chrome\\User Data',
```

如果路径不正确，请修改为你的 Chrome 用户数据路径：

**Windows 默认路径**：
```
C:\Users\你的用户名\AppData\Local\Google\Chrome\User Data
```

**Mac 默认路径**：
```
/Users/你的用户名/Library/Application Support/Google/Chrome/Default
```

配置后，脚本会复用你已登录的 Chrome 会话，无需每次重新登录。

## 第四步：运行抢购脚本

### 方式 A：定时执行（等到 10:00）

```bash
node auto-buy-glm-pro-optimized.js
```

脚本会：
1. 计算距离下次 10:00 的时间
2. 提前 5 分钟启动浏览器准备
3. 自动检测登录状态
4. **使用推荐链接访问** (`?ic=GVUM2QVEWH`)
5. 10:00 时快速点击订阅按钮
6. 成功后进入支付页面

### 方式 B：立即执行（测试用）

编辑 `auto-buy-glm-pro-optimized.js`，找到最后一行：

```javascript
const RUN_IMMEDIATELY = false;
```

改为：

```javascript
const RUN_IMMEDIATELY = true;
```

然后运行：

```bash
node auto-buy-glm-pro-optimized.js
```

## ⚙️ 关键配置说明

### 1. 用户数据目录（重要）

```javascript
USER_DATA_DIR: 'C:\\Users\\你的用户名\\AppData\\Local\\Google\\Chrome\\User Data',
```

**作用**：复用已登录的 Chrome 会话，避免每次重新登录。

**如何查找路径**：
1. 打开 Chrome 浏览器
2. 地址栏输入：`chrome://version/`
3. 查看"个人资料路径"

### 2. 抢购时间

```javascript
BUY_HOUR: 10,      // 小时（24 小时制）
BUY_MINUTE: 0,     // 分钟
BUY_SECOND: 0,     // 秒
```

默认是每天 10:00，如需调整可修改此处。

### 3. 重试策略

```javascript
MAX_RETRIES: 30,        // 最大重试次数
RETRY_DELAY: 200,       // 重试间隔（毫秒）
```

- 网络慢可增加 `RETRY_DELAY`
- 竞争激烈可增加 `MAX_RETRIES`

### 4. 立即执行测试

```javascript
RUN_IMMEDIATELY: true,  // 立即执行（测试用）
RUN_IMMEDIATELY: false, // 定时执行（正式用）
```

## 💡 使用技巧

### 1. 提前登录

在抢购前 5-10 分钟：
1. 手动打开 Chrome 浏览器
2. 访问 https://www.bigmodel.cn/glm-coding
3. 登录账号
4. 确保已完成实名认证

### 2. 验证登录状态

运行测试脚本：

```bash
node auto-buy-glm-pro-test.js
```

如果看到"继续订阅"按钮，说明已登录。

### 3. 监控日志

脚本运行时会输出：
- `[INFO]`: 正常信息
- `[SUCCESS]`: 成功操作
- `[WARNING]`: 警告
- `[ERROR]`: 错误

关注关键信息：
- "检测到已登录状态"
- "库存已释放！"
- "成功进入支付页面！"

### 4. 失败处理

如果抢购失败：
- 脚本会保持浏览器打开
- 你可以手动尝试订阅
- 查看日志分析原因

常见失败原因：
1. **库存售罄**：等待第二天 10:00
2. **未登录**：手动登录后重试
3. **网络延迟**：增加重试次数

## 📊 预期流程

```
[等待时间] → [启动浏览器] → [检测登录]
                                    ↓
[库存释放] ← [刷新页面] ← [未登录则等待]
    ↓
[快速点击订阅按钮]
    ↓
[进入支付页面] → [截图保存]
    ↓
[手动完成支付]
```

## ⚠️ 注意事项

1. **实名认证**：确保账号已完成实名认证
2. **支付方式**：提前准备好支付宝或微信
3. **网络稳定**：确保抢购时网络畅通
4. **不要关闭浏览器**：脚本运行中保持浏览器打开
5. **及时支付**：进入支付页面后尽快完成支付

## 🆘 故障排查

### 问题 1：找不到订阅按钮

**解决**：
1. 运行测试脚本查看按钮列表
2. 确认已登录账号
3. 检查页面是否正常加载

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

### 问题 5：点击后没有进入支付页面

**可能原因**：
- 库存仍售罄
- 账号未实名认证
- 服务器响应慢

**解决**：
查看日志输出，根据错误信息调整。

## 📞 获取帮助

如果遇到问题：
1. 查看脚本日志
2. 运行测试脚本诊断
3. 检查智谱 AI 官网是否正常
4. 确认账号登录和认证状态

## 📝 文件说明

- `auto-buy-glm-pro-optimized.js` - **优化版（推荐）**
- `auto-buy-glm-pro.js` - 标准版
- `auto-buy-glm-pro-test.js` - 测试版
- `package.json` - 项目配置
- `README.md` - 完整文档
- `QUICKSTART.md` - 本文档

祝你抢购成功！🎉
