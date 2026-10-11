import { test, expect } from '@playwright/test';

test('desktop overview and exact math flow, domains and route persistence',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/'); await expect(page.getByRole('heading',{name:/Mathematics,.*made explorable/ })).toBeVisible();
 await page.getByRole('button',{name:'Open the playground'}).click();
 await page.getByRole('button',{name:'Calculate sum'}).click();
 await expect(page.getByTestId('sum-result')).toHaveText('338,350');
 await expect(page.getByText('Exact match with term-by-term verification')).toBeVisible();
 await page.getByLabel('Term count (n)').fill('-1');await page.getByRole('button',{name:'Calculate sum'}).click();await expect(page.getByRole('alert')).toContainText('non-negative');
 await page.getByLabel('Term count (n)').fill('3');await page.getByRole('button',{name:'Geometric',exact:true}).click();await page.getByLabel('Ratio (r)').fill('2');await page.getByRole('button',{name:'Calculate sum'}).click();await expect(page.getByTestId('sum-result')).toHaveText('7');
 await page.getByRole('button',{name:'Harmonic',exact:true}).click();await page.getByLabel('First denominator (a)').fill('0');await page.getByRole('button',{name:'Calculate sum'}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('link',{name:'Skip to content'}).focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/#playground$/);await expect(page.locator('#content')).toBeFocused();
 await page.reload();await expect(page.getByRole('heading',{name:'The math playground'})).toBeVisible();expect(errors).toEqual([]);
});

test('sequence random access, sparse correction, virtual scrolling and reset',async({page})=>{
 await page.goto('/#sequences');await page.getByLabel('Jump to index').fill('999999');await page.getByRole('button',{name:'Jump',exact:false}).click();await expect(page.locator('.virtual-row')).toHaveCount(1);await expect(page.locator('.virtual-row')).toContainText('2,000,001');
 await page.getByLabel('Jump to index').fill('0');await page.getByRole('button',{name:'Jump',exact:false}).click();await page.getByLabel('Override index 0 with 999').check();await expect(page.locator('.virtual-row').first()).toContainText('999');
 await page.locator('.virtual-scroll').evaluate(el=>el.scrollTop=10000);await expect(page.locator('.virtual-row').first()).toContainText('250');
 await page.getByLabel('Logical sequence length').selectOption('10000');await expect(page.locator('.virtual-row').first()).toContainText('999');expect(await page.locator('.virtual-scroll').evaluate(el=>el.scrollTop)).toBe(0);
 await page.locator('.virtual-scroll').evaluate(el=>el.scrollTop=10000);await page.getByLabel('Logical sequence length').selectOption('1000000');expect(await page.locator('.virtual-scroll').evaluate(el=>el.scrollTop)).toBe(0);await expect(page.locator('.virtual-row')).toHaveCount(12);
 await page.getByLabel('Jump to index').fill('1000000');await page.getByRole('button',{name:'Jump',exact:false}).click();await expect(page.getByRole('alert')).toContainText('Choose an index');
});

test('toolkit keyboard tabs, native dialog escape, focus restoration, navigation',async({page})=>{
 await page.goto('/#toolkit');const trigger=page.getByRole('button',{name:'Open dialog'});await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');await expect(page.getByRole('dialog')).toContainText('focused interaction');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(trigger).toBeFocused();
 await trigger.click();await page.getByRole('button',{name:'Close dialog',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 const first=page.getByRole('tab',{name:'Layout utilities'});await first.focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'React components'})).toHaveAttribute('aria-selected','true');await page.keyboard.press('End');await expect(page.getByRole('tab',{name:'Without React'})).toHaveAttribute('aria-selected','true');await page.keyboard.press('Home');await expect(first).toHaveAttribute('aria-selected','true');
 await page.getByRole('link',{name:'Research & benchmarks'}).click();await expect(page.locator('tbody tr')).toHaveCount(4);await expect(page.getByRole('heading',{name:'What could this change?'})).toBeVisible();await page.goBack();await expect(page.getByRole('heading',{name:'A toolkit you can take with you'})).toBeVisible();
});

for(const width of [390,768,1440])test(`responsive pages at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 for(const route of ['overview','playground','sequences','research','toolkit','docs']){
  await page.goto('/#'+route);await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 if(width===390){await page.goto('/');await page.screenshot({path:'screenshots/mobile-overview.png',fullPage:true});}
 if(width===1440){await page.goto('/');await page.screenshot({path:'screenshots/desktop-overview.png',fullPage:true});await page.goto('/#playground');await page.getByRole('button',{name:'Calculate sum'}).click();await page.screenshot({path:'screenshots/desktop-playground.png',fullPage:true});}
});
