// Run against tests/preview-server.js only; its test identity cookie is never production auth.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8086';
 if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error('Use an isolated local test server.');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago'});
 await context.addCookies([{name:'test-golfer',value:'alice',url:origin}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/ui/');await page.waitForSelector('#discoveryResults button');
 assert.equal(await page.locator('#exploreList button').count(),8);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('#planningDate').fill('2026-12-01');await page.locator('.find-btn').click();
 await page.waitForFunction(()=>document.querySelector('#discoveryStatus').textContent.includes('2026-12-01'));
 await page.locator('#discoveryResults button').first().click();assert.equal(await page.locator('#courseDate').inputValue(),'2026-12-01');
 await page.locator('#saveCourse').click();assert.equal(await page.locator('#saveCourse').getAttribute('aria-pressed'),'true');
 await context.route('https://**',route=>route.fulfill({status:200,body:'Isolated external link test'}));
 const popup=context.waitForEvent('page');await page.locator('#checkAvailability').click();await (await popup).close();
 await page.locator('[data-nav="rounds"]').click();await page.waitForFunction(()=>!document.querySelector('#addRound').disabled);
 assert.match(await page.locator('#plansList').innerText(),/2026-12-01/);
 await page.locator('#addRound').click();await page.locator('#scoreCourse').selectOption('waveland');await page.locator('#scoreDate').fill('2026-08-01');await page.locator('#scoreStrokes').fill('84');await page.locator('#scorePar').fill('72');await page.locator('#saveScore').click();
 await page.waitForSelector('[data-review-round]');await page.locator('[data-review-round]').first().click();await page.locator('#feedbackAgain').selectOption('yes');await page.locator('#saveFeedback').click();await page.waitForFunction(()=>!document.querySelector('#feedbackDialog').open);
 await page.locator('[data-nav="home"]').click();await page.waitForFunction(()=>document.querySelector('#discoveryResults button h2').textContent.includes('Waveland'));
 await page.screenshot({path:'/private/tmp/flyover-launch-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/private/tmp/flyover-launch-desktop.png',fullPage:true});
 await page.locator('[data-nav="rounds"]').click();await page.waitForSelector('[data-delete-round]');await page.locator('[data-delete-round]').first().click();await page.locator('#cancelDelete').click();assert.ok(await page.locator('[data-delete-round]').count());
 const downloadEvent=page.waitForEvent('download');await page.locator('#exportAccount').click();const download=await downloadEvent;const fs=require('node:fs');const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.rounds[0].feedback.playAgain,'yes');assert.ok(backup.browserData['flyover-availability-plans']);
 await page.locator('[data-delete-round]').first().click();await page.locator('#deleteConfirmation').fill('DELETE');await page.locator('#confirmDelete').click();await page.waitForFunction(()=>document.querySelector('#scoreStatus').textContent.includes('Round deleted'));
 await page.locator('#importScoresFile').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForSelector('[data-delete-round]');
 const bob=await browser.newContext();await bob.addCookies([{name:'test-golfer',value:'bob',url:origin}]);const other=await bob.newPage();await other.goto(origin+'/ui/#rounds');await other.waitForFunction(()=>document.querySelector('#scoreStatus').textContent.includes('0 scored'));
 await page.locator('#deleteAccount').click();await page.locator('#deleteConfirmation').fill('DELETE');await page.locator('#confirmDelete').click();await page.waitForFunction(()=>document.querySelector('#scoreStatus').textContent.includes('Your Flyover data was deleted'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('flyover-availability-plans')),null);
 assert.deepEqual(errors,[]);console.log('PASS mobile/desktop, eight courses, planning date, favorite, score/review ranking, export, cancel/delete, restore, account isolation and account deletion.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
