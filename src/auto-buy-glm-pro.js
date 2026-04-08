/**
 * 智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本
 * 
 * 功能：在每天 10:00 自动访问智谱 AI 订阅页面并点击 Pro 套餐订阅按钮
 * 使用：确保已登录账号，脚本会自动点击订阅按钮进入支付流程
 * 
 * 依赖：npm install playwright
 */

const { chromium } = require('playwright');
const path = require('path');

// ==================== 配置区域 ====================

const CONFIG = {
  // 目标页面 URL（带好友推荐链接）
  TARGET_URL: 'https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH',
  
  // 抢购时间（每天 10:00，24 小时制）
  BUY_HOUR: 10,
  BUY_MINUTE: 0,
  BUY_SECOND: 0,
  
  // 是否使用用户数据目录（保持登录状态）
  // 设置为你的 Chrome 用户数据路径，或使用 false 禁用
  USER_DATA_DIR: false,
  // 示例：USER_DATA_DIR: 'C:\\Users\\YourName\\AppData\\Local\\Google\\Chrome\\User Data',
  // 示例 (Mac): USER_DATA_DIR: '/Users/YourName/Library/Application Support/Google/Chrome/Default',
  
  // 重试配置
  MAX_RETRIES: 10,        // 最大重试次数
  RETRY_DELAY: 500,       // 重试间隔（毫秒）
  
  // 超时配置（毫秒）
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: 15000,
  
  // 日志配置
  ENABLE_LOG: true,
  SCREENSHOT_ON_SUCCESS: true,  // 成功后是否截图
};

// ==================== Pro 套餐选择器配置 ====================
// 如果页面结构变化，调整这些选择器

const SELECTORS = {
  // Pro 套餐容器（用于定位 Pro 套餐）
  proPlanCard: '[data-plan="pro"], .plan-card:has-text("Pro"), .pricing-card:has-text("Pro")',
  
  // 订阅按钮（多个可能，按优先级尝试）
  subscribeButtons: [
    'button:has-text("立即订阅"),',
    'button:has-text("立即购买"),',
    'button:has-text("订阅 Pro"),',
    'button:has-text("Pro 套餐"),',
    'a:has-text("立即订阅")',
    'a:has-text("立即购买")',
    '[class*="subscribe"]:has-text("订阅")',
    '[class*="buy"]:has-text("购买")',
  ],
  
  // Pro 套餐特定的按钮文本
  proButtonTexts: [
    '立即订阅 Pro',
    '订阅 Pro 套餐',
    '购买 Pro',
    'Pro 连续包月',
    '选择 Pro',
    '特惠订阅',  // 实际找到的按钮文本
    '即刻订阅',  // 实际找到的按钮文本
    '继续订阅',  // 弹窗中的按钮
  ],
  
  // 支付页面标识（用于确认成功进入支付流程）
  paymentPageIndicators: [
    'text=支付',
    'text=付款',
    'text=支付宝',
    'text=微信',
    'text=信用卡',
    '[class*="payment"]',
    '[class*="checkout"]',
    '[class*="pay"]',
  ],
  
  // 特惠订阅按钮的 CSS 类（从测试结果得知）
  specialBuyButton: '.buy-btn.el-button--primary',
  
  // 弹窗中的继续订阅按钮
  modalContinueButton: '.el-button.el-button--primary:has-text("继续订阅")',
};

// ==================== 工具函数 ====================

function log(message, type = 'INFO') {
  if (!CONFIG.ENABLE_LOG) return;
  
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  const typeColors = {
    'INFO': '\x1b[36m',    // 青色
    'SUCCESS': '\x1b[32m', // 绿色
    'ERROR': '\x1b[31m',   // 红色
    'WARNING': '\x1b[33m', // 黄色
  };
  const reset = '\x1b[0m';
  
  console.log(`${reset}[${timestamp}] ${typeColors[type] || typeColors.INFO}[${type}]${reset} ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 计算距离下次抢购时间的毫秒数
function getWaitDuration() {
  const now = new Date();
  const target = new Date();
  
  target.setHours(CONFIG.BUY_HOUR, CONFIG.BUY_MINUTE, CONFIG.BUY_SECOND, 0);
  
  // 如果已经过了今天的抢购时间，则设置为明天
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// 格式化持续时间
function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}小时${minutes.toString().padStart(2, '0')}分${seconds.toString().padStart(2, '0')}秒`;
}

// ==================== 核心抢购逻辑 ====================

async function findAndClickSubscribeButton(page) {
  log('开始查找 Pro 套餐订阅按钮...', 'INFO');
  
  // 策略 1: 优先查找"特惠订阅"按钮（根据测试结果，这是主要的订阅按钮）
  try {
    const specialBuyButtons = await page.$$('button.buy-btn.el-button--primary');
    if (specialBuyButtons.length > 0) {
      log(`找到 ${specialBuyButtons.length} 个"特惠订阅"按钮`, 'INFO');
      
      // 尝试点击每一个，直到成功
      for (let i = 0; i < specialBuyButtons.length; i++) {
        try {
          const btn = specialBuyButtons[i];
          await btn.click({ timeout: 3000 });
          log(`点击第 ${i + 1} 个特惠订阅按钮`, 'SUCCESS');
          return true;
        } catch (e) {
          log(`点击第 ${i + 1} 个按钮失败：${e.message}`, 'WARNING');
          // 继续尝试下一个
        }
      }
    }
  } catch (e) {
    log(`查找特惠订阅按钮失败：${e.message}`, 'WARNING');
  }
  
  // 策略 2: 查找"即刻订阅"按钮
  try {
    const immediateBtn = page.locator('button:has-text("即刻订阅")').first();
    if (await immediateBtn.isVisible()) {
      log('找到"即刻订阅"按钮', 'SUCCESS');
      await immediateBtn.click();
      return true;
    }
  } catch (e) {
    // 继续
  }
  
  // 策略 3: 查找弹窗中的"继续订阅"按钮（如果已经弹出了确认对话框）
  try {
    const continueBtn = page.locator('button:has-text("继续订阅")').first();
    if (await continueBtn.isVisible()) {
      log('找到"继续订阅"按钮（弹窗）', 'SUCCESS');
      await continueBtn.click();
      return true;
    }
  } catch (e) {
    // 继续
  }
  
  // 策略 4: 查找包含 Pro 文本的按钮
  for (const buttonText of SELECTORS.proButtonTexts) {
    try {
      const button = page.locator(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`).first();
      if (await button.isVisible()) {
        log(`找到订阅按钮 (文本："${buttonText}")`, 'SUCCESS');
        await button.click();
        return true;
      }
    } catch (e) {
      // 继续尝试下一个
    }
  }
  
  // 策略 5: 查找 Pro 套餐卡片内的按钮
  try {
    const proCard = page.locator(SELECTORS.proPlanCard).first();
    if (await proCard.isVisible()) {
      log('找到 Pro 套餐卡片', 'INFO');
      
      const subscribeBtn = proCard.locator('button[class*="btn"], button, a[class*="btn"], a').first();
      if (await subscribeBtn.isVisible()) {
        const btnText = await subscribeBtn.textContent();
        log(`在 Pro 卡片内找到按钮："${btnText?.trim()}"`, 'INFO');
        await subscribeBtn.click();
        return true;
      }
    }
  } catch (e) {
    log(`查找 Pro 卡片失败：${e.message}`, 'WARNING');
  }
  
  // 策略 6: 通用查找 - 任何包含"订阅"的按钮
  try {
    const anySubscribeBtn = page.locator('button:has-text("订阅"), a:has-text("订阅")').first();
    if (await anySubscribeBtn.isVisible()) {
      log('找到通用订阅按钮', 'SUCCESS');
      await anySubscribeBtn.click();
      return true;
    }
  } catch (e) {
    // 继续
  }
  
  // 策略 7: 使用 XPath 精确查找
  try {
    const xpathButtons = [
      '//button[contains(text(), "订阅") or contains(text(), "购买")]',
      '//a[contains(text(), "订阅") or contains(text(), "购买")]',
      '//*[contains(@class, "btn") and (contains(text(), "订阅") or contains(text(), "购买"))]',
    ];
    
    for (const xpath of xpathButtons) {
      const btn = page.locator(`xpath=${xpath}`).first();
      if (await btn.isVisible()) {
        log(`找到 XPath 按钮`, 'SUCCESS');
        await btn.click();
        return true;
      }
    }
  } catch (e) {
    // 继续
  }
  
  return false;
}

async function checkIfOnPaymentPage(page) {
  // 检查是否在支付页面
  for (const indicator of SELECTORS.paymentPageIndicators) {
    try {
      if (await page.locator(indicator).first().isVisible()) {
        return true;
      }
    } catch (e) {
      // 继续
    }
  }
  
  // 检查 URL 是否包含支付相关关键词
  const currentUrl = page.url();
  const paymentUrlKeywords = ['pay', 'payment', 'checkout', 'cashier', 'alipay', 'wechat'];
  
  if (paymentUrlKeywords.some(keyword => currentUrl.toLowerCase().includes(keyword))) {
    return true;
  }
  
  return false;
}

async function attemptSubscribe(page, attemptNum) {
  log(`第 ${attemptNum} 次尝试订阅...`, 'INFO');
  
  try {
    // 刷新页面确保最新状态
    await page.reload({ waitUntil: 'networkidle', timeout: CONFIG.PAGE_LOAD_TIMEOUT });
    await sleep(1000); // 等待页面稳定
    
    // 尝试点击订阅按钮
    const clicked = await findAndClickSubscribeButton(page);
    
    if (!clicked) {
      log('未找到订阅按钮', 'WARNING');
      return false;
    }
    
    // 等待一小段时间看是否跳转到支付页面
    await sleep(2000);
    
    // 检查是否成功进入支付页面
    const onPaymentPage = await checkIfOnPaymentPage(page);
    
    if (onPaymentPage) {
      log('✓ 成功进入支付页面！', 'SUCCESS');
      return true;
    }
    
    // 检查是否有弹窗或错误提示
    const pageContent = await page.content();
    if (pageContent.includes('库存不足') || pageContent.includes('已售罄') || pageContent.includes('抢完了')) {
      log('库存不足或已售罄', 'ERROR');
      return false;
    }
    
    if (pageContent.includes('登录') || pageContent.includes('请先登录')) {
      log('需要登录！请先手动登录账号', 'ERROR');
      return false;
    }
    
    log('已点击按钮但未进入支付页面，继续尝试...', 'WARNING');
    return false;
    
  } catch (error) {
    log(`尝试失败：${error.message}`, 'ERROR');
    return false;
  }
}

async function runAutoBuy() {
  log('===========================================', 'INFO');
  log('智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本', 'INFO');
  log('===========================================', 'INFO');
  
  const waitDuration = getWaitDuration();
  log(`距离抢购时间还有：${formatDuration(waitDuration)}`, 'INFO');
  log(`抢购目标时间：${CONFIG.BUY_HOUR}:${CONFIG.BUY_MINUTE.toString().padStart(2, '0')}:${CONFIG.BUY_SECOND.toString().padStart(2, '0')}`, 'INFO');
  log(`目标页面：${CONFIG.TARGET_URL}`, 'INFO');
  log('');
  log('提示：请确保：', 'WARNING');
  log('  1. 已提前登录账号', 'WARNING');
  log('  2. 账号已完成实名认证', 'WARNING');
  log('  3. 已准备好支付方式', 'WARNING');
  log('');
  
  if (waitDuration > 0) {
    log('脚本将在抢购时间自动开始...', 'INFO');
    await sleep(waitDuration);
  }
  
  log('抢购时间到！开始执行...', 'SUCCESS');
  
  // 启动浏览器
  log('启动浏览器...', 'INFO');
  
  const browserOptions = {
    headless: false, // 使用有头模式，方便用户看到操作
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  };
  
  // 如果配置了用户数据目录，则使用（保持登录状态）
  if (CONFIG.USER_DATA_DIR) {
    browserOptions.userDataDir = CONFIG.USER_DATA_DIR;
    log(`使用用户数据目录：${CONFIG.USER_DATA_DIR}`, 'INFO');
  }
  
  const browser = await chromium.launch(browserOptions);
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // 设置页面超时
    page.setDefaultTimeout(CONFIG.ELEMENT_WAIT_TIMEOUT);
    page.setDefaultNavigationTimeout(CONFIG.PAGE_LOAD_TIMEOUT);
    
    // 导航到目标页面
    log(`访问页面：${CONFIG.TARGET_URL}`, 'INFO');
    await page.goto(CONFIG.TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.PAGE_LOAD_TIMEOUT 
    });
    
    log('页面加载完成，等待抢购时机...', 'INFO');
    
    // 主抢购循环
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < CONFIG.MAX_RETRIES) {
      attempts++;
      
      success = await attemptSubscribe(page, attempts);
      
      if (!success) {
        // 等待重试间隔
        await sleep(CONFIG.RETRY_DELAY);
        
        // 重新加载页面（防止页面状态变化）
        if (attempts % 3 === 0) {
          log('重新加载页面...', 'INFO');
          await page.reload({ waitUntil: 'networkidle', timeout: CONFIG.PAGE_LOAD_TIMEOUT });
        }
      }
    }
    
    if (success) {
      log('===========================================', 'SUCCESS');
      log('✓ 抢购成功！已进入支付流程', 'SUCCESS');
      log('===========================================', 'SUCCESS');
      log('');
      log('请手动完成支付流程！', 'WARNING');
      log('脚本将在 60 秒后自动关闭...', 'INFO');
      
      // 截图保存
      if (CONFIG.SCREENSHOT_ON_SUCCESS) {
        const screenshotPath = path.join(process.cwd(), `payment-page-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        log(`支付页面截图已保存：${screenshotPath}`, 'INFO');
      }
      
      // 等待用户手动支付
      await sleep(60000);
      
    } else {
      log('===========================================', 'ERROR');
      log('✗ 抢购失败：达到最大重试次数', 'ERROR');
      log('===========================================', 'ERROR');
      log('');
      log('可能的原因：', 'WARNING');
      log('  1. 库存已售罄，请明天继续尝试', 'WARNING');
      log('  2. 账号未登录，请先登录再运行脚本', 'WARNING');
      log('  3. 页面结构变化，需要更新选择器配置', 'WARNING');
      log('');
      log('建议：手动访问页面尝试订阅', 'WARNING');
      
      // 保持浏览器打开以便用户手动操作
      log('浏览器将保持打开，你可以手动尝试...', 'INFO');
      log('按 Ctrl+C 退出脚本', 'INFO');
      
      // 无限等待，让用户手动操作
      await new Promise(() => {});
    }
    
  } catch (error) {
    log(`发生错误：${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    
    // 保持浏览器打开
    await new Promise(() => {});
  }
}

// ==================== 立即执行模式 ====================
// 如果你想要立即测试（而不是等到 10:00），设置这个为 true

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
