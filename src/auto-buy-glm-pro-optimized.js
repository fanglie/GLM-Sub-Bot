/**
 * 智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本 - 优化版
 * 基于实际页面分析结果
 * 
 * 关键信息：
 * - Pro 连续包月产品 ID: product-1df3e1
 * - Pro 连续包月按钮 ref: e401
 * - 价格：¥149/月
 * - 库存释放时间：每天 10:00 (UTC+8)
 */

const { chromium } = require('playwright');
const path = require('path');
const { createLogger, setupPageLogging, LogLevel } = require('./auto-buy-logger');

// ==================== 日志配置 ====================

const LOG_CONFIG = {
  logLevel: LogLevel.DEBUG,  // DEBUG, INFO, WARNING, ERROR, NONE
  logDirectory: './logs',
  logFileName: 'auto-buy',
  enableConsole: true,
  enableFile: true,
  enableScreenshots: true,
  screenshotDirectory: './screenshots',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 50,
  includeStackTrace: true,
};

// 创建日志实例
const logger = createLogger(LOG_CONFIG);

// ==================== 配置区域 ====================

const CONFIG = {
  // 目标页面 URL（带好友推荐链接）
  TARGET_URL: 'https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH',
  
  // 抢购时间（每天 10:00）
  BUY_HOUR: 10,
  BUY_MINUTE: 0,
  BUY_SECOND: 0,
  
  // Chrome 用户数据目录（保持登录状态）
  // Windows 示例：
  // USER_DATA_DIR: 'C:\\Users\\你的用户名\\AppData\\Local\\Google\\Chrome\\User Data',
  // Mac 示例：
  // USER_DATA_DIR: '/Users/yourname/Library/Application Support/Google/Chrome/Default',
  // 如果不需要保持登录，设置为 false
  USER_DATA_DIR: false,
  
  // 重试配置
  MAX_RETRIES: 30,        // 最大重试次数（库存释放时可能需要多次尝试）
  RETRY_DELAY: 200,       // 重试间隔（毫秒）
  
  // 超时配置
  PAGE_LOAD_TIMEOUT: 60000,
  ELEMENT_WAIT_TIMEOUT: 5000,
  
  // 日志配置（已迁移到 LOG_CONFIG）
  ENABLE_LOG: true,
  SCREENSHOT_ON_SUCCESS: true,
  
  // 提前多久开始准备（毫秒）
  PREPARE_AHEAD_MS: 5 * 60 * 1000, // 提前 5 分钟
};

// ==================== 页面选择器（基于实际分析） ====================

const SELECTORS = {
  // 用户已登录的标识（头像按钮）
  avatarButton: '[ref="e392"], .avatar-btn, .user-avatar',
  
  // 用户未登录的标识（登录按钮）
  loginButtons: [
    'button:has-text("登录")',
    'a:has-text("登录")',
    '.login-btn',
    '[ref*="login"]',
    'text=请登录',
  ],
  
  // Pro 连续包月按钮（售罄状态）
  proPlanButtonSoldOut: '[ref="e401"], button:has-text("Pro 连续包月"), button:has-text("暂时售罄")',
  
  // Pro 连续包月按钮（可用状态）- 多选择器策略
  proPlanButtonAvailable: 'button.el-button.el-tooltip.buy-btn.el-button--primary:not(.is-disabled)',
  
  // 通用订阅按钮（当 Pro 可用时）- 包含登录前后的各种文本
  subscribeButtons: [
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("特惠订阅")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("立即订阅")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("继续订阅")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("立即抢购")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("提交订单")',
    'button.buy-btn.el-button--primary:not(.is-disabled):has-text("Pro 连续包月")',
  ],
  
  // 弹窗中的确认按钮
  modalConfirmButtons: [
    'button:has-text("继续订阅")',
    'button:has-text("确认")',
    'button:has-text("确定")',
    '.el-button--primary:has-text("订阅")',
  ],
  
  // 支付页面标识
  paymentIndicators: [
    '.pay-dialog',
    '.payment-modal',
    'text=支付',
    'text=扫码支付',
    'text=支付宝',
    'text=微信',
    '[class*="alipay"]',
    '[class*="wechat"]',
    '[class*="qr-code"]',
  ],
  
  // 库存已售罄标识
  soldOutIndicators: [
    'text=暂时售罄',
    'text=已售罄',
    'text=补货',
    'text=库存不足',
  ],
};

// ==================== 工具函数 ====================

// 兼容旧日志函数（逐步替换为新 logger）
function log(message, type = 'INFO') {
  if (!CONFIG.ENABLE_LOG) return;
  
  // 映射到新 logger
  const logMethod = type.toLowerCase() === 'success' ? 'success' : 
                    type.toLowerCase() === 'warning' ? 'warning' : 
                    type.toLowerCase() === 'error' ? 'error' : 'info';
  
  logger[logMethod](message, {}, 'LEGACY');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getWaitDuration() {
  const now = new Date();
  const target = new Date();
  
  target.setHours(CONFIG.BUY_HOUR, CONFIG.BUY_MINUTE, CONFIG.BUY_SECOND, 0);
  
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}小时${minutes.toString().padStart(2, '0')}分${seconds.toString().padStart(2, '0')}秒`;
}

// 检查是否已登录
async function checkIfLoggedIn(page) {
  try {
    const avatar = await page.locator(SELECTORS.avatarButton).first();
    const isVisible = await avatar.isVisible();
    
    logger.debug('检查登录状态', {
      isLoggedIn: isVisible,
      selector: SELECTORS.avatarButton,
    }, 'AUTH');
    
    return isVisible;
  } catch (e) {
    logger.error('检查登录状态失败', e, {
      selector: SELECTORS.avatarButton,
    }, 'AUTH');
    return false;
  }
}

// 检查是否在支付页面
async function checkIfOnPaymentPage(page) {
  const startTime = Date.now();
  
  for (const indicator of SELECTORS.paymentIndicators) {
    try {
      if (await page.locator(indicator).first().isVisible()) {
        const duration = Date.now() - startTime;
        logger.debug('检测到支付页面', {
          indicator,
          duration: `${duration}ms`,
          url: page.url(),
        }, 'PAYMENT');
        return true;
      }
    } catch (e) {
      // 继续
    }
  }
  
  const currentUrl = page.url();
  const paymentUrlKeywords = ['pay', 'payment', 'checkout', 'cashier', 'alipay', 'wechat', 'qr'];
  
  if (paymentUrlKeywords.some(keyword => currentUrl.toLowerCase().includes(keyword))) {
    const duration = Date.now() - startTime;
    logger.debug('通过 URL 检测到支付页面', {
      url: currentUrl,
      duration: `${duration}ms`,
    }, 'PAYMENT');
    return true;
  }
  
  const duration = Date.now() - startTime;
  logger.debug('未检测到支付页面', {
    url: currentUrl,
    duration: `${duration}ms`,
  }, 'PAYMENT');
  return false;
}

// 检查库存状态
async function checkStockStatus(page) {
  const startTime = Date.now();
  
  try {
    // 查找可用的订阅按钮
    const availableButtons = await page.$$('button.buy-btn.el-button--primary:not(.is-disabled)');
    if (availableButtons.length > 0) {
      const duration = Date.now() - startTime;
      const status = 'AVAILABLE';
      
      logger.info('库存状态检查：可用', {
        status,
        availableButtonsCount: availableButtons.length,
        duration: `${duration}ms`,
        url: page.url(),
      }, 'STOCK');
      
      return status;
    }
    
    // 检查是否售罄
    const soldOutText = await page.locator('text=暂时售罄').first().isVisible();
    if (soldOutText) {
      const duration = Date.now() - startTime;
      const status = 'SOLD_OUT';
      
      logger.debug('库存状态检查：售罄', {
        status,
        duration: `${duration}ms`,
        url: page.url(),
      }, 'STOCK');
      
      return status;
    }
    
    const duration = Date.now() - startTime;
    const status = 'UNKNOWN';
    
    logger.debug('库存状态检查：未知', {
      status,
      duration: `${duration}ms`,
      url: page.url(),
    }, 'STOCK');
    
    return status;
  } catch (e) {
    const duration = Date.now() - startTime;
    logger.error('库存状态检查失败', e, {
      duration: `${duration}ms`,
    }, 'STOCK');
    return 'ERROR';
  }
}

// 点击 Pro 套餐订阅按钮
async function clickProSubscribeButton(page) {
  const startTime = Date.now();
  logger.info('开始点击 Pro 套餐订阅按钮', {
    strategies: 5,
    url: page.url(),
  }, 'CLICK');
  
  // ========== 阶段 0: 检测当前登录状态，适配按钮策略 ==========
  const isLoggedIn = await checkIfLoggedIn(page);
  logger.debug('当前登录状态', {
    isLoggedIn,
  }, 'CLICK');
  
  if (!isLoggedIn) {
    logger.warning('检测到未登录状态，按钮可能不可用', {}, 'CLICK');
    // 不直接返回 false，继续尝试查找登录按钮或提示
  }
  
  // 策略 1: 直接点击 Pro 连续包月按钮（ref=e401）
  try {
    const proButton = page.locator('[ref="e401"]').first();
    if (await proButton.isVisible()) {
      const buttonClass = await proButton.getAttribute('class');
      const isDisabled = buttonClass?.includes('is-disabled');
      const buttonText = await proButton.textContent();
      
      logger.debug('检查 Pro 连续包月按钮', {
        selector: '[ref="e401"]',
        isVisible: true,
        isDisabled,
        buttonText: buttonText?.trim(),
        class: buttonClass,
      }, 'CLICK');
      
      if (!isDisabled) {
        const clickStart = Date.now();
        await proButton.click();
        const clickDuration = Date.now() - clickStart;
        
        logger.success('点击 Pro 连续包月按钮成功', {
          selector: '[ref="e401"]',
          buttonText: buttonText?.trim(),
          clickDuration: `${clickDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        }, 'CLICK');
        
        return true;
      } else {
        logger.debug('Pro 按钮已禁用', {
          buttonText: buttonText?.trim(),
        }, 'CLICK');
      }
    }
  } catch (e) {
    logger.warning('点击 ref=e401 失败', {
      error: e.message,
      selector: '[ref="e401"]',
    }, 'CLICK');
  }
  
  // 策略 2: 查找可用的"特惠订阅"按钮
  try {
    const buyButtons = await page.$$('button.buy-btn.el-button--primary:not(.is-disabled)');
    if (buyButtons.length > 0) {
      logger.info(`找到 ${buyButtons.length} 个可用的订阅按钮`, {
        count: buyButtons.length,
      }, 'CLICK');
      
      // 尝试点击每一个
      for (let i = 0; i < buyButtons.length; i++) {
        try {
          const btnText = await buyButtons[i].textContent();
          logger.debug(`尝试点击按钮 #${i + 1}`, {
            text: btnText?.trim(),
            index: i,
          }, 'CLICK');
          
          const clickStart = Date.now();
          await buyButtons[i].click({ timeout: 2000 });
          const clickDuration = Date.now() - clickStart;
          
          logger.success('点击订阅按钮成功', {
            index: i,
            text: btnText?.trim(),
            clickDuration: `${clickDuration}ms`,
            totalDuration: `${Date.now() - startTime}ms`,
          }, 'CLICK');
          
          return true;
        } catch (e) {
          logger.warning(`点击第 ${i + 1} 个按钮失败`, {
            error: e.message,
            index: i,
          }, 'CLICK');
          // 继续尝试下一个
        }
      }
    }
  } catch (e) {
    logger.warning('查找特惠订阅按钮失败', {
      error: e.message,
    }, 'CLICK');
  }
  
  // 策略 3: 查找弹窗中的确认按钮
  try {
    for (const selector of SELECTORS.modalConfirmButtons) {
      const confirmBtn = page.locator(selector).first();
      if (await confirmBtn.isVisible()) {
        logger.debug('找到弹窗确认按钮', {
          selector,
        }, 'CLICK');
        
        const clickStart = Date.now();
        await confirmBtn.click();
        const clickDuration = Date.now() - clickStart;
        
        logger.success('点击弹窗确认按钮成功', {
          selector,
          clickDuration: `${clickDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        }, 'CLICK');
        
        return true;
      }
    }
  } catch (e) {
    logger.warning('查找弹窗按钮失败', {
      error: e.message,
    }, 'CLICK');
  }
  
  // 策略 4: 查找任何包含"订阅"的可用按钮
  try {
    const anySubscribeBtn = page.locator('button:has-text("订阅"):not([disabled])').first();
    if (await anySubscribeBtn.isVisible()) {
      const clickStart = Date.now();
      await anySubscribeBtn.click();
      const clickDuration = Date.now() - clickStart;
      
      logger.success('点击通用订阅按钮成功', {
        selector: 'button:has-text("订阅"):not([disabled])',
        clickDuration: `${clickDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      }, 'CLICK');
      
      return true;
    }
  } catch (e) {
    logger.debug('查找通用订阅按钮失败', {
      error: e.message,
    }, 'CLICK');
  }
  
  // 策略 5: 如果未登录，尝试查找登录按钮并提示用户
  if (!isLoggedIn) {
    try {
      const loginButtons = [
        'button:has-text("登录")',
        'a:has-text("登录")',
        '.login-btn',
        '[ref*="login"]',
      ];
      
      for (const selector of loginButtons) {
        const loginBtn = page.locator(selector).first();
        if (await loginBtn.isVisible()) {
          logger.warning('找到登录按钮，但需要用户手动登录', {
            selector,
          }, 'CLICK');
          break;
        }
      }
    } catch (e) {
      // 忽略登录按钮查找错误
    }
    
    logger.warning('当前未登录，请手动登录后脚本会继续执行', {}, 'CLICK');
  }
  
  logger.warning('所有点击策略均失败', {
    totalDuration: `${Date.now() - startTime}ms`,
    isLoggedIn,
  }, 'CLICK');
  
  return false;
}

// ==================== 主抢购逻辑 ====================

async function attemptSubscribe(page, attemptNum) {
  const attemptStartTime = Date.now();
  
  logger.info(`开始第 ${attemptNum} 次尝试`, {
    attemptNum,
    timestamp: new Date().toISOString(),
  }, 'ATTEMPT');
  
  try {
    // 检查库存状态
    const stockStatus = await checkStockStatus(page);
    const statusCheckTime = Date.now() - attemptStartTime;
    
    if (stockStatus === 'SOLD_OUT') {
      logger.debug('库存仍售罄', {
        attemptNum,
        statusCheckTime: `${statusCheckTime}ms`,
      }, 'ATTEMPT');
      return false;
    }
    
    if (stockStatus === 'AVAILABLE') {
      const stockReleaseTime = Date.now() - attemptStartTime;
      logger.success('库存已释放！', {
        attemptNum,
        stockReleaseTime: `${stockReleaseTime}ms`,
      }, 'ATTEMPT');
      
      // ========== 增强：点击前再次检查登录状态 ==========
      const preClickLoggedIn = await checkIfLoggedIn(page);
      if (!preClickLoggedIn) {
        logger.warning('点击前检测到未登录，等待用户手动登录...', {
          attemptNum,
        }, 'AUTH');
        
        // 等待登录（最多等待 30 秒）
        let waitCount = 0;
        const maxWaitCount = 15; // 15 * 2s = 30s
        while (!await checkIfLoggedIn(page) && waitCount < maxWaitCount) {
          waitCount++;
          if (waitCount % 3 === 0) {
            logger.info('等待登录中...', {
              attemptNum,
              waitCount,
              elapsed: `${waitCount * 2}秒`,
            }, 'AUTH');
          }
          await sleep(2000);
        }
        
        if (waitCount >= maxWaitCount) {
          logger.error('等待登录超时', {
            attemptNum,
            maxWaitTime: '30 秒',
          }, 'AUTH');
          return false;
        }
        
        logger.success('检测到已登录，继续点击...', {
          attemptNum,
          waitTime: `${waitCount * 2}秒`,
        }, 'AUTH');
        
        // 登录后刷新页面确保 DOM 更新
        await page.reload({ waitUntil: 'networkidle', timeout: 10000 });
        await sleep(1000);
        
        // 重新检查库存状态（登录后可能变化）
        const postLoginStockStatus = await checkStockStatus(page);
        if (postLoginStockStatus !== 'AVAILABLE') {
          logger.warning('登录后库存状态变化', {
            attemptNum,
            from: 'AVAILABLE',
            to: postLoginStockStatus,
          }, 'STOCK');
          return false;
        }
      }
      
      // 点击订阅按钮
      const clicked = await clickProSubscribeButton(page);
      const clickTime = Date.now() - attemptStartTime;
      
      if (!clicked) {
        // ========== 增强：点击失败后检查是否因为登录状态变化 ==========
        const postClickLoggedIn = await checkIfLoggedIn(page);
        if (!postClickLoggedIn) {
          logger.warning('点击失败：检测到未登录状态', {
            attemptNum,
            clickTime: `${clickTime}ms`,
          }, 'AUTH');
          // 不立即返回 false，让主循环继续重试
        } else {
          logger.error('未能点击订阅按钮', {
            attemptNum,
            clickTime: `${clickTime}ms`,
            isLoggedIn: postClickLoggedIn,
          }, 'ATTEMPT');
        }
        return false;
      }
      
      // 等待一小段时间
      await sleep(2000);
      
      // 检查是否进入支付页面
      const onPaymentPage = await checkIfOnPaymentPage(page);
      const totalTime = Date.now() - attemptStartTime;
      
      if (onPaymentPage) {
        logger.success('✓ 成功进入支付页面！', {
          attemptNum,
          totalTime: `${totalTime}ms`,
          breakdown: {
            statusCheck: `${statusCheckTime}ms`,
            stockRelease: `${stockReleaseTime}ms`,
            click: `${clickTime}ms`,
            total: `${totalTime}ms`,
          },
        }, 'ATTEMPT');
        
        // 自动截图
        await logger.takeScreenshot(page, `success_attempt_${attemptNum}_${Date.now()}.png`);
        
        return true;
      }
      
      logger.warning('已点击但未进入支付页面', {
        attemptNum,
        totalTime: `${totalTime}ms`,
        currentUrl: page.url(),
      }, 'ATTEMPT');
      return false;
      
    }
    
    // 库存状态未知，继续尝试
    const totalTime = Date.now() - attemptStartTime;
    logger.warning('库存状态未知', {
      attemptNum,
      totalTime: `${totalTime}ms`,
      stockStatus,
    }, 'ATTEMPT');
    return false;
    
  } catch (error) {
    const totalTime = Date.now() - attemptStartTime;
    logger.error('尝试失败', error, {
      attemptNum,
      totalTime: `${totalTime}ms`,
    }, 'ATTEMPT');
    
    // 错误时截图
    await logger.takeScreenshot(page, `error_attempt_${attemptNum}_${Date.now()}.png`);
    
    return false;
  }
}

async function runAutoBuy() {
  // 记录会话开始
  logger.info('===========================================', {}, 'SESSION');
  logger.info('智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本', {}, 'SESSION');
  logger.info('===========================================', {}, 'SESSION');
  
  logger.info('关键信息', {
    product: 'Pro 连续包月 (product-1df3e1)',
    price: '¥149/月',
    releaseTime: '每天 10:00',
    sessionId: logger.sessionId,
  }, 'SESSION');
  
  const waitDuration = getWaitDuration();
  const prepareTime = CONFIG.PREPARE_AHEAD_MS;
  
  logger.info(`距离抢购时间还有：${formatDuration(waitDuration)}`, {
    waitDuration,
    prepareTime,
  }, 'SESSION');
  logger.info(`目标时间：${CONFIG.BUY_HOUR}:${CONFIG.BUY_MINUTE.toString().padStart(2, '0')}:${CONFIG.BUY_SECOND.toString().padStart(2, '0')}`, {}, 'SESSION');
  logger.info(`提前准备：${formatDuration(prepareTime)}`, {}, 'SESSION');
  logger.info(`目标页面：${CONFIG.TARGET_URL}`, {}, 'SESSION');
  
  if (CONFIG.USER_DATA_DIR && typeof CONFIG.USER_DATA_DIR === 'string') {
    logger.success('已配置用户数据目录，将保持登录状态', {
      userDataDir: CONFIG.USER_DATA_DIR,
    }, 'SESSION');
  } else {
    logger.warning('未配置用户数据目录，可能需要手动登录', {}, 'SESSION');
  }
  
  logger.info('提示', {
    tips: [
      '请确保账号已登录并完成实名认证',
      '提前准备好支付方式（支付宝/微信）',
      '脚本会在库存释放时自动点击订阅',
    ],
  }, 'SESSION');
  
  // 如果距离抢购时间还很长，先等待到准备时间
  if (waitDuration > prepareTime) {
    logger.info(`等待 ${formatDuration(waitDuration - prepareTime)} 后开始准备...`, {
      waitDuration: waitDuration - prepareTime,
    }, 'SESSION');
    await sleep(waitDuration - prepareTime);
  }
  
  // 启动浏览器准备
  logger.info('启动浏览器，准备抢购...', {}, 'BROWSER');
  
  const browserStartTime = Date.now();
  
  const browserOptions = {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  };
  
  if (CONFIG.USER_DATA_DIR && typeof CONFIG.USER_DATA_DIR === 'string') {
    browserOptions.userDataDir = CONFIG.USER_DATA_DIR;
  }
  
  const browser = await chromium.launch(browserOptions);
  const browserLaunchTime = Date.now() - browserStartTime;
  
  logger.success('浏览器启动成功', {
    launchTime: `${browserLaunchTime}ms`,
    headless: browserOptions.headless,
  }, 'BROWSER');
  
  try {
    const contextStartTime = Date.now();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const contextCreateTime = Date.now() - contextStartTime;
    
    logger.debug('浏览器上下文创建成功', {
      createTime: `${contextCreateTime}ms`,
    }, 'BROWSER');
    
    const pageStartTime = Date.now();
    const page = await context.newPage();
    const pageCreateTime = Date.now() - pageStartTime;
    
    logger.debug('页面创建成功', {
      createTime: `${pageCreateTime}ms`,
    }, 'BROWSER');
    
    page.setDefaultTimeout(CONFIG.ELEMENT_WAIT_TIMEOUT);
    page.setDefaultNavigationTimeout(CONFIG.PAGE_LOAD_TIMEOUT);
    
    // 设置日志监听
    setupPageLogging(page, logger);
    
    // 设置库存状态监控
    setupStockWatcher(page, logger);
    
    // 导航到目标页面
    const gotoStartTime = Date.now();
    logger.info(`访问页面：${CONFIG.TARGET_URL}`, {}, 'NAVIGATION');
    await page.goto(CONFIG.TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.PAGE_LOAD_TIMEOUT 
    });
    const gotoDuration = Date.now() - gotoStartTime;
    
    logger.success('页面加载完成', {
      duration: `${gotoDuration}ms`,
      url: page.url(),
    }, 'NAVIGATION');
    
    // 记录初始页面状态
    await logger.logPageState(page, '初始页面状态');
    
    // 检查登录状态
    const loginCheckStart = Date.now();
    const isLoggedIn = await checkIfLoggedIn(page);
    const loginCheckDuration = Date.now() - loginCheckStart;
    
    if (!isLoggedIn) {
      logger.warning('检测到未登录状态', {
        checkDuration: `${loginCheckDuration}ms`,
      }, 'AUTH');
      logger.warning('请在浏览器中手动登录账号...', {}, 'AUTH');
      logger.info('登录后脚本会自动继续...', {}, 'AUTH');
      
      // 等待登录
      let waitCount = 0;
      while (!await checkIfLoggedIn(page)) {
        waitCount++;
        if (waitCount % 5 === 0) {
          logger.debug('等待登录中...', {
            waitCount,
            elapsed: `${waitCount * 2}秒`,
          }, 'AUTH');
        }
        await sleep(2000);
      }
      
      const totalWaitTime = waitCount * 2000;
      logger.success('检测到已登录', {
        totalWaitTime: `${totalWaitTime}ms`,
        waitCount,
      }, 'AUTH');
      await sleep(2000); // 等待页面更新
    } else {
      logger.success('检测到已登录状态', {
        checkDuration: `${loginCheckDuration}ms`,
      }, 'AUTH');
    }
    
    // 刷新页面确保最新状态
    const refreshStart = Date.now();
    logger.info('刷新页面获取最新库存状态...', {}, 'NAVIGATION');
    await page.reload({ waitUntil: 'networkidle', timeout: CONFIG.PAGE_LOAD_TIMEOUT });
    const refreshDuration = Date.now() - refreshStart;
    await sleep(1000);
    
    logger.debug('页面刷新完成', {
      duration: `${refreshDuration}ms`,
    }, 'NAVIGATION');
    
    // 检查当前库存状态
    const stockCheckStart = Date.now();
    const initialStockStatus = await checkStockStatus(page);
    const stockCheckDuration = Date.now() - stockCheckStart;
    
    logger.info('初始库存状态检查完成', {
      status: initialStockStatus,
      checkDuration: `${stockCheckDuration}ms`,
    }, 'STOCK');
    
    if (initialStockStatus === 'AVAILABLE') {
      logger.success('库存已可用！立即开始抢购...', {}, 'STOCK');
    } else {
      logger.info('等待库存释放...', {}, 'STOCK');
    }
    
    // 主抢购循环
    let success = false;
    let attempts = 0;
    const loopStartTime = Date.now();
    
    logger.info('开始抢购循环', {
      maxRetries: CONFIG.MAX_RETRIES,
      retryDelay: `${CONFIG.RETRY_DELAY}ms`,
    }, 'LOOP');
    
    while (!success && attempts < CONFIG.MAX_RETRIES) {
      attempts++;
      const attemptStartTime = Date.now();
      
      success = await attemptSubscribe(page, attempts);
      const attemptDuration = Date.now() - attemptStartTime;
      
      if (!success) {
        // 等待重试间隔
        await sleep(CONFIG.RETRY_DELAY);
        
        // 定期刷新页面
        if (attempts % 10 === 0) {
          const loopElapsed = Date.now() - loopStartTime;
          logger.info('定期刷新页面检查库存状态', {
            attempts,
            loopElapsed: `${loopElapsed}ms`,
          }, 'LOOP');
          
          try {
            const refreshStart = Date.now();
            await page.reload({ waitUntil: 'networkidle', timeout: CONFIG.PAGE_LOAD_TIMEOUT });
            const refreshDuration = Date.now() - refreshStart;
            await sleep(1000);
            
            logger.debug('页面刷新成功', {
              attempts,
              refreshDuration: `${refreshDuration}ms`,
            }, 'LOOP');
          } catch (e) {
            logger.warning('页面刷新失败', {
              attempts,
              error: e.message,
            }, 'LOOP');
          }
        }
        
        // 定期截图（每 20 次尝试）
        if (attempts % 20 === 0 && logger.config.enableScreenshots) {
          await logger.takeScreenshot(page, `progress_attempt_${attempts}_${Date.now()}.png`);
        }
      }
    }
    
    if (success) {
      const totalDuration = Date.now() - loopStartTime;
      
      logger.success('===========================================', {}, 'RESULT');
      logger.success('✓ 抢购成功！已进入支付流程', {}, 'RESULT');
      logger.success('===========================================', {}, 'RESULT');
      
      logger.info('会话统计', {
        totalAttempts: attempts,
        totalDuration: `${totalDuration}ms`,
        averageAttemptTime: `${Math.round(totalDuration / attempts)}ms`,
        success: true,
      }, 'RESULT');
      
      logger.warning('请手动完成支付流程！', {}, 'RESULT');
      logger.info('脚本将在 90 秒后自动关闭...', {}, 'RESULT');
      
      // 截图保存
      if (CONFIG.SCREENSHOT_ON_SUCCESS || logger.config.enableScreenshots) {
        const screenshotPath = await logger.takeScreenshot(page, `payment-page-${Date.now()}.png`);
        if (screenshotPath) {
          logger.info(`支付页面截图已保存：${screenshotPath}`, {}, 'RESULT');
        }
      }
      
      // 导出日志摘要
      const summary = logger.getSessionSummary();
      logger.info('会话摘要', summary, 'RESULT');
      
      // 等待用户手动支付
      await sleep(90000);
      
    } else {
      const totalDuration = Date.now() - loopStartTime;
      
      logger.error('===========================================', {}, 'RESULT');
      logger.error('✗ 抢购失败：达到最大重试次数', {}, 'RESULT');
      logger.error('===========================================', {}, 'RESULT');
      
      logger.warning('可能的原因', {
        reasons: [
          '库存已售罄，请明天继续尝试',
          '账号未登录或实名认证未完成',
          '网络延迟或服务器响应慢',
        ],
      }, 'RESULT');
      
      logger.info('会话统计', {
        totalAttempts: attempts,
        totalDuration: `${totalDuration}ms`,
        averageAttemptTime: `${Math.round(totalDuration / attempts)}ms`,
        success: false,
      }, 'RESULT');
      
      logger.info('浏览器将保持打开，你可以手动尝试...', {}, 'RESULT');
      logger.info('按 Ctrl+C 退出脚本', {}, 'RESULT');
      
      // 导出失败会话摘要
      const summary = logger.getSessionSummary();
      logger.info('会话摘要', summary, 'RESULT');
      
      // 无限等待，让用户手动操作
      await new Promise(() => {});
    }
    
  } catch (error) {
    logger.error('发生错误', error, {
      url: page?.url(),
    }, 'ERROR');
    
    // 错误时截图
    if (page && !page.isClosed()) {
      await logger.takeScreenshot(page, `critical-error-${Date.now()}.png`);
    }
    
    // 导出错误会话摘要
    const summary = logger.getSessionSummary();
    logger.error('错误会话摘要', error, summary, 'ERROR');
    
    // 保持浏览器打开
    await new Promise(() => {});
  } finally {
    // 结束会话记录
    logger.endSession();
  }
}

// ==================== 库存状态监控 ====================

async function setupStockWatcher(page, logger) {
  let lastStockStatus = null;
  let lastButtonText = null;
  
  // 定期检查库存状态
  const checkInterval = setInterval(async () => {
    try {
      // 检查库存状态
      const stockStatus = await checkStockStatus(page);
      
      // 检查 Pro 按钮状态
      const proButton = page.locator('[ref="e401"]').first();
      let buttonText = null;
      let buttonEnabled = false;
      
      try {
        if (await proButton.isVisible()) {
          buttonText = await proButton.textContent();
          buttonEnabled = await proButton.isEnabled();
        }
      } catch (e) {
        // 忽略
      }
      
      // 检测状态变化
      if (lastStockStatus !== stockStatus) {
        logger.trackStateChange('stock-status', lastStockStatus, stockStatus, '库存状态变化');
        lastStockStatus = stockStatus;
      }
      
      if (lastButtonText !== buttonText) {
        logger.trackStateChange('pro-button-text', lastButtonText, buttonText, '按钮文本变化');
        lastButtonText = buttonText;
      }
      
      // 特别监控：从售罄到可用
      if (lastStockStatus === 'SOLD_OUT' && stockStatus === 'AVAILABLE') {
        logger.success('检测到库存释放！', {
          from: 'SOLD_OUT',
          to: 'AVAILABLE',
          buttonText,
          buttonEnabled,
        }, 'STOCK_WATCH');
        
        // 立即截图
        await logger.takeScreenshot(page, `stock-released-${Date.now()}.png`);
      }
      
      // 调试日志
      if (logger.config.logLevel === 'DEBUG') {
        logger.debug('库存监控', {
          stockStatus,
          buttonText,
          buttonEnabled,
          timestamp: new Date().toISOString(),
        }, 'STOCK_WATCH');
      }
      
    } catch (e) {
      logger.error('库存监控失败', e, {}, 'STOCK_WATCH');
    }
  }, 1000); // 每秒检查一次
  
  // 页面关闭时清除定时器
  page.on('close', () => {
    clearInterval(checkInterval);
    logger.debug('库存监控已停止', {}, 'STOCK_WATCH');
  });
  
  logger.info('库存状态监控已启动', {
    checkInterval: '1000ms',
  }, 'STOCK_WATCH');
}

// ==================== 立即执行模式 ====================

const RUN_IMMEDIATELY = false;

// ==================== 主程序入口 ====================

(async () => {
  try {
    if (RUN_IMMEDIATELY) {
      log('运行模式：立即执行（测试模式）', 'WARNING');
      await runAutoBuy();
    } else {
      await runAutoBuy();
    }
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
})();
