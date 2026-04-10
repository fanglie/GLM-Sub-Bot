// 最简单的浏览器启动测试
const { chromium } = require('playwright');

(async () => {
  console.log('1. 启动浏览器...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  console.log('✅ 浏览器启动成功');
  
  console.log('2. 创建页面...');
  const page = await browser.newPage();
  console.log('✅ 页面创建成功');
  
  console.log('3. 访问智谱 AI...');
  await page.goto('https://www.bigmodel.cn/glm-coding?ic=GVUM2QVEWH', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  console.log('✅ 页面加载成功');
  
  console.log('4. 截图测试...');
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('✅ 截图成功');
  
  console.log('\n所有测试通过！');
  
  // 保持浏览器打开 10 秒
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
  console.log('浏览器已关闭');
})().catch(err => {
  console.error('❌ 测试失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});
