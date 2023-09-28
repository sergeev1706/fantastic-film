

let page = document.querySelector('#page');

let pages = document.querySelectorAll('.page-link');

for (const elem of pages) {
  if (elem.textContent === page.textContent) {
    elem.classList.add('red');
  } else {
    elem.classList.remove('red');
  }
}