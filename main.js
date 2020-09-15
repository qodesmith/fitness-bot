import axios from 'axios'
import cheerio from 'cheerio'
import products from './products.js'
import chalk from 'chalk'
import nodemailer from 'nodemailer'
import express from 'express'
import puppeteer from 'puppeteer'
import dotenv from 'dotenv'

// Import environment variables.
dotenv.config()

const {
  NODEMAILER_PASSWORD,
  NODEMAILER_USER,
  NODEMAILER_HOST
} = process.env
const wait = num => new Promise(resolve => setTimeout(resolve, num))

//////////////////////////
// REP Fitness Products //
//////////////////////////
await Promise.all(products.map(getRepFitnessProductInfo))
  .then(messages => {
    const longestMessage = messages.reduce((length, msg) => msg.length > length ? msg.length : length ,0)
    console.log(chalk.bold('REP FITNESS:'))

    messages.forEach(message => {
      console.log(`  ${message}`)
      console.log(`  ${'-'.repeat(longestMessage)}`)
    })
    console.log('\n')
  })


///////////////////////////
// Dick's Sporting Goods //
///////////////////////////
const { page, browser } = await getDicksWebpage()
const dicksStatenIsland = await getDicksProductInfo({ page, zipCode: '10310' })
const dicks2 = await getDicksProductInfo({ page, locationItem: 2 })
const dicks3 = await getDicksProductInfo({ page, locationItem: 3 })
const dicks4 = await getDicksProductInfo({ page, locationItem: 4 })
const dicks5 = await getDicksProductInfo({ page, locationItem: 5 })
const dicks6 = await getDicksProductInfo({ page, locationItem: 6 })
const dicks7 = await getDicksProductInfo({ page, locationItem: 7 })
const dicks8 = await getDicksProductInfo({ page, locationItem: 8 })
const dicks9 = await getDicksProductInfo({ page, locationItem: 9 })
const dicks10 = await getDicksProductInfo({ page, locationItem: 10 })
const dicks11 = await getDicksProductInfo({ page, locationItem: 11 })
const dicks12 = await getDicksProductInfo({ page, locationItem: 12 })
const dicksUpstateByNanas = await getDicksProductInfo({ page, zipCode: '13413' })


await browser.close()

async function getRepFitnessProductInfo({ url, originalPrice, selectors, titleAddon }) {
  const { data } = await axios.get(url)

  try {
    const $ = cheerio.load(data)
    const price = selectors.price ? $(selectors.price).first().text().trim() : 'N/A'
    const availability = selectors.availability ? $(selectors.availability).text().trim() : 'N/A'
    const title = selectors.title ? $(selectors.title).text().trim() : 'N/A'
    const color = availability === 'Out of stock' ? x => x : chalk.keyword('lime').bold
    const additionalTitleDesc = titleAddon ? ` ${titleAddon}` : ''

    return color(`${price} <${originalPrice}> - ${availability} - ${title}${additionalTitleDesc}`)
  } catch(e) {
    console.log(e)
    return chalk.red(`<${originalPrice}> ${url}`)
  }
}

async function getDicksWebpage() {
  const url = 'https://www.dickssportinggoods.com/p/fitness-gear-cast-hex-dumbbell-various-weights-16fgeu10lbcsthxdmdmb/16fgeu10lbcsthxdmdmb'
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-notifications',
      '--disable-search-geolocation-disclosure',
    ],
  })

  // https://pptr.dev/#?product=Puppeteer&show=api-browsercontextoverridepermissionsorigin-permissions
  const context = browser.defaultBrowserContext()
  await context.overridePermissions(url, [])

  const page = await browser.newPage()
  await page.setViewport({
    width: 1200,
    height: 1050,
  })
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 0,
  })

  return { page, browser }
}

async function getDicksProductInfo({ page, locationItem, zipCode }) {
  // Click the "select store" button.
  ;(await page.$('#store-layer-wrapper > button')).click()

  let storeName = '???'
  let storeMiles = '???'
  if (locationItem || zipCode) {
    let storeLocation

    const checkboxInput = await page.waitForSelector('#showStoresCheckbox')
    const checkboxLabel = await page.waitForSelector('label[for="showStoresCheckbox"]')
    const isChecked = await page.evaluate(el => el.checked, checkboxInput)
    if (isChecked) {
      await checkboxLabel.click()
    }

    if (locationItem) {
      const storeDivSelector = `#stores:nth-child(${locationItem})`
      const storeNameSelector = `${storeDivSelector} > label .store-name`
      const storeMilesSelector = `${storeDivSelector} > label .store-miles`
      const storeLocationSelector = `${storeDivSelector} > label`
      const storeDiv = await page.waitForSelector(storeNameSelector)

      const storeNameEl = await page.$(storeNameSelector)
      const storeMilesEl = await page.$(storeMilesSelector)
      storeName = await page.evaluate(el => el.textContent, storeNameEl)
      storeMiles = await page.evaluate(el => el.textContent, storeMilesEl)

      storeLocation = await page.waitForSelector(storeLocationSelector)
    } else if (zipCode) {
      // storeName = zipCode === '10314' ? 'Staten Island' : 'New Hartford'

      await page.waitForSelector('#zip-code')
      await wait(1000)
      await page.focus('#zip-code')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Delete')
      await wait(1000)
      await page.keyboard.type(zipCode)

      const searchSelector = '.pdp-sidenav-content .store-search-input-container button'
      const searchButton = await page.waitForSelector(searchSelector)
      await searchButton.click()

      // Because sometimes it's still checked -_-
      const checkboxInput = await page.waitForSelector('#showStoresCheckbox')
      const checkboxLabel = await page.waitForSelector('label[for="showStoresCheckbox"]')
      const isChecked = await page.evaluate(el => el.checked, checkboxInput)
      if (isChecked) {
        await checkboxLabel.click()
      }

      await wait(1000)
      const storeLocationSelector = '#stores:nth-child(1)'
      const storeNameSelector = `${storeLocationSelector} > label .store-name`
      const storeNameEl = await page.$(storeNameSelector)
      storeLocation = await page.$(storeLocationSelector)
      storeName = await page.evaluate(el => el.textContent, storeNameEl)
    }

    await storeLocation.click()

    const setStoreSelector = '.store-pickup-controls button.store-pickup-controls-set-store-btn'
    const setStoreButton = await page.waitForSelector(setStoreSelector)
    const setStoreButtonIsDisabled = await page.evaluate(button => button.disabled, setStoreButton)
    if (setStoreButtonIsDisabled) {
      const closeButton = await page.waitForSelector('.panel-description-content .back-button button.btn.btn-close')
      console.log('CLICKING CLOSE BUTTON')
      await closeButton.click()
    } else {
      console.log('CLICKING SET STORE BUTTON')
      await setStoreButton.click()
    }
  }

  console.log(chalk.bold(`DICKS (${storeName} - ${storeMiles})`))
  const lbsSelectorMaker = lbs => `[aria-label="${lbs} lbs."]`

  // 15 lbs.
  const notInStock15 = await lbsChecker(lbsSelectorMaker(15), 15)

  // 25 lbs.
  const notInStock25 = await lbsChecker(lbsSelectorMaker(25), 25)

  // 30 lbs.
  const notInStock30 = await lbsChecker(lbsSelectorMaker(30), 30)

  // 35 lbs.
  const notInStock35 = await lbsChecker(lbsSelectorMaker(35), 35)

  // 40 lbs.
  const notInStock40 = await lbsChecker(lbsSelectorMaker(40), 40)

  // 45 lbs.
  const notInStock45 = await lbsChecker(lbsSelectorMaker(45), 45)

  // 50 lbs.
  const notInStock50 = await lbsChecker(lbsSelectorMaker(50), 50)

  console.log('\n')

  async function lbsChecker(selector, lbs) {
    const lbsButton = await page.waitForSelector(selector)
    await lbsButton.click()

    const messageSelector = '#shippingOptions > div:nth-child(3) > label > .radio-label > div > span'
    const notAvailableText = `Not Available at  ${storeName.toUpperCase()}`
    const availableText = `In Stock at  ${storeName.toUpperCase()}`

    const messegeEl = await page.waitForSelector(messageSelector)
    const text = await page.evaluate(el => el.textContent, messegeEl)
    const notInStock = text.includes(notAvailableText)
    const inStock = text.includes(availableText)

    if (notInStock) {
      console.log(`  ${lbs}lbs - not in stock.`)
    } else if (inStock) {
      console.log(chalk.keyword('lime').bold(`  ${lbs}lbs - IN STOCK!`))
    } else {
      console.log(`  ${lbs}lbs - couldn't determine stock :/`)
      console.log(chalk.red(text))
    }

    return notInStock
  }
}

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    host: NODEMAILER_HOST,
    auth: {
      user: NODEMAILER_USER,
      pass: NODEMAILER_PASSWORD,
    },
  })

  transporter.verify(async (error, success) => {
    if (error) {
      console.log('NOT READY:', error)
    } else {
      const info = await transporter.sendMail({
        from: '👻 Fitness Bot <fitness-bot@nowhere.com>', // sender address
        to: NODEMAILER_USER, // list of receivers
        subject: 'Equipment available!', // Subject line
        html: '<strong>Hello world?</strong><br>Hello world!', // html body
      })
      console.log('------------------------------')
      console.log(info)
    }
  })

}
