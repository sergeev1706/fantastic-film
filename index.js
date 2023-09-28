
import express from 'express';
import cookieParser from 'cookie-parser';

import expressHandlebars from 'express-handlebars';

import { start } from './parser.js';
import { getDate } from './helpers.js';

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
      let arr = obj.my_rating
      let sum = 0;

      for (const elem of arr) {
        sum = sum + Number(elem)
      }
      return (sum / arr.length).toFixed(1)
    },
    getIsRating: obj => obj.isMy_rating,
    getNumberOfComments: obj => obj.comments.length
  }
});

let app = express();


let secret = 'qwerty';
app.use(cookieParser(secret));

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.urlencoded({ extended: true }));

let movies = await start();
movies = movies.filter(e => !e.error);

let arrFilmsYears = [... new Set(movies.map(e => e.year))].sort();
let arrFilmRating = [... new Set(movies.map(e => e.rating))].sort();;
let arrFilmCountry = [... new Set(movies.map(e => e.country))];

// ----------------- pagination -----------------------------------------

let countElem = 4; // количество выводимых карточек на странице
let countPages; // количество страниц

countPages = Math.ceil(movies.length / countElem);

let pages = [];
for (let i = 1; i <= countPages; i++) {
  pages.push(i);
}

let PAGE;

// === main ===========================

app.get('/', async (req, res) => {

  if (req.cookies._name_) {
    res.redirect('/page/1');
  } else {
    res.redirect('/initial/');
  }
});

app.get('/initial/', (req, res) => {
  res.render('initial')
})

app.post('/initial/', (req, res) => {

  res.cookie('_name_', req.body.name, {
    maxAge: 1000 * 60 * 10,
  });
  res.redirect('/page/1');
})

// === paginated list =================

app.get('/page/:num', async (req, res) => {

  let page = req.params.num;
  PAGE = page;

  movies.map((el, ind) => el.id = ind + 1);

  let start = (page - 1) * countElem;
  let end = page * countElem;
  let outputMovies = movies.slice(start, end);

  res.render('allFilms', {
    title: `Фильмы жанра фантастика, страница ${page}`,
    movies: outputMovies,
    pages: pages,
    page,
    allPages: pages.length,
    years: arrFilmsYears,
    countrys: arrFilmCountry,
    ratings: arrFilmRating,
    isFilter: true,
    isList: true,
  })
});

// === filter =========================

app.post('/filter/', (req, res) => {

  let filterFor = [...movies];
  let y, c, r

  if (req.body.year_select) {
    y = req.body.year_select
    filterFor = filterFor.filter(e => e.year === req.body.year_select);
  }

  if (req.body.country_select) {
    c = req.body.country_select
    filterFor = filterFor.filter(e => e.country === req.body.country_select);
  }

  if (req.body.rating_select) {
    r = req.body.rating_select
    filterFor = filterFor.filter(e => e.rating === req.body.rating_select);
  }

  filterFor.map((el, ind) => el.id = ind + 1);

  let asd = false
  if (filterFor.length === 0) asd = true

  res.render('allFilms', {
    title: `применены фильтры ${y ? y : ''} ${c ? c : ''} ${r ? 'рейтинг ' + r : ''}`,
    movies: filterFor,
    years: arrFilmsYears,
    countrys: arrFilmCountry,
    ratings: arrFilmRating,
    asd,
    isFilter: false,
    pageNum: PAGE,
  })
})

// === film page ======================

app.get('/film/:name', (req, res) => {
  let film;
  for (const movie of movies) {
    if (movie.translit === req.params.name) {
      film = movie;
    }
  }

  res.render('film', {
    title: film.name,
    film: film,
    comments: film.comments,
    pageNum: PAGE,
    isList: false,
  })
})

// === comments on the film ===========

app.get('/comments/:film', (req, res) => {
  res.render('comments', {
    film: req.params.film,
  })
})

app.post('/comments/:film', (req, res) => {

  let text = req.body.text;
  let autor = req.cookies._name_;

  let film;
  for (const movie of movies) {
    if (movie.translit === req.params.film) {
      film = movie;

      if (text !== '') {
        film.isComments = true;
        film.comments.push({
          text,
          dateString: getDate(),
          autor,
        });
        film.isComments = true;
      }
    }
  }

  res.render('film', {
    title: film.name,
    film: film,
    comments: film.comments,
  })
})

// === rating of the film =========================

app.get('/rating/:film', (req, res) => {

  let filmTranslit = req.params.film;

  let filmName;
  for (const thisFilm of movies) {
    if (thisFilm.translit === filmTranslit)
      filmName = thisFilm.name;
  }

  if (req.cookies.rating_film === filmTranslit) {
    res.render('notRating', {
      filmName,
      filmTranslit,
    })

  } else {
    res.render('rating', {
      filmName,
      filmTranslit,
    })
  }
})

app.post('/rating/:film', (req, res) => {

  let filmTranslit = req.params.film;

  res.cookie('rating_film', filmTranslit, { maxAge: 1000 * 60 * 10 });

  let rating = req.body.rating;

  let film;
  for (const movie of movies) {
    if (movie.translit === filmTranslit) {
      film = movie;

      if (rating !== '') {
        film.my_rating.push(rating);
        film.isMy_rating = true;
      }
    }
  }

  res.render('film', {
    title: film.name,
    film: film,
    comments: film.comments,
  })
})

// год выпуска, страна, рейтинг.

// ====================================

app.use(function (req, res) {
  res.status(404).send('not found');
});

app.listen(PORT, () => console.log(`The server is running on the port ${PORT}`));
