
import express from 'express';
import expressHandlebars from 'express-handlebars';
import { start } from './parser.js';

import { getDate } from './helpers.js';
// import { getRating } from './helpers.js';

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
    getYear: obj => obj.year,
    getRating: obj => obj.rating,
    getLink: obj => obj.link,
    getDescription: obj => {
      let str = obj.descr;
      return str.split('.')[0] + str.split('.')[1] + ' ...';
    },
    getCommentText: obj => obj.text,
    getCommentDate: obj => obj.dateString,
    getRatingString: obj => {
      let arr = obj.my_rating
      let sum = 0;

      for (const elem of arr) {
        sum = sum + Number(elem)
      }

      return (sum / arr.length).toFixed(1)
    },
    getIsRating: obj => obj.isMy_rating
  }
});

let app = express();

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
movies.map((el, ind) => el.id = ind + 1);


// ----------------- pagination -----------------------------------------

let countElem = 5; // количество выводимых карточек на странице
let countPages; // количество страниц

countPages = Math.ceil(movies.length / countElem);

let pages = [];
for (let i = 1; i <= countPages; i++) {
  pages.push(i);
}

app.get('/', async (req, res) => {

  res.redirect('/page/1');
});

app.get('/page/:num', async (req, res) => {

  let page = req.params.num;

  let start = (page - 1) * countElem;
  let end = page * countElem;
  let outputMovies = movies.slice(start, end);

  res.render('allFilms', {
    title: `Фильмы жанра фантастика, страница ${page}`,
    movies: outputMovies,
    pages: pages,
    page,
    allPages: pages.length,
  })
});

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
  })
})

// === comments =======================

app.get('/comments/:film', (req, res) => {
  res.render('comments', {
    film: req.params.film
  })
})

app.post('/comments/:film', (req, res) => {

  let text = req.body.text;

  let film;
  for (const movie of movies) {
    if (movie.translit === req.params.film) {
      film = movie;

      if (text !== '') {
        film.comments.push({
          text,
          dateString: getDate()
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

// === rating =========================

app.get('/rating/:film', (req, res) => {

  res.render('rating', {
    film: req.params.film
  })
})

app.post('/rating/:film', (req, res) => {

  let rating = req.body.rating;

  let film;
  for (const movie of movies) {
    if (movie.translit === req.params.film) {
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

// ==================

app.use(function (req, res) {
  res.status(404).send('not found');
});

app.listen(PORT, () => console.log(`The server is running on the port ${PORT}`));
