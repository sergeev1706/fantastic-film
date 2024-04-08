
import express from 'express';

import fs from 'fs';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import expressHandlebars from 'express-handlebars';

import { start } from './helpers/parser.js';
import { getDate } from './helpers/helpers.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const PORT = 3004;

const handlebars = expressHandlebars.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {
    goBackPage: num => Number(num) > 1 ? Number(num) - 1 : num,
    goNextPage: (num, nums) => Number(num) < Number(nums) ? Number(num) + 1 : num,
    getId: obj => obj.id,
    getName: obj => obj.name,
    getTranslit: obj => obj.translit,
    getImagePath: obj => obj.imagePath,
    getCountry: obj => obj.country,
    getYear: obj => obj.year,
    getRating: obj => obj.rating,
    getLink: obj => obj.link,
    getDescription: obj => {
      let str = obj.descr;
      return str.split('.')[0] + str.split('.')[1] + ' ...';
    },
    getCommentText: obj => obj.text,
    getCommentDate: obj => obj.dateString,
    getCommentAutor: obj => obj.autor,
    getRatingString: obj => {
      let arr = obj.my_rating;
      let sum = 0;

      for (const elem of arr) {
        sum = sum + Number(elem);
      }
      return (sum / arr.length).toFixed(1);
    },
    getIsRating: obj => obj.isMy_rating,
    getNumberOfComments: obj => obj.comments.length,
  }
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const secret = 'qwerty';

let app = express();

app.use(cookieParser(secret));
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.urlencoded({ extended: true }));

let movies = [];

function findFilm(request) {
  return movies.filter(e => e.translit === request)[0];
}

async function writeFile() {
  let json = JSON.stringify(movies);

  fs.writeFile('fantastika.txt', json, function (err) {
    if (err) {
      console.log('Ошибка записи файла');
    }
  });
}

async function readFile() {
  try {
    let json = await fs.promises.readFile('fantastika.txt', 'utf8');
    movies = JSON.parse(json);
  } catch (err) {
    console.log('Ошибка чтения файла');
  }
}

// === pagination ===================== 

let countElem = 5; // количество выводимых карточек на странице
let countPages; // количество страниц
let PAGE; // номер выводимой страницы

// === main ===========================

app.get('/', async (req, res) => {

  if (fs.existsSync(__dirname + '/fantastika.txt')) {
    await readFile();
  } else {
    movies = await start();
    await writeFile();
  }

  if (req.cookies._name_) {
    res.redirect('/page/1');
  } else {
    res.redirect('/initial/');
  }
});

app.get('/initial/', (req, res) => {
  res.render('initial', {
    title: 'авторизация',

    isHeader: false,
  });
})

app.post('/initial/', (req, res) => {

  // сохранение данныхимени пользователя
  res.cookie('_name_', req.body.name, {
    maxAge: 1000 * 60 * 60,
  });
  res.redirect('/page/1');
})

// === paginated list =================

app.get('/page/:num', async (req, res) => {

  let page = req.params.num;
  PAGE = page; // для возврата на прежнюю страницу

  // для пагинации
  let start = (page - 1) * countElem;
  let end = page * countElem;

  // число страниц
  countPages = Math.ceil(movies.length / countElem);

  // массив страниц
  let pages = [];
  for (let i = 1; i <= countPages; i++) pages.push(i);

  // нумерация карточек на странице
  movies.map((el, ind) => el.id = ind + 1);

  res.render('allFilms', {
    title: `Фильмы жанра фантастика, страница ${page}`,

    movies: [...movies].slice(start, end),
    pages: pages,
    page,
    allPages: pages.length,
    isFilter: true,
    isList: true,
    isHeader: true,

    // для фильтров
    years: [... new Set(movies.map(e => e.year))].sort(),
    ratings: [... new Set(movies.map(e => e.rating))].sort(),
    countrys: [... new Set(movies.map(e => e.country))],
  })
});

// === filter =========================

app.post('/filter/', (req, res) => {

  let filterFor = [...movies];
  let year, country, rating;

  // проверка фильтров
  if (req.body.year_select) {
    year = req.body.year_select;
    filterFor = filterFor.filter(e => e.year === year);
  }

  if (req.body.country_select) {
    country = req.body.country_select;
    filterFor = filterFor.filter(e => e.country === country);
  }

  if (req.body.rating_select) {
    rating = req.body.rating_select;
    filterFor = filterFor.filter(e => e.rating === rating);
  }

  // нумерация в фильтрованном списке
  filterFor.map((el, ind) => el.id = ind + 1);

  let noFind = false;
  // если по фильтрам ничего нет
  if (filterFor.length === 0) noFind = true;

  if (req.body.year_select || req.body.country_select || req.body.rating_select) {
    res.render('allFilms', {
      title: `применены фильтры: ${year ? year : ''}${country ? + country : ''}${rating ? ' рейтинг ' + rating : ''}`,

      movies: filterFor,
      noFind,
      isFilter: false,
      pageNum: PAGE,
      isHeader: true,
    })
  } else {
    res.redirect(`/page/${PAGE}`);
  }
})

// === film page ======================

app.get('/film/:film', (req, res) => {

  res.render('film', {
    title: findFilm(req.params.film).name,

    film: findFilm(req.params.film),
    comments: findFilm(req.params.film).comments,
    pageNum: PAGE,
    isList: false,
    isHeader: true,
  })
})

// === comments on the film ===========

app.get('/comments/:film', (req, res) => {

  res.render('comments', {
    filmName: findFilm(req.params.film).name,
    filmTranslit: req.params.film,
    pageNum: PAGE,
    isHeader: true,
  })
})

app.post('/comments/:film', (req, res) => {

  let film = findFilm(req.params.film);

  if (req.body.text !== '') {
    film.isComments = true;
    film.comments.push({
      dateString: getDate(),
      text: req.body.text,
      autor: req.cookies._name_,
    });
    film.isComments = true;
  }

  // сохранение коментариев
  writeFile();

  res.render('film', {
    title: film.name,

    film: film,
    comments: film.comments,
    pageNum: PAGE,
    isHeader: true,
  })
})

// === rating of the film =========================


app.get('/rating/:film', (req, res) => {

  res.render(req.cookies.rating_film === req.params.film ? 'notRating' : 'rating', {
    filmName: findFilm(req.params.film).name,
    filmTranslit: req.params.film,
    pageNum: PAGE,
    isHeader: true,
  })
})

app.post('/rating/:film', (req, res) => {

  res.cookie('rating_film', req.params.film, { maxAge: 1000 * 60 * 60 });

  let film = findFilm(req.params.film);

  if (req.body.rating !== '') {
    film.my_rating.push(req.body.rating);
    film.isMy_rating = true;
  }

  // сохранение рейтинга
  writeFile();

  res.render('film', {
    title: film.name,

    film: film,
    comments: film.comments,
    pageNum: PAGE,
    isHeader: true,
  })
})

app.get('/test/', (req, res) => {
  res.send('test page')
})

// ====================================

app.use(function (req, res) {
  res.status(404).send('not found');
});

app.listen(PORT, () => console.log(`The server is running on the port ${PORT}`));