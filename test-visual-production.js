const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://projetoevyrapt.vercel.app';
const SCREENSHOTS_DIR = './test-screenshots';

// Criar diretório se não existir
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = [];

async function checkLayoutIssues(page) {
  return await page.evaluate(() => {
    const issues = {
      duplicateAppShells: 0,
      hiddenElements: 0,
      overflowIssues: 0,
      details: {
        appShells: [],
        hiddenElements: [],
      },
    };

    // Verificar AppShells duplicados
    const appShells = document.querySelectorAll('[class*="app-shell"], [data-testid*="app-shell"], [class*="AppShell"]');
    issues.duplicateAppShells = appShells.length;
    appShells.forEach((el) => {
      issues.details.appShells.push({
        tag: el.tagName,
        class: el.className,
        visible: el.offsetHeight > 0,
      });
    });

    // Verificar elementos ocultos
    const allElements = document.querySelectorAll('*');
    let hiddenCount = 0;
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        if (el.offsetHeight === 0) {
          hiddenCount++;
          if (issues.details.hiddenElements.length < 5) {
            issues.details.hiddenElements.push({
              tag: el.tagName,
              class: el.className,
            });
          }
        }
      }
    });
    issues.hiddenElements = hiddenCount;

    // Verificar overflow issues
    const bodyWidth = document.body.scrollWidth;
    const windowWidth = window.innerWidth;
    if (bodyWidth > windowWidth) {
      issues.overflowIssues = bodyWidth - windowWidth;
    }

    return issues;
  });
}

async function checkAccessibility(page) {
  return await page.evaluate(() => {
    const issues = {
      missingAlt: 0,
      missingLabels: 0,
      details: {
        imagesWithoutAlt: [],
        inputsWithoutLabels: [],
      },
    };

    // Verificar imagens sem alt
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.getAttribute('alt') || img.getAttribute('alt')?.trim() === '') {
        issues.missingAlt++;
        if (issues.details.imagesWithoutAlt.length < 3) {
          issues.details.imagesWithoutAlt.push({
            src: img.src,
          });
        }
      }
    });

    // Verificar inputs sem label
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      if (!label && !ariaLabel && !ariaLabelledBy && input.id) {
        issues.missingLabels++;
        if (issues.details.inputsWithoutLabels.length < 3) {
          issues.details.inputsWithoutLabels.push({
            id: input.id,
            type: input instanceof HTMLInputElement ? input.type : input.tagName,
          });
        }
      }
    });

    return issues;
  });
}

async function checkResponsiveness(page) {
  return await page.evaluate(() => {
    return {
      flexElements: document.querySelectorAll('[style*="flex"], [class*="flex"]').length,
      gridElements: document.querySelectorAll('[style*="grid"], [class*="grid"]').length,
    };
  });
}

async function captureScreenshots(page, pageName) {
  console.log(`   Capturando screenshots...`);

  try {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    const desktopScreenshot = path.join(SCREENSHOTS_DIR, `${pageName}-desktop.png`);
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    console.log(`   Mais Desktop screenshot: ${desktopScreenshot}`);

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    const mobileScreenshot = path.join(SCREENSHOTS_DIR, `${pageName}-mobile.png`);
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
    console.log(`   Mais Mobile screenshot: ${mobileScreenshot}`);

    return {
      desktop: desktopScreenshot,
      mobile: mobileScreenshot,
    };
  } catch (error) {
    console.error(`   Erro ao capturar screenshots: ${error}`);
    return null;
  }
}

async function testPage(browser, pageTitle, pageUrl) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TESTE VISUAL: ${pageTitle}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`URL: ${pageUrl}`);

  let page = null;
  const issues = [];

  try {
    page = await browser.newPage({
      ignoreHTTPSErrors: true,
    });

    // Coletar console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`Page error: ${err.message}`);
    });

    // Navegar para a página
    console.log('\nNavegando...');
    let response = null;
    try {
      response = await page.goto(pageUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch (err) {
      if (err.message.includes('ERR_CERT_AUTHORITY_INVALID')) {
        console.log('   Nota: Erro de certificado SSL (esperado em ambiente local)');
      } else {
        throw err;
      }
    }

    // Aguardar renderização
    await page.waitForTimeout(2000);

    const status = response?.status() || null;
    console.log(`Status HTTP: ${status || 'Carregado (erro de certificado ignorado)'}`);

    // Verificar se foi redirecionado para login
    const currentUrl = page.url();
    const requiresAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');

    if (requiresAuth) {
      console.log('Nota: Página requer autenticação');
      issues.push('Página requer autenticação');
    }

    // Capturar screenshots
    console.log('\nScreenshots:');
    const screenshots = await captureScreenshots(page, pageTitle.toLowerCase().split(' ').join('-'));

    // Verificar layout
    console.log('\nAnlise de Layout:');
    const layoutIssues = await checkLayoutIssues(page);
    console.log(`   AppShells encontrados: ${layoutIssues.duplicateAppShells}`);
    if (layoutIssues.duplicateAppShells > 1) {
      console.log('   PROBLEMA: Múltiplos AppShells encontrados!');
      issues.push(`Múltiplos AppShells: ${layoutIssues.duplicateAppShells}`);
    } else if (layoutIssues.duplicateAppShells === 1) {
      console.log('   Layout correto (um AppShell)');
    } else {
      console.log('   Nota: Nenhum AppShell encontrado');
      issues.push('AppShell não encontrado');
    }
    console.log(`   Elementos ocultos: ${layoutIssues.hiddenElements}`);
    if (layoutIssues.overflowIssues > 0) {
      console.log(`   Nota: Issues de overflow: ${layoutIssues.overflowIssues}px`);
      issues.push(`Overflow horizontal: ${layoutIssues.overflowIssues}px`);
    }

    // Verificar elementos visíveis
    console.log('\nElementos na Página:');
    const elementCheck = await page.evaluate(() => {
      return {
        headersVisible: document.querySelectorAll('h1, h2, h3').length > 0,
        buttonsCount: document.querySelectorAll('button').length,
        formsPresent: document.querySelectorAll('form').length > 0,
        navigationVisible: document.querySelectorAll('nav').length > 0,
        images: document.querySelectorAll('img').length,
        links: document.querySelectorAll('a').length,
      };
    });

    console.log(`   Headers: ${elementCheck.headersVisible ? 'Sim' : 'No'}`);
    console.log(`   Botões: ${elementCheck.buttonsCount} encontrados`);
    console.log(`   Formulários: ${elementCheck.formsPresent ? 'Sim' : 'No'}`);
    console.log(`   Navegação: ${elementCheck.navigationVisible ? 'Sim' : 'No'}`);
    console.log(`   Imagens: ${elementCheck.images}`);
    console.log(`   Links: ${elementCheck.links}`);

    // Verificar acessibilidade
    console.log('\nAcessibilidade:');
    const a11y = await checkAccessibility(page);
    console.log(`   Imagens sem alt: ${a11y.missingAlt}`);
    if (a11y.missingAlt > 0) {
      issues.push(`${a11y.missingAlt} imagens sem atributo alt`);
    }
    console.log(`   Inputs sem label: ${a11y.missingLabels}`);
    if (a11y.missingLabels > 0) {
      issues.push(`${a11y.missingLabels} inputs sem label`);
    }

    // Verificar responsividade
    console.log('\nResponsividade:');
    const responsive = await checkResponsiveness(page);
    console.log(`   Elementos Flex: ${responsive.flexElements}`);
    console.log(`   Elementos Grid: ${responsive.gridElements}`);

    // Console errors
    console.log('\nConsole:');
    console.log(`   Erros de console: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 3).forEach((err) => {
        console.log(`   - ${err.substring(0, 80)}`);
      });
      if (consoleErrors.length > 3) {
        console.log(`   ... e mais ${consoleErrors.length - 3} erros`);
      }
    }

    // Armazenar resultado
    const result = {
      page: pageTitle,
      url: pageUrl,
      timestamp: new Date().toISOString(),
      status,
      screenshots,
      layout: {
        duplicateAppShells: layoutIssues.duplicateAppShells,
        hiddenElements: layoutIssues.hiddenElements,
        overflowIssues: layoutIssues.overflowIssues,
      },
      elements: {
        headersVisible: elementCheck.headersVisible,
        buttonsVisible: elementCheck.buttonsCount,
        formsPresent: elementCheck.formsPresent,
        navigationVisible: elementCheck.navigationVisible,
      },
      consoleErrors: consoleErrors.slice(0, 5),
      accessibility: {
        missingAlt: a11y.missingAlt,
        missingLabels: a11y.missingLabels,
      },
      responsiveness: responsive,
      issues,
    };

    results.push(result);

    // Salvar resultado individual
    const resultFile = path.join(SCREENSHOTS_DIR, `${pageTitle.toLowerCase().split(' ').join('-')}-report.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
    console.log(`\nRelatório salvo: ${resultFile}`);

    if (issues.length === 0) {
      console.log('\nNenhum problema encontrado!');
    } else {
      console.log(`\nProblema(s) encontrado(s): ${issues.length}`);
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }
  } catch (error) {
    console.error(`\nErro ao testar página: ${error}`);
    if (page) {
      try {
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `${pageTitle.toLowerCase().split(' ').join('-')}-error.png`);
        await page.screenshot({ path: errorScreenshot });
        console.log(`   Screenshot de erro: ${errorScreenshot}`);
      } catch (e) {
        // Ignorar erro ao capturar screenshot de erro
      }
    }
  } finally {
    if (page) {
      await page.close();
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTES VISUAIS - SITE DE PRODUÇÃO');
  console.log('https://projetoevyrapt.vercel.app');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    ignoreHTTPSErrors: true,
  });

  try {
    // Testar as 3 páginas
    await testPage(browser, 'Pagamentos', `${BASE_URL}/app/payments`);
    await testPage(browser, 'Propostas', `${BASE_URL}/app/proposals`);
    await testPage(browser, 'Perfil', `${BASE_URL}/app/profile`);

    // Gerar relatório consolidado
    console.log(`\n${'='.repeat(70)}`);
    console.log('RELATÓRIO CONSOLIDADO');
    console.log('='.repeat(70));

    const consolidatedReport = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      screenshotsDir: SCREENSHOTS_DIR,
      pages: results,
      summary: {
        totalPages: results.length,
        pagesWithIssues: results.filter((r) => r.issues.length > 0).length,
        totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
        appShellsOk: results.filter((r) => r.layout.duplicateAppShells === 1).length,
        overflowIssues: results.filter((r) => r.layout.overflowIssues > 0).length,
        a11yIssues: results.reduce((sum, r) => sum + r.accessibility.missingAlt + r.accessibility.missingLabels, 0),
      },
    };

    const reportFile = path.join(SCREENSHOTS_DIR, 'visual-tests-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(consolidatedReport, null, 2));
    console.log(`\nRelatório consolidado: ${reportFile}`);

    // Imprimir sumário
    console.log(`\nSUMÁRIO:`);
    console.log(`   Total de páginas testadas: ${consolidatedReport.summary.totalPages}`);
    console.log(`   Páginas com problemas: ${consolidatedReport.summary.pagesWithIssues}`);
    console.log(`   Total de problemas: ${consolidatedReport.summary.totalIssues}`);
    console.log(`   AppShells corretos: ${consolidatedReport.summary.appShellsOk}/${consolidatedReport.summary.totalPages}`);
    console.log(`   Páginas com overflow: ${consolidatedReport.summary.overflowIssues}`);
    console.log(`   Problemas de acessibilidade: ${consolidatedReport.summary.a11yIssues}`);

    console.log(`\nTestes concluídos!`);
    console.log(`Screenshots salvas em: ${SCREENSHOTS_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
