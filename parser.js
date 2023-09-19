

import puppeteer from 'puppeteer';


export async function start(link) {
  const site = `https://www.tvigle.ru/catalog/filmy/${link}/`

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080
  })

  async function getParam(selector) {
    await page.waitForSelector(selector, { timeout: 1000 })
    let result = await page.$eval(selector, e => e.textContent)
    return result
  }

  async function getLinks() {

    let arr = []

    await page.goto(site)

    let allElem = await page.$$('div.styles_collectionList__qqJDT > a')

    for (let i = 1; i <= allElem.length; i++) {
      let selector = `div.styles_collectionList__qqJDT > a:nth-child(${i})`

      await page.waitForSelector(selector)
      let link = await page.$eval(selector, e => e.href)

      let imagePath_selector = `div.styles_collectionList__qqJDT > a:nth-child(${i}) > div > div.styles_poster__Jm_Rf > img`
      let imagePath = await page.$eval(imagePath_selector, e => e.src)

      arr.push({ link, imagePath })
    }
    return arr
  }

  let movies = await getLinks()

  async function getData() {

    let filmNumber = 1

    for (const film of movies) {

      try {
        await page.goto(film.link)

        let text = await getParam('div.product__description > div > div')

        film.id = filmNumber++
        film.name = await getParam('div.product__info-content > h1')
        film.descr = text.replace(/\s+/g, ' ')
        // film.country = await getParam('div.product__info-content > div > span:nth-child(3)')
        film.year = await getParam('div.product__info-content > div > span:nth-child(4)')
        film.rating = await getParam('div.banner_240_area > div > span')
        // film.director = await getParam('div.persons.creators.phone_hidden > div:nth-child(1) > a > span')

        // const actors = await page.evaluate(() => Array.from(document.querySelectorAll('[itemprop="name"]'), e => e.textContent));
        // actors.splice(0, 4)

        // film.actors = [... new Set(actors)]
        // film.translit = film.link.split('/')[film.link.split('/').length - 2]

        // console.log(film);

      } catch {
        console.log(`data loaded error`);
      }
    }
  }

  await getData()

  // await console.log(movies);

  await browser.close();

  return movies
}
