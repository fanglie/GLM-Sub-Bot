/**
 * 智谱 AI 自动抢购 - 综合日志记录模块
 * 
 * 功能：
 * 1. 网络请求监控：记录所有 HTTP 请求/响应
 * 2. 页面状态变化：DOM 变更、按钮状态、文本内容
 * 3. 时间信息：精确时间戳、响应时间
 * 4. 错误详情：完整错误栈、元素状态
 * 5. 视觉证据：自动截图
 * 6. 控制台日志：浏览器 console 消息
 * 7. 库存状态变化：按钮状态跟踪
 */

const fs = require('fs');
const path = require('path');

// ==================== 日志级别 ====================

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  NONE: 4,
};

// ==================== 日志配置 ====================

const defaultConfig = {
  logLevel: LogLevel.DEBUG,
  logDirectory: './logs',
  logFileName: 'auto-buy',
  enableConsole: true,
  enableFile: true,
  enableScreenshots: true,
  screenshotDirectory: './screenshots',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 50,
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  prettyPrint: true,
  includeStackTrace: true,
};

// ==================== 日志格式化 ====================

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function formatLogLevel(level) {
  const colors = {
    DEBUG: '\x1b[35m',  // 紫色
    INFO: '\x1b[36m',   // 青色
    WARNING: '\x1b[33m', // 黄色
    ERROR: '\x1b[31m',  // 红色
    SUCCESS: '\x1b[32m', // 绿色
  };
  const reset = '\x1b[0m';
  
  return `${reset}[${colors[level] || colors.INFO}${level}${reset}]${reset}`;
}

function formatLogEntry(entry) {
  const timestamp = formatTimestamp(new Date(entry.timestamp));
  const levelStr = formatLogLevel(entry.level);
  const category = entry.category ? `[${entry.category}]` : '';
  
  let message = entry.message;
  if (entry.data && Object.keys(entry.data).length > 0) {
    message += ' | ' + JSON.stringify(entry.data, null, 2);
  }
  
  if (entry.stackTrace) {
    message += '\nStack Trace:\n' + entry.stackTrace;
  }
  
  return `[${timestamp}] ${levelStr} ${category} ${message}`;
}

// ==================== 日志类 ====================

class AutoBuyLogger {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.currentLogFile = null;
    this.logStream = null;
    this.entriesCount = 0;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logs = []; // 内存缓存
    this.consoleLogs = []; // 浏览器 console 日志
    this.networkLogs = []; // 网络请求日志
    this.stateChanges = []; // 状态变化日志
    this.screenshots = []; // 截图记录
    
    // 初始化日志目录
    this.initializeDirectories();
    this.rotateLogFile();
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  initializeDirectories() {
    // 创建日志目录
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }
    
    // 创建截图目录
    if (this.config.enableScreenshots && !fs.existsSync(this.config.screenshotDirectory)) {
      fs.mkdirSync(this.config.screenshotDirectory, { recursive: true });
    }
    
    // 清理旧日志文件
    this.cleanupOldLogs();
  }
  
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.config.logDirectory);
      const logFiles = files.filter(f => f.startsWith(this.config.logFileName) && f.endsWith('.log'));
      
      if (logFiles.length > this.config.maxFiles) {
        // 按时间排序，删除最旧的
        logFiles.sort();
        const toDelete = logFiles.slice(0, logFiles.length - this.config.maxFiles);
        
        for (const file of toDelete) {
          fs.unlinkSync(path.join(this.config.logDirectory, file));
        }
      }
    } catch (e) {
      console.error('清理旧日志失败:', e);
    }
  }
  
  rotateLogFile() {
    if (this.logStream) {
      this.logStream.end();
    }
    
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    this.currentLogFile = `${this.config.logFileName}_${dateStr}.log`;
    const logPath = path.join(this.config.logDirectory, this.currentLogFile);
    
    // 写入日志文件头
    const header = {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      config: this.config,
    };
    
    fs.writeFileSync(logPath, `=== Auto-Buy Logger Session ===\n`);
    fs.appendFileSync(logPath, `Session ID: ${this.sessionId}\n`);
    fs.appendFileSync(logPath, `Start Time: ${header.startTime}\n`);
    fs.appendFileSync(logPath, `Config: ${JSON.stringify(header.config, null, 2)}\n`);
    fs.appendFileSync(logPath, `================================\n\n`);
    
    this.entriesCount = 0;
  }
  
  shouldLog(level) {
    const levelValue = LogLevel[level] !== undefined ? LogLevel[level] : LogLevel.INFO;
    const configLevelValue = typeof this.config.logLevel === 'string' 
      ? LogLevel[this.config.logLevel] 
      : this.config.logLevel;
    
    return levelValue >= configLevelValue;
  }
  
  log(level, message, data = {}, category = '') {
    if (!this.shouldLog(level)) return;
    
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      category,
      sessionId: this.sessionId,
    };
    
    // 添加到内存缓存
    this.logs.push(entry);
    this.entriesCount++;
    
    // 写入文件
    if (this.config.enableFile) {
      const logLine = formatLogEntry(entry) + '\n';
      const logPath = path.join(this.config.logDirectory, this.currentLogFile);
      fs.appendFileSync(logPath, logLine);
    }
    
    // 输出到控制台
    if (this.config.enableConsole) {
      console.log(formatLogEntry(entry));
    }
    
    // 检查是否需要轮转
    if (this.entriesCount % 1000 === 0) {
      try {
        const stat = fs.statSync(path.join(this.config.logDirectory, this.currentLogFile));
        if (stat.size > this.config.maxFileSize) {
          this.rotateLogFile();
        }
      } catch (e) {
        // 忽略
      }
    }
  }
  
  debug(message, data = {}, category = '') {
    this.log('DEBUG', message, data, category);
  }
  
  info(message, data = {}, category = '') {
    this.log('INFO', message, data, category);
  }
  
  warning(message, data = {}, category = '') {
    this.log('WARNING', message, data, category);
  }
  
  error(message, error = null, data = {}, category = '') {
    const entry = {
      timestamp: Date.now(),
      level: 'ERROR',
      message,
      data,
      category,
      sessionId: this.sessionId,
    };
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      if (this.config.includeStackTrace && error.stack) {
        entry.stackTrace = error.stack;
      }
    }
    
    // 添加到内存缓存
    this.logs.push(entry);
    
    // 写入文件
    if (this.config.enableFile) {
      const logLine = formatLogEntry(entry) + '\n';
      const logPath = path.join(this.config.logDirectory, this.currentLogFile);
      fs.appendFileSync(logPath, logLine);
    }
    
    // 输出到控制台
    if (this.config.enableConsole) {
      console.error(formatLogEntry(entry));
    }
  }
  
  success(message, data = {}, category = '') {
    this.log('SUCCESS', message, data, category);
  }
  
  // ==================== 网络请求监控 ====================
  
  logNetworkRequest(request, response = null, error = null) {
    const networkEntry = {
      timestamp: Date.now(),
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers(),
      postData: request.postData(),
      responseStatus: response ? response.status() : null,
      responseStatusText: response ? response.statusText() : null,
      responseHeaders: response ? response.headers() : null,
      responseBody: null,
      error: error ? error.message : null,
      timing: {
        startTime: request.timing()?.startTime || 0,
        domainLookupStart: request.timing()?.domainLookupStart || 0,
        domainLookupEnd: request.timing()?.domainLookupEnd || 0,
        connectStart: request.timing()?.connectStart || 0,
        connectEnd: request.timing()?.connectEnd || 0,
        requestStart: request.timing()?.requestStart || 0,
        responseStart: request.timing()?.responseStart || 0,
        responseEnd: request.timing()?.responseEnd || 0,
      },
    };
    
    this.networkLogs.push(networkEntry);
    
    // 只记录重要请求（API 相关）
    if (request.url().includes('bigmodel.cn') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      this.debug('网络请求', {
        url: request.url(),
        method: request.method(),
        status: response ? response.status() : 'pending',
        resourceType: request.resourceType(),
      }, 'NETWORK');
    }
  }
  
  // ==================== 页面状态监控 ====================
  
  async logPageState(page, description = '页面状态') {
    try {
      const state = {
        timestamp: Date.now(),
        url: page.url(),
        title: await page.title(),
        viewport: page.viewportSize(),
        isClosed: page.isClosed(),
      };
      
      this.debug(description, state, 'PAGE_STATE');
      return state;
    } catch (e) {
      this.error('获取页面状态失败', e, {}, 'PAGE_STATE');
      return null;
    }
  }
  
  async logElementState(page, selector, description = '元素状态') {
    try {
      const element = await page.$(selector);
      if (!element) {
        this.debug(`元素未找到：${selector}`, { selector }, 'ELEMENT_STATE');
        return null;
      }
      
      const state = {
        timestamp: Date.now(),
        selector,
        exists: true,
        visible: await element.isVisible().catch(() => false),
        hidden: await element.isHidden().catch(() => true),
        disabled: await element.isDisabled().catch(() => false),
        enabled: await element.isEnabled().catch(() => false),
        editable: await element.isEditable().catch(() => false),
        text: await element.textContent().catch(() => null),
        attributes: await element.evaluate(el => {
          const attrs = {};
          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        }).catch(() => null),
        className: await element.getAttribute('class').catch(() => null),
        id: await element.getAttribute('id').catch(() => null),
      };
      
      this.debug(description, state, 'ELEMENT_STATE');
      return state;
    } catch (e) {
      this.error('获取元素状态失败', e, { selector }, 'ELEMENT_STATE');
      return null;
    }
  }
  
  // ==================== 状态变化跟踪 ====================
  
  trackStateChange(elementSelector, oldState, newState, description = '') {
    const change = {
      timestamp: Date.now(),
      element: elementSelector,
      oldState,
      newState,
      description,
    };
    
    this.stateChanges.push(change);
    this.info(`状态变化：${description || elementSelector}`, {
      element: elementSelector,
      from: oldState,
      to: newState,
    }, 'STATE_CHANGE');
  }
  
  // ==================== 截图功能 ====================
  
  async takeScreenshot(page, filename = null, fullPage = true) {
    if (!this.config.enableScreenshots) return null;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotFilename = filename || `screenshot_${timestamp}.png`;
      const screenshotPath = path.join(this.config.screenshotDirectory, screenshotFilename);
      
      await page.screenshot({
        path: screenshotPath,
        fullPage,
      });
      
      const screenshotRecord = {
        timestamp: Date.now(),
        filename: screenshotFilename,
        path: screenshotPath,
        fullPage,
      };
      
      this.screenshots.push(screenshotRecord);
      this.success('截图保存', screenshotRecord, 'SCREENSHOT');
      
      return screenshotPath;
    } catch (e) {
      this.error('截图失败', e, { filename }, 'SCREENSHOT');
      return null;
    }
  }
  
  // ==================== 控制台日志监控 ====================
  
  logConsoleMessage(consoleMessage) {
    const record = {
      timestamp: Date.now(),
      type: consoleMessage.type(),
      text: consoleMessage.text(),
      location: consoleMessage.location(),
    };
    
    this.consoleLogs.push(record);
    
    // 只记录重要消息
    if (consoleMessage.type() === 'error' || consoleMessage.type() === 'warning') {
      this[consoleMessage.type() === 'error' ? 'error' : 'warning'](
        `浏览器控制台：${consoleMessage.text()}`,
        { location: consoleMessage.location() },
        'CONSOLE'
      );
    } else if (this.config.logLevel === 'DEBUG') {
      this.debug(`浏览器控制台：${consoleMessage.text()}`, {}, 'CONSOLE');
    }
  }
  
  // ==================== 错误捕获 ====================
  
  logErrorWithContext(message, error, page = null, elementSelector = null) {
    const context = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      page: page ? {
        url: page.url(),
        title: null,
        isClosed: page.isClosed(),
      } : null,
      element: elementSelector ? {
        selector: elementSelector,
      } : null,
      memory: process.memoryUsage ? process.memoryUsage() : null,
    };
    
    if (page && !page.isClosed()) {
      context.page.title = page.title().catch(() => null);
    }
    
    this.error(message, error, context, 'ERROR_CONTEXT');
    return context;
  }
  
  // ==================== 性能指标 ====================
  
  getPerformanceMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      consoleLogs: this.consoleLogs.length,
      networkLogs: this.networkLogs.length,
      stateChanges: this.stateChanges.length,
      screenshots: this.screenshots.length,
      memory: process.memoryUsage ? process.memoryUsage() : null,
    };
  }
  
  // ==================== 日志导出 ====================
  
  getLogs(options = {}) {
    const {
      level = null,
      category = null,
      startTime = null,
      endTime = null,
      limit = null,
    } = options;
    
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }
    
    if (startTime) {
      filtered = filtered.filter(log => log.timestamp >= startTime);
    }
    
    if (endTime) {
      filtered = filtered.filter(log => log.timestamp <= endTime);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }
  
  exportLogs(format = 'json', outputPath = null) {
    const logs = this.getLogs();
    
    if (format === 'json') {
      const jsonStr = JSON.stringify(logs, null, 2);
      if (outputPath) {
        fs.writeFileSync(outputPath, jsonStr);
        this.success('日志导出成功', { path: outputPath }, 'EXPORT');
      }
      return jsonStr;
    } else if (format === 'text') {
      const textStr = logs.map(log => formatLogEntry(log)).join('\n');
      if (outputPath) {
        fs.writeFileSync(outputPath, textStr);
        this.success('日志导出成功', { path: outputPath }, 'EXPORT');
      }
      return textStr;
    }
    
    throw new Error(`不支持的导出格式：${format}`);
  }
  
  // ==================== 会话管理 ====================
  
  getSessionSummary() {
    const metrics = this.getPerformanceMetrics();
    const errorCount = this.logs.filter(l => l.level === 'ERROR').length;
    const warningCount = this.logs.filter(l => l.level === 'WARNING').length;
    
    return {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      duration: metrics.uptime,
      totalLogs: metrics.totalLogs,
      errorCount,
      warningCount,
      consoleLogs: metrics.consoleLogs,
      networkRequests: metrics.networkLogs,
      stateChanges: metrics.stateChanges,
      screenshots: metrics.screenshots,
      memoryUsage: metrics.memory,
    };
  }
  
  endSession() {
    const summary = this.getSessionSummary();
    this.info('会话结束', summary, 'SESSION');
    
    // 导出会话摘要
    const summaryPath = path.join(this.config.logDirectory, `summary_${this.sessionId}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // 关闭日志流
    if (this.logStream) {
      this.logStream.end();
    }
    
    return summary;
  }
}

// ==================== 快速创建函数 ====================

function createLogger(config = {}) {
  return new AutoBuyLogger(config);
}

// ==================== 浏览器集成辅助函数 ====================

function setupPageLogging(page, logger) {
  // 监听控制台消息
  page.on('console', msg => {
    logger.logConsoleMessage(msg);
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    logger.error('页面错误', error, {}, 'PAGE_ERROR');
  });
  
  // 监听请求
  page.on('request', request => {
    logger.logNetworkRequest(request, null, null);
  });
  
  // 监听响应
  page.on('response', response => {
    const request = response.request();
    logger.logNetworkRequest(request, response, null);
  });
  
  // 监听请求失败
  page.on('requestfailed', request => {
    logger.logNetworkRequest(request, null, new Error('请求失败'));
  });
}

// ==================== 导出 ====================

module.exports = {
  AutoBuyLogger,
  createLogger,
  setupPageLogging,
  LogLevel,
  defaultConfig,
};
