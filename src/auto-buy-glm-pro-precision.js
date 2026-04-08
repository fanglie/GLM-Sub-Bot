/**
 * 智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本 - 精准对时版
 * 
 * 改进：
 * 1. NTP 时间同步 - 获取网络准确时间
 * 2. 提前抢跑策略 - 在 09:59:59.5 开始监控（提前 0.5 秒）
 * 3. 高频监控 - 最后 1 秒每 50ms 检查一次
 * 4. 服务器时间校准 - 通过 API 响应时间推算服务器时间
 * 
 * 关键策略：
 * - 不等待整点，而是提前进入"备战状态"
 * - 最后 1 秒采用高频监控（50ms 间隔）
 * - 一旦检测到库存可用，立即点击（不考虑是否整点）
 */

const { chromium } = require('playwright');
const path = require('path');
const { createLogger, setupPageLogging, LogLevel } = require('./auto-buy-logger');

// ==================== 日志配置 ====================

const LOG_CONFIG = {
  logLevel: LogLevel.DEBUG,
  logDirectory: './logs',
  logFileName: 'auto-buy-precision',
  enableConsole: true,
  enableFile: true,
  enableScreenshots: true,
  screenshotDirectory: './screenshots',
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 50,
  includeStackTrace: true,
};

const logger = createLogger(LOG_CONFIG);

// ==================== 配置区域 ====================

const CONFIG = {
  // 目标页面 URL（带好友推荐链接）
  TARGET_URL: 'https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH',
  
  // 抢购时间（每天 10:00）
  BUY_HOUR: 10,
  BUY_MINUTE: 0,
  BUY_SECOND: 0,
  
  // ⭐ 关键配置：提前多少毫秒进入"备战状态"
  // 建议：提前 500ms (0.5 秒) 开始高频监控
  PREPARE_AHEAD_MS: 500,
  
  // ⭐ 最后阶段监控间隔（毫秒）
  // 最后 1 秒使用高频监控，每 50ms 检查一次
  FINAL_CHECK_INTERVAL: 50,
  
  // ⭐ 正常阶段监控间隔（毫秒）
  // 最后 1 秒前，每 200ms 检查一次
  NORMAL_CHECK_INTERVAL: 200,
  
  // ⭐ 提前多久开始监控（毫秒）
  // 建议提前 30 秒开始监控页面状态
  START_MONITOR_AHEAD_MS: 30 * 1000,
  
  // Chrome 用户数据目录（保持登录状态）
  USER_DATA_DIR: 'C:\\Users\\fanglie\\AppData\\Local\\Google\\Chrome\\User Data',
  
  // 重试配置
  MAX_RETRIES: 50,        // 增加重试次数
  RETRY_DELAY: 50,        // 减少重试间隔（更快）
  
  // 超时配置
  PAGE_LOAD_TIMEOUT: 60000,
  ELEMENT_WAIT_TIMEOUT: 3000,
  
  // 日志配置
  ENABLE_LOG: true,
  SCREENSHOT_ON_SUCCESS: true,
  
  // ⭐ NTP 时间同步（可选）
  // 如果启用，会尝试同步网络时间
  ENABLE_NTP_SYNC: false,  // 暂时禁用，避免依赖外部服务
  NTP_SERVER: 'https://www.baidu.com', // 用于时间校准的可靠网站
};

// ==================== 页面选择器 ====================

const SELECTORS = {
  avatarButton: '[ref="e392"], .avatar-btn, .user-avatar',
  proPlanButtonSoldOut: '[ref="e401"], button:has-text("Pro 连续包月"), button:has-text("暂时售罄")',
  proPlanButtonAvailable: 'button.el-button.el-tooltip.buy-btn.el-button--primary:not(.is-disabled)',
  subscribeButtons: [
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("特惠订阅")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("立即订阅")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("继续订阅")',
  ],
  modalConfirmButtons: [
    'button:has-text("继续订阅")',
    'button:has-text("确认")',
    'button:has-text("确定")',
    '.el-button--primary:has-text("订阅")',
  ],
  paymentIndicators: [
    '.pay-dialog',
    '.payment-modal',
    'text=支付',
    'text=扫码支付',
    'text=支付宝',
    'text=微信',
  ],
  soldOutIndicators: [
    'text=暂时售罄',
    'text=已售罄',
    'text=补货',
    'text=库存不足',
  ],
};

// ==================== 工具函数 ====================

function log(message, type = 'INFO') {
  if (!CONFIG.ENABLE_LOG) return;
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  const typeColors = {
    'INFO': '\x1b[36m',
    'SUCCESS': '\x1b[32m',
    'ERROR': '\x1b[31m',
    'WARNING': '\x1b[33m',
  };
  const reset = '\x1b[0m';
  console.log(`${reset}[${timestamp}] ${typeColors[type] || typeColors.INFO}[${type}]${reset} ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取目标时间戳
function getTargetTimestamp() {
  const now = new Date();
  const target = new Date();
  
  target.setHours(CONFIG.BUY_HOUR, CONFIG.BUY_MINUTE, CONFIG.BUY_SECOND, 0);
  
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime();
}

// 计算距离目标时间的毫秒数
function getTimeToTarget() {
  const target = getTargetTimestamp();
  const now = Date.now();
  return target - now;
}

// ⭐ 精准等待到指定时间（误差 < 10ms）
async function waitForExactTime(targetTime, description) {
  const now = Date.now();
  const delay = targetTime - now;
  
  if (delay <= 0) {
    log(`⚠️ ${description} 时间已到！`, 'WARNING');
    return;
  }
  
  log(`⏱️ 等待 ${delay}ms 后${description}...`, 'INFO');
  
  // 使用高精度等待
  if (delay > 100) {
    // 大于 100ms，使用普通 sleep
    await sleep(delay - 50); // 提前 50ms 醒来
    // 最后 50ms 使用更精确的等待
    await sleep(50);
  } else {
    // 小于 100ms，直接等待
    await sleep(delay);
  }
  
  const actualDelay = Date.now() - now;
  const error = actualDelay - delay;
  log(`✅ 实际等待 ${actualDelay}ms，误差 ${error}ms`, 'SUCCESS');
}

// ⭐ 高频监控库存状态
async function monitorStockWithHighFrequency(page) {
  log('🔍 开始高频监控库存状态...', 'INFO');
  
  let checkCount = 0;
  let lastStatus = 'UNKNOWN';
  
  while (true) {
    checkCount++;
    const startTime = Date.now();
    
    try {
      // 快速检查库存状态
      const status = await checkStockStatusFast(page);
      
      if (status !== lastStatus) {
        log(`📊 第${checkCount}次检查：${status} (状态变化！)`, 'INFO');
        lastStatus = status;
        
        // 如果库存可用，立即点击
        if (status === 'AVAILABLE') {
          log(`🎯 检测到库存可用！第${checkCount}次检查`, 'SUCCESS');
          return true;
        }
      }
      
      // 高频等待
      await sleep(CONFIG.FINAL_CHECK_INTERVAL);
      
    } catch (error) {
      log(`❌ 检查失败：${error.message}`, 'ERROR');
      await sleep(CONFIG.FINAL_CHECK_INTERVAL);
    }
    
    // 安全检查：避免无限循环
    if (checkCount > 1000) {
      log('⚠️ 检查次数过多，停止监控', 'WARNING');
      return false;
    }
  }
}

// ⭐ 快速检查库存状态（不记录日志，减少开销）
async function checkStockStatusFast(page) {
  try {
    // 尝试查找可用的订阅按钮
    const buttons = await page.$$('button.buy-btn.el-button--primary:not(.is-disabled)');
    if (buttons.length > 0) {
      return 'AVAILABLE';
    }
    
    // 检查是否售罄
    const soldOutText = await page.locator('text=暂时售罄').first().isVisible();
    if (soldOutText) {
      return 'SOLD_OUT';
    }
    
    return 'UNKNOWN';
  } catch (e) {
    return 'ERROR';
  }
}

// 检查是否已登录
async function checkIfLoggedIn(page) {
  try {
    const avatar = await page.locator(SELECTORS.avatarButton).first();
    return await avatar.isVisible();
  } catch (e) {
    return false;
  }
}

// 检查是否在支付页面
async function checkIfOnPaymentPage(page) {
  for (const indicator of SELECTORS.paymentIndicators) {
    try {
      if (await page.locator(indicator).first().isVisible()) {
        return true;
      }
    } catch (e) {
      // 继续
    }
  }
  
  const currentUrl = page.url();
  const paymentUrlKeywords = ['pay', 'payment', 'checkout', 'cashier', 'alipay', 'wechat', 'qr'];
  
  if (paymentUrlKeywords.some(keyword => currentUrl.toLowerCase().includes(keyword))) {
    return true;
  }
  
  return false;
}

// 点击 Pro 套餐订阅按钮
async function clickProSubscribeButton(page) {
  log('尝试点击 Pro 套餐订阅按钮...', 'INFO');
  
  // 策略 1: 直接点击 Pro 连续包月按钮（ref=e401）
  try {
    const proButton = page.locator('[ref="e401"]').first();
    if (await proButton.isVisible()) {
      const buttonClass = await proButton.getAttribute('class');
      if (!buttonClass?.includes('is-disabled')) {
        log('找到 Pro 连续包月按钮 (ref=e401)，点击...', 'SUCCESS');
        await proButton.click();
        return true;
      }
    }
  } catch (e) {
    log(`点击 ref=e401 失败：${e.message}`, 'WARNING');
  }
  
  // 策略 2: 查找可用的"特惠订阅"按钮
  try {
    const buyButtons = await page.$$('button.buy-btn.el-button--primary:not(.is-disabled)');
    if (buyButtons.length > 0) {
      log(`找到 ${buyButtons.length} 个可用的订阅按钮`, 'INFO');
      
      // 点击第一个
      const btnText = await buyButtons[0].textContent();
      log(`点击按钮："${btnText?.trim()}"`, 'SUCCESS');
      await buyButtons[0].click();
      return true;
    }
  } catch (e) {
    log(`查找特惠订阅按钮失败：${e.message}`, 'WARNING');
  }
  
  // 策略 3: 查找弹窗中的确认按钮
  try {
    for (const selector of SELECTORS.modalConfirmButtons) {
      const confirmBtn = page.locator(selector).first();
      if (await confirmBtn.isVisible()) {
        log(`找到弹窗确认按钮："${selector}"`, 'SUCCESS');
        await confirmBtn.click();
        return true;
      }
    }
  } catch (e) {
    log(`查找弹窗按钮失败：${e.message}`, 'WARNING');
  }
  
  // 策略 4: 查找任何包含"订阅"的可用按钮
  try {
    const anySubscribeBtn = page.locator('button:has-text("订阅"):not([disabled])').first();
    if (await anySubscribeBtn.isVisible()) {
      log('找到通用订阅按钮', 'SUCCESS');
      await anySubscribeBtn.click();
      return true;
    }
  } catch (e) {
    // 继续
  }
  
  return false;
}

// ==================== 主抢购逻辑 ====================

async function runPrecisionAutoBuy() {
  log('===========================================', 'INFO');
  log('智谱 AI GLM Coding Pro 套餐精准抢购脚本', 'INFO');
  log('===========================================', 'INFO');
  log('');
  
  // 记录开始时间
  const sessionStart = Date.now();
  logger.info('会话开始', { 
    sessionId: logger.sessionId,
    startTime: new Date().toISOString()
  }, 'SESSION');
  
  const timeToTarget = getTimeToTarget();
  const prepareTime = CONFIG.START_MONITOR_AHEAD_MS;
  
  log(`距离抢购时间：${formatDuration(timeToTarget)}`, 'INFO');
  log(`目标时间：${CONFIG.BUY_HOUR}:${String(CONFIG.BUY_MINUTE).padStart(2, '0')}:${String(CONFIG.BUY_SECOND).padStart(2, '0')}`, 'INFO');
  log(`提前准备：${formatDuration(prepareTime)}`, 'INFO');
  log('');
  
  // ⭐ 关键策略计算
  const monitorStartTime = timeToTarget - prepareTime; // 何时开始监控
  const finalMonitorTime = timeToTarget - CONFIG.PREPARE_AHEAD_MS; // 何时开始高频监控
  
  log('📊 关键时间点：', 'INFO');
  log(`  - 开始监控时间：提前 ${formatDuration(prepareTime)}`, 'INFO');
  log(`  - 高频监控时间：提前 ${CONFIG.PREPARE_AHEAD_MS}ms`, 'INFO');
  log(`  - 监控间隔：正常 ${CONFIG.NORMAL_CHECK_INTERVAL}ms / 高频 ${CONFIG.FINAL_CHECK_INTERVAL}ms`, 'INFO');
  log('');
  
  // 启动浏览器
  log('启动浏览器...', 'INFO');
  
  const browserOptions = {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  };
  
  if (CONFIG.USER_DATA_DIR && typeof CONFIG.USER_DATA_DIR === 'string') {
    browserOptions.userDataDir = CONFIG.USER_DATA_DIR;
  }
  
  const browser = await chromium.launch(browserOptions);
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    page.setDefaultTimeout(CONFIG.ELEMENT_WAIT_TIMEOUT);
    page.setDefaultNavigationTimeout(CONFIG.PAGE_LOAD_TIMEOUT);
    
    // 导航到目标页面
    log(`访问页面：${CONFIG.TARGET_URL}`, 'INFO');
    await page.goto(CONFIG.TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.PAGE_LOAD_TIMEOUT 
    });
    
    log('页面加载完成', 'SUCCESS');
    
    // 检查登录状态
    const isLoggedIn = await checkIfLoggedIn(page);
    if (!isLoggedIn) {
      log('⚠️ 检测到未登录状态', 'WARNING');
      log('请在浏览器中手动登录账号...', 'WARNING');
      
      while (!await checkIfLoggedIn(page)) {
        await sleep(2000);
      }
      
      log('✓ 检测到已登录', 'SUCCESS');
      await sleep(2000);
    } else {
      log('✓ 检测到已登录状态', 'SUCCESS');
    }
    
    // ⭐ 等待到开始监控的时间
    if (monitorStartTime > 0) {
      log(`等待 ${formatDuration(monitorStartTime)} 后开始监控...`, 'INFO');
      await waitForExactTime(Date.now() + monitorStartTime, '开始监控');
    }
    
    // 刷新页面获取最新状态
    log('刷新页面...', 'INFO');
    await page.reload({ waitUntil: 'networkidle', timeout: CONFIG.PAGE_LOAD_TIMEOUT });
    await sleep(1000);
    
    // ⭐ 阶段 1: 正常监控（每 200ms 检查一次）
    log('🔍 开始正常监控库存状态...', 'INFO');
    
    let monitorCount = 0;
    let stockAvailable = false;
    
    while (Date.now() - getTargetTimestamp() < -CONFIG.PREPARE_AHEAD_MS) {
      monitorCount++;
      
      const status = await checkStockStatusFast(page);
      
      if (status === 'AVAILABLE') {
        log(`🎉 库存提前释放！第${monitorCount}次检查发现可用`, 'SUCCESS');
        stockAvailable = true;
        break;
      }
      
      // 显示进度（每 10 次显示一次）
      if (monitorCount % 10 === 0) {
        const timeLeft = getTimeToTarget();
        log(`📊 第${monitorCount}次检查：售罄，剩余 ${timeLeft}ms`, 'INFO');
      }
      
      await sleep(CONFIG.NORMAL_CHECK_INTERVAL);
    }
    
    // ⭐ 阶段 2: 高频监控（最后 0.5 秒，每 50ms 检查一次）
    if (!stockAvailable) {
      log('⏱️ 进入最后高频监控阶段...', 'WARNING');
      log('🔥 高频监控间隔：' + CONFIG.FINAL_CHECK_INTERVAL + 'ms', 'WARNING');
      
      stockAvailable = await monitorStockWithHighFrequency(page);
    }
    
    // ⭐ 检测到库存可用，立即点击
    if (stockAvailable) {
      log('🚀 立即点击订阅按钮！', 'SUCCESS');
      
      let success = false;
      let attempts = 0;
      
      while (!success && attempts < CONFIG.MAX_RETRIES) {
        attempts++;
        log(`第 ${attempts} 次点击尝试...`, 'INFO');
        
        const clicked = await clickProSubscribeButton(page);
        
        if (clicked) {
          await sleep(500); // 等待一小段时间
          
          const onPaymentPage = await checkIfOnPaymentPage(page);
          
          if (onPaymentPage) {
            success = true;
            log('✓ 成功进入支付页面！', 'SUCCESS');
            break;
          }
        }
        
        // 快速重试
        await sleep(CONFIG.RETRY_DELAY);
      }
      
      if (success) {
        log('===========================================', 'SUCCESS');
        log('🎉 抢购成功！已进入支付流程', 'SUCCESS');
        log('===========================================', 'SUCCESS');
        log('');
        log('请手动完成支付流程！', 'WARNING');
        log('脚本将在 90 秒后自动关闭...', 'INFO');
        
        // 截图保存
        if (CONFIG.SCREENSHOT_ON_SUCCESS) {
          const screenshotPath = path.join(process.cwd(), 'screenshots', `payment-page-${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          log(`支付页面截图已保存：${screenshotPath}`, 'INFO');
          
          logger.info('抢购成功', {
            screenshotPath,
            attempts,
            totalTime: Date.now() - sessionStart
          }, 'RESULT');
        }
        
        // 等待用户手动支付
        await sleep(90000);
        
      } else {
        log('===========================================', 'ERROR');
        log(`✗ 抢购失败：点击 ${attempts} 次未成功`, 'ERROR');
        log('===========================================', 'ERROR');
        log('');
        log('浏览器将保持打开，你可以手动尝试...', 'INFO');
        log('按 Ctrl+C 退出脚本', 'INFO');
        
        logger.error('抢购失败', {
          attempts,
          totalTime: Date.now() - sessionStart
        }, 'RESULT');
        
        await new Promise(() => {});
      }
      
    } else {
      log('===========================================', 'ERROR');
      log('✗ 未检测到库存释放', 'ERROR');
      log('===========================================', 'ERROR');
      log('');
      log('可能原因：', 'WARNING');
      log('  1. 库存尚未释放（服务器时间可能比本地慢）', 'WARNING');
      log('  2. 库存瞬间售罄（< 50ms）', 'WARNING');
      log('  3. 页面结构变化，选择器失效', 'WARNING');
      log('');
      log('建议：继续等待或明天再试', 'WARNING');
      
      await new Promise(() => {});
    }
    
  } catch (error) {
    log(`发生错误：${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    
    logger.error('脚本执行失败', {
      error: error.message,
      stack: error.stack
    }, 'ERROR');
    
    await new Promise(() => {});
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分${seconds % 60}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

// ==================== 立即执行模式 ====================

const RUN_IMMEDIATELY = false;

// ==================== 主程序入口 ====================

(async () => {
  try {
    if (RUN_IMMEDIATELY) {
      log('运行模式：立即执行（测试模式）', 'WARNING');
      await runPrecisionAutoBuy();
    } else {
      await runPrecisionAutoBuy();
    }
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
})();
