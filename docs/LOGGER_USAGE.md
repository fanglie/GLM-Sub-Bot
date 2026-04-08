# 智谱 AI 自动抢购 - 综合日志系统文档

## 📋 概述

本日志系统为智谱 AI 自动抢购脚本提供全面的诊断信息捕获，帮助分析抢购失败原因。

## ✨ 功能特性

### 1. **网络请求监控**
- 记录所有 HTTP 请求/响应
- 捕获请求头、响应状态、时序信息
- 特别监控 bigmodel.cn API 请求

### 2. **页面状态变化**
- DOM 变化检测
- 按钮状态跟踪（enabled/disabled）
- 文本内容变化监控

### 3. **时间信息**
- 精确到毫秒的时间戳
- 每个操作的响应时间
- 性能指标统计

### 4. **错误详情**
- 完整错误栈追踪
- 错误发生时的元素状态
- 页面上下文信息

### 5. **视觉证据**
- 关键时刻自动截图
- 错误时自动截图
- 成功时自动截图
- 定期进度截图

### 6. **控制台日志**
- 浏览器 console 消息
- 警告和错误捕获
- 位置信息

### 7. **库存状态变化**
- 实时监控按钮状态
- 从"售罄"到"可用"的变化追踪
- 自动截图记录库存释放瞬间

## 🔧 配置选项

### 日志级别

```javascript
const { LogLevel } = require('./auto-buy-logger');

// 可用级别
LogLevel.DEBUG    // 0 - 所有日志
LogLevel.INFO     // 1 - 信息、警告、错误
LogLevel.WARNING  // 2 - 警告、错误
LogLevel.ERROR    // 3 - 仅错误
LogLevel.NONE     // 4 - 禁用所有日志
```

### 完整配置示例

```javascript
const logger = createLogger({
  logLevel: LogLevel.DEBUG,           // 日志级别
  logDirectory: './logs',             // 日志目录
  logFileName: 'auto-buy',            // 日志文件名前缀
  enableConsole: true,                // 是否输出到控制台
  enableFile: true,                   // 是否写入文件
  enableScreenshots: true,            // 是否启用截图
  screenshotDirectory: './screenshots', // 截图目录
  maxFileSize: 10 * 1024 * 1024,      // 最大文件大小（字节）
  maxFiles: 50,                       // 最大文件数
  includeStackTrace: true,            // 是否包含错误栈
});
```

## 📖 使用方法

### 基础日志记录

```javascript
const { createLogger } = require('./auto-buy-logger');
const logger = createLogger();

// 不同级别的日志
logger.debug('调试信息', { key: 'value' }, 'CATEGORY');
logger.info('普通信息', {}, 'CATEGORY');
logger.warning('警告信息', {}, 'CATEGORY');
logger.error('错误信息', error, {}, 'CATEGORY');
logger.success('成功信息', {}, 'CATEGORY');
```

### 网络请求监控

```javascript
// 在 Playwright page 上设置
const { setupPageLogging } = require('./auto-buy-logger');
setupPageLogging(page, logger);

// 自动记录所有网络请求
```

### 页面状态记录

```javascript
// 记录页面状态
await logger.logPageState(page, '页面加载完成');

// 记录元素状态
await logger.logElementState(page, '[ref="e401"]', 'Pro 按钮状态');
```

### 状态变化跟踪

```javascript
// 跟踪状态变化
logger.trackStateChange(
  'stock-status',      // 元素/状态标识
  'SOLD_OUT',          // 旧状态
  'AVAILABLE',         // 新状态
  '库存已释放'          // 描述
);
```

### 截图功能

```javascript
// 手动截图
await logger.takeScreenshot(page, 'custom-name.png');

// 自动截图（错误、成功时）
```

### 日志查询

```javascript
// 获取所有日志
const allLogs = logger.getLogs();

// 按级别过滤
const errorLogs = logger.getLogs({ level: 'ERROR' });

// 按类别过滤
const networkLogs = logger.getLogs({ category: 'NETWORK' });

// 按时间范围过滤
const recentLogs = logger.getLogs({
  startTime: Date.now() - 60000, // 最近 1 分钟
  limit: 100                      // 最多 100 条
});
```

### 日志导出

```javascript
// 导出为 JSON
const jsonLogs = logger.exportLogs('json', './export.json');

// 导出为文本
const textLogs = logger.exportLogs('text', './export.txt');
```

### 性能指标

```javascript
const metrics = logger.getPerformanceMetrics();
console.log(metrics);
// {
//   uptime: 12345,
//   totalLogs: 500,
//   consoleLogs: 50,
//   networkLogs: 200,
//   stateChanges: 10,
//   screenshots: 5,
//   memory: {...}
// }
```

### 会话管理

```javascript
// 获取会话摘要
const summary = logger.getSessionSummary();

// 结束会话
logger.endSession();
```

## 📁 日志文件格式

### 日志文件命名

```
auto-buy_YYYY-MM-DDTHH-mm-ss-SSSZ.log
```

示例：
```
auto-buy_2026-04-08T07-06-48-321Z.log
```

### 日志条目格式

```
[2026-04-08 15:06:48.323] [INFO] [CATEGORY] 消息内容 | {
  "key": "value"
}
```

### 会话摘要文件

```
summary_session_<sessionId>.json
```

包含：
- Session ID
- 开始时间
- 运行时长
- 总日志数
- 错误/警告数量
- 内存使用情况

## 🎯 日志类别

系统使用以下类别组织日志：

- `SESSION` - 会话开始/结束
- `BROWSER` - 浏览器启动/配置
- `NAVIGATION` - 页面导航/加载
- `AUTH` - 登录状态检测
- `STOCK` - 库存状态检查
- `STOCK_WATCH` - 实时库存监控
- `CLICK` - 按钮点击操作
- `ATTEMPT` - 抢购尝试
- `PAYMENT` - 支付页面检测
- `NETWORK` - 网络请求
- `CONSOLE` - 浏览器控制台
- `PAGE_STATE` - 页面状态
- `ELEMENT_STATE` - 元素状态
- `STATE_CHANGE` - 状态变化
- `SCREENSHOT` - 截图操作
- `ERROR` - 错误上下文
- `RESULT` - 最终结果
- `LOOP` - 抢购循环
- `EXPORT` - 日志导出
- `LEGACY` - 兼容旧日志函数

## 🔍 故障排查

### 查看日志文件

```bash
# Linux/Mac
tail -f logs/auto-buy_*.log

# Windows PowerShell
Get-Content logs/auto-buy_*.log -Tail 100 -Wait
```

### 分析失败原因

1. **查找错误日志**
   ```javascript
   const errors = logger.getLogs({ level: 'ERROR' });
   console.log(errors.map(e => e.message));
   ```

2. **查看时间线**
   ```javascript
   const timeline = logger.getLogs();
   timeline.forEach(log => {
     console.log(`${new Date(log.timestamp).toISOString()} [${log.level}] ${log.message}`);
   });
   ```

3. **检查网络请求**
   ```javascript
   const networkLogs = logger.getLogs({ category: 'NETWORK' });
   networkLogs.forEach(log => {
     console.log(`${log.data.url} - ${log.data.responseStatus}`);
   });
   ```

4. **查看状态变化**
   ```javascript
   const stateChanges = logger.stateChanges;
   stateChanges.forEach(change => {
     console.log(`${change.element}: ${change.oldState} -> ${change.newState}`);
   });
   ```

## 📊 实际使用示例

### 集成到现有脚本

```javascript
const { chromium } = require('playwright');
const { createLogger, setupPageLogging } = require('./auto-buy-logger');

async function main() {
  // 创建日志实例
  const logger = createLogger({
    logLevel: 'DEBUG',
    enableScreenshots: true,
  });
  
  try {
    // 启动浏览器
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 设置日志监听
    setupPageLogging(page, logger);
    
    // 记录页面状态
    await logger.logPageState(page, '初始页面');
    
    // 导航
    await page.goto('https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH');
    await logger.logPageState(page, '页面加载完成');
    
    // 监控元素
    await logger.logElementState(page, '[ref="e401"]', 'Pro 按钮初始状态');
    
    // ... 抢购逻辑 ...
    
  } catch (error) {
    logger.error('脚本执行失败', error);
    await logger.takeScreenshot(page, 'error.png');
  } finally {
    logger.endSession();
  }
}
```

## 🎨 控制台输出颜色

日志在控制台输出时带有颜色：

- **DEBUG**: 紫色
- **INFO**: 青色
- **WARNING**: 黄色
- **ERROR**: 红色
- **SUCCESS**: 绿色

## 📈 性能影响

日志系统对性能的影响：

- **内存**: 每个日志条目约 100-500 字节
- **CPU**: 可忽略（< 1%）
- **磁盘**: 取决于日志量，通常每次会话 1-10MB
- **截图**: 每张 100-500KB

建议配置：
- 生产环境：`logLevel: LogLevel.INFO`
- 调试环境：`logLevel: LogLevel.DEBUG`
- 定期清理：`maxFiles: 50`

## 🔐 隐私和安全

日志可能包含：
- 页面 URL
- 网络请求头
- 元素内容

**不要分享包含敏感信息的日志文件！**

## 📝 最佳实践

1. **使用合适的日志级别**
   - 开发：DEBUG
   - 生产：INFO 或 WARNING

2. **提供上下文信息**
   ```javascript
   // 好
   logger.info('按钮点击成功', {
     selector: '[ref="e401"]',
     duration: '150ms',
     attempt: 3
   }, 'CLICK');
   
   // 不好
   logger.info('点击成功');
   ```

3. **使用类别组织日志**
   ```javascript
   logger.info('...', {}, 'NETWORK');
   logger.info('...', {}, 'AUTH');
   ```

4. **定期导出重要日志**
   ```javascript
   logger.exportLogs('json', './important-session.json');
   ```

5. **错误时捕获上下文**
   ```javascript
   try {
     // 操作
   } catch (error) {
     logger.error('操作失败', error, {
       pageUrl: page.url(),
       elementState: await getElementState()
     });
   }
   ```

## 🆘 常见问题

### Q: 日志文件在哪里？
A: 默认在 `./logs/` 目录下，文件名包含时间戳。

### Q: 如何禁用截图？
A: 设置 `enableScreenshots: false`。

### Q: 日志文件太大怎么办？
A: 调整 `maxFileSize` 和 `maxFiles` 配置。

### Q: 如何只查看错误？
A: 使用 `logger.getLogs({ level: 'ERROR' })`。

### Q: 可以实时查看日志吗？
A: 可以，启用 `enableConsole: true` 即可在控制台实时查看。

## 📞 支持

如有问题，请查看日志文件获取详细错误信息。
