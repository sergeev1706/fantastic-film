

let rating_inp = document.querySelector('#rating_inp');
let rating_btn = document.querySelector('#rating_btn');

if (rating_btn) {
  rating_btn.classList.add('disable');
}

if (rating_inp) {
  rating_inp.addEventListener('input', () => {
    if (rating_inp.value <= 10 && rating_inp.value >= 0) {
      rating_btn.classList.remove('disable');
    } else {
      rating_btn.classList.add('disable');
    }
  })
}