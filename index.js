
import express from 'express'
import expressHandlebars from 'express-handlebars';
import puppeteer from 'puppeteer';

const handlebars = expressHandlebars.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {

    getTitle: obj => obj.title,
    getImagePath: obj => obj.imgPath,
    getLink: obj => obj.link,
    getTRanslit: obj => obj.translit,
    getId: obj => obj.id
  }
});

let app = express()

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.urlencoded({ extended: true }));

let getData = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const URL = 'https://www.film.ru/a-z/movies/science_fiction'
  await page.goto(URL);

  const result = await page.evaluate(() => {

    function getTranslit(str) {
      let result = str.split('/')
      return result[result.length - 1]
    }

    let films = []; // Создю пустой массив для хранения данных

    let elements = document.querySelectorAll('.film_list'); // Выбирю все фильмы

    for (var element of elements) {

      let id = element.id
      let title = element.title
      let imgPath = 'https://www.film.ru' + element.childNodes[1].childNodes[1].getAttribute('data-src')
      let link = element.childNodes[3].href

      // console.log(new XMLSerializer().serializeToString(element.childNodes[5]));

      films.push({ // Помещаею объект с данными в массив
        id,
        title,
        imgPath,
        link,
        translit: getTranslit(link)
      });
    }

    return films; // Возвращаю массив
  });

  browser.close();
  return result; // Возвращаю данные
};

let movies = await getData()

app.get('/', (req, res) => {
  res.render('allFilms', {
    title: 'title',
    movies: movies
  })
});

app.get('/film/:name', (req, res) => {
  let film
  for (const movie of movies) {
    if (movie.translit === req.params.name) film = movie
  }

  res.render('film', {
    film: film
  })
})

app.use(function (req, res) {
  res.status(404).send('not found');
});

app.listen(3004, () => console.log('the server is running'))
