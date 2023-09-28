
function addZero(num) {
  return num < 10 ? '0' + num : num;
}

export function getDate() {
  let now = new Date();
  let year = now.getFullYear();
  let month = addZero(now.getMonth());
  let date = addZero(now.getDate());

  let hours = addZero(now.getHours());
  let minutes = addZero(now.getMinutes());
  return `${date}.${month}.${year} в ${hours}:${minutes}`;
}

