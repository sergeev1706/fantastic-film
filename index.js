
import express from 'express'
import expressHandlebars from 'express-handlebars';
import { start } from './parser.js';
import { genres } from './genres.js';

const handlebars = expressHandlebars.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {
    getId: obj => obj.id,
    getName: obj => obj.name,
    getTranslit: obj => obj.translit,
    getImagePath: obj => obj.imagePath,
    getYear: obj => obj.year,
    getRating: obj => obj.rating,
    getLink: obj => obj.link,
    getDescription: obj => {
      let str = obj.descr
      return str.split('.')[0] + ' ...'
    },
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

app.get('/', async (req, res) => {

  let movies = await start('fantastika')
  res.render('allFilms', {
    title: 'Все фильмы',
    movies: movies,
    genres: genres
  })
});

app.get('/:genre', async (req, res) => {

  let movies = await start(req.params.genre)

  let result
  for (const genre of genres) {
    if (genre.link === `/${req.params.genre}/`) result = genre.translit
  }
  res.render('allFilms', {
    title: `Фильмы жанра ${result}`,
    movies: movies,
    genres: genres
  })
});

// app.get('/film/:name', (req, res) => {
//   let film
//   for (const movie of movies) {
//     if (movie.translit === req.params.name) {
//       film = movie
//     }
//   }

//   res.render('film', {
//     title: film.name,
//     film: film
//   })
// })

app.use(function (req, res) {
  res.status(404).send('not found');
});

app.listen(3004, () => console.log('the server is running'))
