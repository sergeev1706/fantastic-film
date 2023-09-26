

function addZero(num) {
  return num < 10 ? '0' + num : num;
}

export function getDate() {
  let now = new Date();
  let year = now.getFullYear();
  let month = addZero(now.getMonth());
  let date = addZero(now.getDate());
  return `${date}.${month}.${year}`;
}

// export function getRating(arr) {
//   let sum;

//   for (const elem of arr) {
//     sum = sum + Number(elem);
//   }

//   return sum / arr.length;
// }