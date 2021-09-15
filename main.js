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
const dicksDumbbellsUrl = 'https://www.dickssportinggoods.com/p/fitness-gear-cast-hex-dumbbell-various-weights-16fgeu10lbcsthxdmdmb/16fgeu10lbcsthxdmdmb'
const dicksPlatesUrl = 'https://www.dickssportinggoods.com/p/fitness-gear-olympic-cast-plate-16fgeufg25lblycstwpl/16fgeufg25lblycstwpl'


let { page, browser } = await getDicksWebpage(dicksDumbbellsUrl)
const dicksStatenIsland = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '10310' })
const dicks2 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 2 })
const dicks3 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 3 })
const dicks4 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 4 })
const dicks5 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 5 })
const dicks6 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 6 })
const dicks7 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 7 })
const dicks8 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 8 })
const dicks9 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 9 })
const dicks10 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 10 })
const dicks11 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 11 })
const dicks12 = await getDicksProductInfo({ page, type: 'dumbbell', locationItem: 12 })
// const dicksUpstateByNanas = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '13413' })

// // On the way to Nana's.
// const dicksKingston = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '12401' })
// const dicksAlbany = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '12203' })
// const dicksLatham = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '12110' })

// // 1 hr from Nana's.
// const dicksSyracuse = await getDicksProductInfo({ page, type: 'dumbbell', zipCode: '13214' })

await browser.close()


// const platesData = await getDicksWebpage(dicksPlatesUrl)
// const page = platesData.page
// const browser = platesData.browser
// const dicksStatenIsland = await getDicksProductInfo({ page, type: 'plate', zipCode: '10310' })
// const dicks2 = await getDicksProductInfo({ page, type: 'plate', locationItem: 2 })
// const dicks3 = await getDicksProductInfo({ page, type: 'plate', locationItem: 3 })
// const dicks4 = await getDicksProductInfo({ page, type: 'plate', locationItem: 4 })
// const dicks5 = await getDicksProductInfo({ page, type: 'plate', locationItem: 5 })
// const dicks6 = await getDicksProductInfo({ page, type: 'plate', locationItem: 6 })
// const dicks7 = await getDicksProductInfo({ page, type: 'plate', locationItem: 7 })
// const dicks8 = await getDicksProductInfo({ page, type: 'plate', locationItem: 8 })
// const dicks9 = await getDicksProductInfo({ page, type: 'plate', locationItem: 9 })
// const dicks10 = await getDicksProductInfo({ page, type: 'plate', locationItem: 10 })
// const dicks11 = await getDicksProductInfo({ page, type: 'plate', locationItem: 11 })
// const dicks12 = await getDicksProductInfo({ page, type: 'plate', locationItem: 12 })

// await browser.close()




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

async function getDicksWebpage(url) {
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

async function getDicksProductInfo({ page, locationItem, zipCode, type }) {
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
      await closeButton.click()
    } else {
      await setStoreButton.click()
    }
  }

  console.log(chalk.bold(`DICKS (${storeName} - ${storeMiles})`))
  const itemSelector = lbs => `[aria-label="${lbs} lbs."]`

  if (type === 'dumbbell') {

    // 15 lbs.
    // const notInStock15 = await itemChecker(itemSelector(15), 15)

    // 25 lbs.
    // const notInStock25 = await itemChecker(itemSelector(25), 25) // Latham - 12110

    // 30 lbs.
    // const notInStock30 = await itemChecker(itemSelector(30), 30) // Latham - 12110

    // 35 lbs.
    // const notInStock35 = await itemChecker(itemSelector(35), 35) // Princeton

    // 40 lbs.
    // const notInStock40 = await itemChecker(itemSelector(40), 40) // Princeton

    // 45 lbs.
    const notInStock45 = await itemChecker(itemSelector(45), 45)

    // 50 lbs.
    const notInStock50 = await itemChecker(itemSelector(50), 50)
  } else if (type === 'plate') {
    // 5 lbs.
    const notInStock5 = await itemChecker(itemSelector(5), 5)

    // 10 lbs.
    const notInStock10 = await itemChecker(itemSelector(10), 10)

    // 25 lbs.
    const notInStock25 = await itemChecker(itemSelector(25), 25)

    // 35 lbs.
    const notInStock35 = await itemChecker(itemSelector(35), 35)

    // 45 lbs.
    const notInStock45 = await itemChecker(itemSelector(45), 45)
  }

  console.log('\n')

  async function itemChecker(selector, lbs) {
    const lbsButton = await page.waitForSelector(selector)

    /*
      We need a way to ensure that all fetch requests are completed
      as a result of clicking this button. It doesn't seem that Puppeteer
      supports this at the moment -
    */
   await Promise.all([
     waitForNetworkIdle(page, 250),
     lbsButton.click(),
   ])

    const messageSelector = '#shippingOptions > div:nth-child(3) > label > .radio-label > div > span'
    const howManyLeftSelector = '#shippingOptions > div:nth-child(3) > label > .radio-label > div:nth-child(2)'
    const notAvailableText = `Not Available at  ${storeName.toUpperCase()}`
    const availableText = `In Stock at  ${storeName.toUpperCase()}`

    const messegeEl = await page.waitForSelector(messageSelector)
    const howManyLeftEl = await page.waitForSelector(howManyLeftSelector)
    const messageText = await page.evaluate(el => el.textContent, messegeEl)
    const notInStock = messageText.includes(notAvailableText)
    const inStock = messageText.includes(availableText)
    const howManyText = await page.evaluate(el => el.textContent, howManyLeftEl)

    if (notInStock) {
      console.log(`  (${type}) ${lbs}lbs - not in stock.`)
    } else if (inStock) {
      console.log(chalk.keyword('lime').bold(`  ${lbs}lbs - IN STOCK! `), chalk.red(howManyText))
    } else {
      console.log(`  ${lbs}lbs - couldn't determine stock :/`)
      console.log(chalk.red(messageText))
    }

    return notInStock
  }
}

// https://stackoverflow.com/a/56011152/2525633
function waitForNetworkIdle2(page, timeout, maxInflightRequests = 0) {
  page.on('request', onRequestStarted);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFinished);

  let inflight = 0;
  let fulfill;
  let promise = new Promise(x => fulfill = x);
  let timeoutId = setTimeout(onTimeoutDone, timeout);
  return promise;

  function onTimeoutDone() {
    page.removeListener('request', onRequestStarted);
    page.removeListener('requestfinished', onRequestFinished);
    page.removeListener('requestfailed', onRequestFinished);
    fulfill();
  }

  function onRequestStarted() {
    ++inflight;
    if (inflight > maxInflightRequests)
      clearTimeout(timeoutId);
  }

  function onRequestFinished() {
    if (inflight === 0)
      return;
    --inflight;
    if (inflight === maxInflightRequests)
      timeoutId = setTimeout(onTimeoutDone, timeout);
  }
}

function waitForNetworkIdle(page, time = 250, maxTimeout = 5000) {
  let requests = []
  let interval

  page.on('requestfinished', removeRequest)
  page.on('requestfailed', removeRequest)
  page.on('request', addRequest)

  function removeRequest(request) {
    requests--
  }

  function addRequest(request) {
    console.log('\n----------REQUEST----------')
    console.log(request.headers())
    console.log(request.method())
    console.log(request.postData())
    console.log('----------REQUEST----------\n')
    requests++
  }

  return new Promise(resolve => {
    // Resolve the promise after the max time no matter what.
    const timeout = setTimeout(() => {
      clearInterval(interval)
      resolve()
    }, maxTimeout)

    // Poll for the number of requests and resolve conditionally.
    interval = setInterval(() => {
      if (requests < 1) {
        page.removeListener('requestfinished', removeRequest)
        page.removeListener('requestfailed', removeRequest)
        page.removeListener('request', addRequest)
        clearTimeout(timeout)
        clearInterval(interval)
        resolve()
      }
    }, time)
  })
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
