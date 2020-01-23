import { wlog } from './wegaslog';

/**
 * Inspired from :
 * https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
 * */

export function array_move<T>(
  arr: T[] | undefined,
  old_index: number,
  new_index: number,
) {
  const newI = old_index < new_index ? new_index - 1 : new_index;
  if (arr == null) {
    wlog('The array does not exists');
    return arr;
  } else if (old_index > arr.length || old_index < 0) {
    wlog('Trying to move an unexisting item');
    return arr;
  } else if (newI > arr.length || newI < 0) {
    wlog('Trying to move item outside of the array');
    return arr;
  } else {
    const newArr = [...arr];
    newArr.splice(newI, 0, newArr.splice(old_index, 1)[0]);
    return newArr;
  }
}
