for (let value = -2; value < 2; value++) {
  for (let fill = -2; fill < 2; fill++) {
    if (value == fill) continue;
    for (let i = 0; i < 3; i++) {
      const length = 5 * Math.pow(10, i);
      const index = Math.floor(length / 2);
      const array = new Array(length).fill(fill);
      array[index] = value;
      const indexOf = array.indexOf(value);
      console.log({ value, fill, length, index, indexOf });
    }
  }
}

for (let length = 5; length <= 50; length++) {
  const index = Math.floor(length / 2);
  const array = new Array(length).fill(0);
  array[index] = -1;
  const indexOf = array.indexOf(-1);
  console.log({ length, index, indexOf });
  if (index !== indexOf) break;
}
