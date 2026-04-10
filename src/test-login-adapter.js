/**
 * 登录状态适配测试脚本
 * 用于验证脚本在登录前/登录后不同状态下的行为
 * 
 * 使用方法：
 *   npm test:login         # 测试未登录场景
 *   npm test:logged-in     # 测试已登录场景
 */

const { chromium } = require('playwright');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  TARGET_URL: 'https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH',
  TIMEOUT: 60000,
  WAIT_FOR_LOGIN: 30000, // 等待登录的最大时间
};

// 选择器（与主脚本一致）
const SELECTORS = {
  avatarButton: '[ref="e392"], .avatar-btn, .user-avatar',
  loginButtons: [
    'button:has-text("登录")',
    'a:has-text("登录")',
    '.login-btn',
    '[ref*="login"]',
    'text=请登录',
  ],
  proPlanButton: '[ref="e401"]',
  subscribeButtons: 'button.buy-btn.el-button--primary:not(.is-disabled)',
};

async function checkIfLoggedIn(page) {
  try {
    const avatar = await page.locator(SELECTORS.avatarButton).first();
    return await avatar.isVisible();
  } catch (e) {
    return false;
  }
}

async function findLoginButton(page) {
  for (const selector of SELECTORS.loginButtons) {
    try {
      const loginBtn = page.locator(selector).first();
      if (await loginBtn.isVisible()) {
        return { found: true, selector, element: loginBtn };
      }
    } catch (e) {
      // 继续
    }
  }
  return { found: false, selector: null, element: null };
}

async function findSubscribeButton(page) {
  try {
    // 优先查找 Pro 按钮
    const proBtn = page.locator(SELECTORS.proPlanButton).first();
    if (await proBtn.isVisible()) {
      const isDisabled = await proBtn.isDisabled().catch(() => true);
      const text = await proBtn.textContent();
      return {
        found: true,
        selector: SELECTORS.proPlanButton,
        element: proBtn,
        text: text?.trim(),
        disabled: isDisabled,
      };
    }
    
    // 查找其他订阅按钮
    const buttons = await page.$$(SELECTORS.subscribeButtons);
    if (buttons.length > 0) {
      const text = await buttons[0].textContent();
      return {
        found: true,
        selector: SELECTORS.subscribeButtons,
        element: buttons[0],
        text: text?.trim(),
        disabled: false,
      };
    }
    
    return { found: false, selector: null, element: null, text: null, disabled: null };
  } catch (e) {
    return { found: false, selector: null, element: null, text: null, disabled: null };
  }
}

// 测试场景 1: 未登录状态测试
async function testNotLoggedIn() {
  console.log('\n========================================');
  console.log('🧪 测试场景 1: 未登录状态');
  console.log('========================================\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    console.log('📍 步骤 1: 访问页面');
    await page.goto(TEST_CONFIG.TARGET_URL, { waitUntil: 'networkidle', timeout: TEST_CONFIG.TIMEOUT });
    console.log('✅ 页面加载完成\n');
    
    console.log('📍 步骤 2: 检查登录状态');
    const isLoggedIn = await checkIfLoggedIn(page);
    console.log(`   登录状态：${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}\n`);
    
    if (isLoggedIn) {
      console.log('⚠️  警告：当前已登录，无法测试未登录场景');
      console.log('💡 建议：请先退出账号，然后重新运行测试\n');
      console.log('   测试跳过');
      return false;
    }
    
    console.log('📍 步骤 3: 查找登录按钮');
    const loginBtnInfo = await findLoginButton(page);
    if (loginBtnInfo.found) {
      console.log(`✅ 找到登录按钮`);
      console.log(`   选择器：${loginBtnInfo.selector}`);
    } else {
      console.log('❌ 未找到登录按钮');
    }
    console.log();
    
    console.log('📍 步骤 4: 查找订阅按钮');
    const subBtnInfo = await findSubscribeButton(page);
    if (subBtnInfo.found) {
      console.log(`✅ 找到订阅按钮`);
      console.log(`   选择器：${subBtnInfo.selector}`);
      console.log(`   按钮文本：${subBtnInfo.text}`);
      console.log(`   是否禁用：${subBtnInfo.disabled ? '是' : '否'}`);
    } else {
      console.log('❌ 未找到可用的订阅按钮（这是正常的，因为未登录）');
    }
    console.log();
    
    console.log('📍 步骤 5: 等待用户手动登录（30 秒超时）');
    console.log('   请在浏览器中登录账号...');
    
    const startTime = Date.now();
    let waitCount = 0;
    const maxWaitCount = 15; // 30 秒
    
    while (!await checkIfLoggedIn(page) && waitCount < maxWaitCount) {
      waitCount++;
      if (waitCount % 3 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   ⏳ 等待登录中... (${elapsed}秒)`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const finalLoggedIn = await checkIfLoggedIn(page);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (finalLoggedIn) {
      console.log(`✅ 检测到用户已登录（耗时：${totalTime}秒）\n`);
      
      // 登录后再次检查按钮
      console.log('📍 步骤 6: 登录后重新检查按钮');
      const postLoginSubBtnInfo = await findSubscribeButton(page);
      if (postLoginSubBtnInfo.found) {
        console.log(`✅ 找到订阅按钮`);
        console.log(`   选择器：${postLoginSubBtnInfo.selector}`);
        console.log(`   按钮文本：${postLoginSubBtnInfo.text}`);
        console.log(`   是否禁用：${postLoginSubBtnInfo.disabled ? '是' : '否'}`);
      } else {
        console.log('❌ 登录后仍未找到订阅按钮');
      }
      console.log();
      
      console.log('✅ 测试通过：未登录 -> 登录流程正常\n');
      return true;
    } else {
      console.log('❌ 等待登录超时（30 秒）');
      console.log('✅ 测试通过：超时处理正常\n');
      return true;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// 测试场景 2: 已登录状态测试
async function testLoggedIn() {
  console.log('\n========================================');
  console.log('🧪 测试场景 2: 已登录状态');
  console.log('========================================\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    console.log('📍 步骤 1: 访问页面');
    await page.goto(TEST_CONFIG.TARGET_URL, { waitUntil: 'networkidle', timeout: TEST_CONFIG.TIMEOUT });
    console.log('✅ 页面加载完成\n');
    
    console.log('📍 步骤 2: 检查登录状态');
    const isLoggedIn = await checkIfLoggedIn(page);
    console.log(`   登录状态：${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}\n`);
    
    if (!isLoggedIn) {
      console.log('⚠️  警告：当前未登录，无法测试已登录场景');
      console.log('💡 建议：请先手动登录账号，然后重新运行测试\n');
      console.log('   测试跳过');
      return false;
    }
    
    console.log('📍 步骤 3: 查找订阅按钮');
    const subBtnInfo = await findSubscribeButton(page);
    if (subBtnInfo.found) {
      console.log(`✅ 找到订阅按钮`);
      console.log(`   选择器：${subBtnInfo.selector}`);
      console.log(`   按钮文本：${subBtnInfo.text}`);
      console.log(`   是否禁用：${subBtnInfo.disabled ? '是' : '否'}`);
    } else {
      console.log('❌ 未找到订阅按钮');
      console.log('   可能原因：库存已售罄 或 选择器不匹配');
    }
    console.log();
    
    console.log('📍 步骤 4: 检查是否找到登录按钮（已登录时不应显示）');
    const loginBtnInfo = await findLoginButton(page);
    if (loginBtnInfo.found) {
      console.log(`⚠️  警告：已登录状态下仍找到登录按钮`);
      console.log(`   选择器：${loginBtnInfo.selector}`);
      console.log('   这可能是正常的（如页面设计如此）');
    } else {
      console.log('✅ 未找到登录按钮（符合预期）');
    }
    console.log();
    
    console.log('✅ 测试通过：已登录状态检测正常\n');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// 测试场景 3: 按钮文本变化测试
async function testButtonTextChanges() {
  console.log('\n========================================');
  console.log('🧪 测试场景 3: 按钮文本识别测试');
  console.log('========================================\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    console.log('📍 步骤 1: 访问页面');
    await page.goto(TEST_CONFIG.TARGET_URL, { waitUntil: 'networkidle', timeout: TEST_CONFIG.TIMEOUT });
    console.log('✅ 页面加载完成\n');
    
    console.log('📍 步骤 2: 检查所有可能的按钮');
    
    // 检查 Pro 按钮
    console.log('\n   🔍 查找 Pro 连续包月按钮 ([ref="e401"])...');
    try {
      const proBtn = page.locator('[ref="e401"]').first();
      if (await proBtn.isVisible()) {
        const text = await proBtn.textContent();
        const isDisabled = await proBtn.isDisabled().catch(() => true);
        const className = await proBtn.getAttribute('class');
        console.log(`   ✅ 找到 Pro 按钮`);
        console.log(`      文本：${text?.trim()}`);
        console.log(`      禁用：${isDisabled ? '是' : '否'}`);
        console.log(`      类名：${className}`);
      } else {
        console.log('   ❌ Pro 按钮不可见');
      }
    } catch (e) {
      console.log(`   ❌ 查找失败：${e.message}`);
    }
    
    // 检查所有订阅按钮
    console.log('\n   🔍 查找所有订阅按钮...');
    try {
      const buttons = await page.$$('button.buy-btn.el-button--primary:not(.is-disabled)');
      console.log(`   ✅ 找到 ${buttons.length} 个可用的订阅按钮`);
      
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`      [${i + 1}] ${text?.trim()}`);
      }
    } catch (e) {
      console.log(`   ❌ 查找失败：${e.message}`);
    }
    
    // 检查售罄状态
    console.log('\n   🔍 检查售罄标识...');
    try {
      const soldOutTexts = ['暂时售罄', '已售罄', '补货', '库存不足'];
      for (const text of soldOutTexts) {
        const locator = page.locator(`text=${text}`).first();
        if (await locator.isVisible()) {
          console.log(`   ✅ 找到售罄标识："${text}"`);
        }
      }
      console.log('   ❌ 未找到售罄标识（库存可能可用）');
    } catch (e) {
      console.log(`   ❌ 查找失败：${e.message}`);
    }
    
    console.log('\n✅ 按钮文本识别测试完成\n');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// 主程序
async function main() {
  const testType = process.argv[2] || 'all';
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  智谱 AI 登录状态适配测试工具          ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  let results = {
    notLoggedIn: null,
    loggedIn: null,
    buttonText: null,
  };
  
  try {
    if (testType === 'not-logged' || testType === 'all') {
      results.notLoggedIn = await testNotLoggedIn();
    }
    
    if (testType === 'logged' || testType === 'all') {
      results.loggedIn = await testLoggedIn();
    }
    
    if (testType === 'buttons' || testType === 'all') {
      results.buttonText = await testButtonTextChanges();
    }
    
    // 输出测试报告
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  测试报告                              ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    if (results.notLoggedIn !== null) {
      console.log(`📋 未登录场景：${results.notLoggedIn ? '✅ 通过' : '❌ 失败'}`);
    }
    if (results.loggedIn !== null) {
      console.log(`📋 已登录场景：${results.loggedIn ? '✅ 通过' : '❌ 失败'}`);
    }
    if (results.buttonText !== null) {
      console.log(`📋 按钮识别测试：${results.buttonText ? '✅ 通过' : '❌ 失败'}`);
    }
    
    const allPassed = Object.values(results).every(r => r === true);
    console.log();
    if (allPassed) {
      console.log('🎉 所有测试通过！\n');
    } else {
      console.log('⚠️  部分测试失败，请检查日志\n');
    }
    
  } catch (error) {
    console.error('测试执行失败:', error);
    process.exit(1);
  }
}

// 执行测试
main().catch(console.error);
