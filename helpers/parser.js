
import puppeteer from 'puppeteer';

export async function start() {

  const site = 'https://www.tvigle.ru/catalog/filmy/fantastika/';

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  })

  async function getParam(selector) {
    await page.waitForSelector(selector, { timeout: 1000 });
    let result = await page.$eval(selector, e => e.textContent);
    return result
  }

  async function getLinks() {

    let arr = [];

    await page.goto(site);

    let allElem = await page.$$('div.styles_collectionList__qqJDT > a');

    for (let i = 1; i <= allElem.length; i++) {
      // for (let i = 1; i <= 1; i++) {
      let selector = `div.styles_collectionList__qqJDT > a:nth-child(${i})`;

      await page.waitForSelector(selector);
      let link = await page.$eval(selector, e => e.href);

      let imagePath_selector = `div.styles_collectionList__qqJDT > a:nth-child(${i}) > div > div.styles_poster__Jm_Rf > img`;
      let imagePath = await page.$eval(imagePath_selector, e => e.src);

      arr.push({ link, imagePath });
    }
    return arr
  }

  let films = await getLinks();

  async function getData() {

    for (const film of films) {

      try {
        await page.goto(film.link);

        let text = await getParam('div.product__description > div > div');

        film.name = await getParam('div.product__info-content > h1');
        film.descr = text.replace(/\s+/g, ' ');
        film.country = await getParam('div.product__info-content > div > span:nth-child(3)');
        film.year = await getParam('div.product__info-content > div > span:nth-child(4)');
        film.rating = await getParam('div.banner_240_area > div > span');
        film.director = await getParam('div.persons.creators.phone_hidden > div:nth-child(1) > a > span');

        const actors = await page.evaluate(() => Array.from(document.querySelectorAll('[itemprop="name"]'), e => e.textContent));
        actors.splice(0, 4);

        film.actors = [... new Set(actors)];;
        film.translit = film.link.split('/')[film.link.split('/').length - 2];
        film.comments = [];
        film.isComments = false;
        film.my_rating = [];
        film.isMy_rating = false;

      } catch {
        console.log(`data loaded error`);
        film.error = true;
      }
    }
  }

  await getData();

  await browser.close();

  return films.filter(e => !e.error);
}