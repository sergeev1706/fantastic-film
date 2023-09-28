

let init_input = document.querySelector('.init-input');
let init_btn = document.querySelector('.init-btn');

if (init_btn) {
  init_btn.classList.add('disable');
}

if (init_input) {
  init_input.addEventListener('input', () => {
    if (init_input.value !== '') {
      init_btn.classList.remove('disable');
    } else {
      init_btn.classList.add('disable');
    }
  })
}