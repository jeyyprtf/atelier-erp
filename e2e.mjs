import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:4173'
const SHOTS = '/tmp/erp-shots'
fs.mkdirSync(SHOTS, { recursive: true })
const errors = []

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true })

async function login(p) {
  await p.goto(BASE, { waitUntil: 'load' })
  await p.waitForSelector('h1:has-text("Welcome back")')
  await p.fill('input[type=email]', 'business@juan.web.id')
  await p.fill('input[type=password]', 'Juanganteng425')
  await p.click('button:has-text("Sign in")')
  await p.waitForSelector('h1:has-text("My Tasks")', { timeout: 15000 })
}

await page.goto(BASE, { waitUntil: 'load' })
await page.waitForSelector('h1:has-text("Welcome back")')
if (!(await page.locator('button:has-text("Continue with Google")').count())) errors.push('no google button on login')
await shot('01-login')

await login(page)
await page.waitForTimeout(900)
if (!(await page.locator('a[href="/resources"]').count())) errors.push('no resources nav link')
await shot('02-mytasks')

for (const [link, heading, file] of [
  ['Team Progress', 'Team Progress', '03-team'],
  ['Assignment', 'Assignment', '04-assign'],
  ['Meeting Notes', 'Meeting Notes', '05-meetings'],
  ['Resources', 'Resources', '05b-resources'],
  ['Members', 'Members', '06-members'],
]) {
  await page.getByRole('link', { name: link }).click()
  await page.waitForSelector(`h1:has-text("${heading}")`, { timeout: 10000 })
  await page.waitForTimeout(500)
  await shot(file)
}

// profile + dark mode
try {
  await page.goto(BASE + '/profile', { waitUntil: 'load' })
  await page.waitForSelector('h1:has-text("Profile")')
  await page.waitForTimeout(500)
  await shot('11-profile-light')
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await page.waitForTimeout(600)
  await shot('12-profile-dark')
  await page.getByRole('link', { name: 'Team Progress' }).click()
  await page.waitForSelector('h1:has-text("Team Progress")')
  await page.waitForTimeout(600)
  await shot('13-team-dark')
} catch (e) { errors.push('profile/dark: ' + e.message) }

// new task modal (in dark)
try {
  await page.getByRole('link', { name: 'Assignment' }).click()
  await page.waitForSelector('h1:has-text("Assignment")')
  await page.getByRole('button', { name: '+ New Task' }).click()
  await page.waitForSelector('h2:has-text("New Task")', { timeout: 4000 })
  await shot('08-newtask-dark')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
} catch (e) { errors.push('newtask: ' + e.message) }

// mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mp = await m.newPage()
mp.on('pageerror', (e) => errors.push('m-pageerror: ' + e.message))
await login(mp)
await mp.waitForTimeout(700)
await mp.screenshot({ path: `${SHOTS}/09-mobile-mytasks.png`, fullPage: true })
await mp.getByRole('button', { name: 'Open menu' }).click()
await mp.waitForTimeout(500)
await mp.screenshot({ path: `${SHOTS}/10-mobile-drawer.png` })

await browser.close()
console.log('ERRORS:', errors.length)
errors.forEach((e) => console.log(' -', e))
console.log('SHOTS:', fs.readdirSync(SHOTS).sort().join(', '))
