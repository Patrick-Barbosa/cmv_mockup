const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.join(__dirname, '.ai-tickets/storage/.ai-tickets/issues/issue-001-padronizar-ui-simulator-pages/artifacts/evidence/'),
      size: { width: 1920, height: 1080 }
    }
  });

  const recordPage = async (url, name, actions) => {
    const page = await context.newPage();
    console.log(`Recording ${name}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await actions(page);
    } catch (e) {
      console.error(`Error recording ${name}:`, e.message);
    } finally {
      await page.close();
    }
  };

  try {
    // 1. Lojas
    await recordPage('http://localhost:8080/lojas', 'Lojas', async (page) => {
      await page.waitForTimeout(4000);
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(1000);
      }
    });

    // 2. Insumos
    await recordPage('http://localhost:8080/simulator/insumos', 'Insumos', async (page) => {
      await page.waitForTimeout(4000);
      
      console.log('Selecting Month...');
      await page.click('button[role="combobox"] >> nth=0');
      await page.waitForTimeout(1000);
      await page.keyboard.type('2025-05');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      console.log('Selecting Insumo...');
      await page.click('button:has-text("Selecione...")');
      await page.waitForTimeout(1000);
      await page.keyboard.type('Farinha de trigo');
      await page.waitForTimeout(1500);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);

      console.log('Filling Price...');
      const input = page.locator('input[placeholder*="18"], input[placeholder*="Ex:"]');
      await input.fill('999');
      await page.waitForTimeout(1000);

      console.log('Simulating...');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Simular Impacto'));
        if (btn && !btn.disabled) btn.click();
      });
      await page.waitForTimeout(10000); 

      console.log('Scrolling...');
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(1200);
      }
    });

    // 3. Receitas
    await recordPage('http://localhost:8080/simulator/receitas', 'Receitas', async (page) => {
      await page.waitForTimeout(4000);

      console.log('Selecting Month...');
      await page.click('button[role="combobox"] >> nth=0');
      await page.waitForTimeout(1000);
      await page.keyboard.type('2025-05');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      console.log('Selecting Receita...');
      await page.click('button:has-text("Selecione...")');
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000); 

      console.log('Filling Price...');
      const input = page.locator('input[placeholder*="32"], input[placeholder*="Ex:"]');
      await input.fill('999');
      await page.waitForTimeout(1000);

      console.log('Simulating...');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Simular Impacto'));
        if (btn && !btn.disabled) btn.click();
      });
      await page.waitForTimeout(10000);

      console.log('Scrolling...');
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(1200);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    console.log("Finished recording session.");
  }
})();
