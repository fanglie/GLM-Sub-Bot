/**
 * 测试日志系统是否正常工作
 * 
 * 运行：node test-logger-system.js
 */

const { createLogger, LogLevel } = require('../src/auto-buy-logger');

console.log('=== 智谱 AI 日志系统测试 ===\n');

// 创建日志实例
const logger = createLogger({
  logLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableScreenshots: false, // 测试时不截图
});

console.log('✓ 日志系统初始化成功\n');
console.log('会话 ID:', logger.sessionId);
console.log('日志目录:', logger.config.logDirectory);
console.log('\n--- 开始测试日志级别 ---\n');

// 测试不同级别的日志
logger.debug('这是一条调试日志', { test: 'data', number: 123 }, 'TEST');
logger.info('这是一条信息日志', { action: 'test' }, 'TEST');
logger.warning('这是一条警告日志', { warning: 'be careful' }, 'TEST');
logger.error('这是一条错误日志', new Error('测试错误'), { error: 'test error' }, 'TEST');
logger.success('这是一条成功日志', { success: 'yes' }, 'TEST');

console.log('\n--- 测试状态跟踪 ---\n');

// 测试状态变化跟踪
logger.trackStateChange('stock-status', 'SOLD_OUT', 'AVAILABLE', '库存已释放');
logger.trackStateChange('button-state', 'disabled', 'enabled', '按钮可用');

console.log('状态变化记录:', logger.stateChanges.length, '条');

console.log('\n--- 测试日志查询 ---\n');

// 测试日志查询
const allLogs = logger.getLogs();
console.log('总日志数:', allLogs.length);

const errorLogs = logger.getLogs({ level: 'ERROR' });
console.log('错误日志数:', errorLogs.length);

const testLogs = logger.getLogs({ category: 'TEST' });
console.log('TEST 类别日志数:', testLogs.length);

console.log('\n--- 测试性能指标 ---\n');

const metrics = logger.getPerformanceMetrics();
console.log('运行时间:', metrics.uptime, 'ms');
console.log('总日志数:', metrics.totalLogs);
console.log('状态变化:', metrics.stateChanges);

console.log('\n--- 测试日志导出 ---\n');

// 导出日志
try {
  const jsonPath = logger.exportLogs('json', './test-logs-export.json');
  console.log('✓ JSON 导出成功:', jsonPath);
  
  const textPath = logger.exportLogs('text', './test-logs-export.txt');
  console.log('✓ 文本导出成功:', textPath);
} catch (error) {
  console.error('导出失败:', error.message);
}

console.log('\n--- 结束会话 ---\n');

// 结束会话
const summary = logger.endSession();
console.log('会话摘要:', summary);

console.log('\n=== 测试完成 ===\n');
console.log('日志文件已生成，请查看：');
console.log('  - logs/auto-buy_*.log');
console.log('  - test-logs-export.json');
console.log('  - test-logs-export.txt');
console.log('\n检查这些文件确认日志系统正常工作。');
