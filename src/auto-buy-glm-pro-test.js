/**
 * 智谱 AI GLM Coding Plan Pro 套餐自动抢购脚本 - 测试版本
 * 
 * 用于立即测试脚本功能，无需等待抢购时间
 * 使用方法：node auto-buy-glm-pro-test.js
 */

const { chromium } = require('playwright');
const path = require('path');

// 测试配置 - 立即执行
const TEST_CONFIG = {
  TARGET_URL: 'https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH', // 带好友推荐链接
  USER_DATA_DIR: false, // 如果需要保持登录，设置为你的 Chrome 用户数据路径
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: 15000,
};

async function testSubscribe() {
  console.log('=== 智谱 AI GLM Coding 订阅测试 ===\n');
  console.log('注意：此脚本会打开浏览器并尝试点击订阅按钮');
  console.log('如果找不到按钮，请手动在页面上操作一次，然后查看页面结构\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--window-size=1920,1080',
    ],
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    console.log('正在访问页面...');
    await page.goto(TEST_CONFIG.TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.PAGE_LOAD_TIMEOUT 
    });
    
    console.log('页面加载完成');
    console.log('当前 URL:', page.url());
    
    // 等待页面稳定
    await page.waitForTimeout(2000);
    
    // 截图查看页面状态
    const screenshotPath = path.join(process.cwd(), `page-snapshot-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`页面截图已保存：${screenshotPath}`);
    
    // 获取页面所有按钮
    const buttons = await page.$$eval('button, a[class*="btn"]', elements => {
      return elements.map(el => ({
        text: el.textContent?.trim(),
        class: el.className,
        id: el.id,
      })).filter(btn => btn.text && btn.text.length > 0);
    });
    
    console.log('\n找到的按钮:');
    buttons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" - class: "${btn.class}"`);
    });
    
    // 尝试查找订阅相关按钮
    const subscribeKeywords = ['订阅', '购买', 'Pro', '套餐'];
    const subscribeButtons = buttons.filter(btn => 
      subscribeKeywords.some(keyword => btn.text.includes(keyword))
    );
    
    if (subscribeButtons.length > 0) {
      console.log('\n找到可能的订阅按钮:');
      subscribeButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. "${btn.text}"`);
      });
      
      console.log('\n提示：脚本已找到订阅按钮，你可以:');
      console.log('  1. 手动点击页面上的按钮');
      console.log('  2. 或修改脚本中的选择器配置后运行正式版本');
      console.log('\n浏览器将保持打开，请按 Ctrl+C 退出');
    } else {
      console.log('\n未找到明显的订阅按钮');
      console.log('可能原因:');
      console.log('  1. 页面需要登录才能看到订阅按钮');
      console.log('  2. 页面结构已变化');
      console.log('  3. 库存已售罄，按钮被隐藏');
      console.log('\n建议：手动登录后再运行测试');
    }
    
    // 保持浏览器打开
    await new Promise(() => {});
    
  } catch (error) {
    console.error('测试失败:', error);
    await browser.close();
  }
}

testSubscribe();
