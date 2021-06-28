import { wwarn } from './wegaslog';
import { cloneDeep } from 'lodash-es';

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
    wwarn('The array does not exists');
    return arr;
  } else if (old_index > arr.length || old_index < 0) {
    wwarn('Trying to move an unexisting item');
    return arr;
  } else if (newI > arr.length || newI < 0) {
    wwarn('Trying to move item outside of the array');
    return arr;
  } else {
    const newArr = [...arr];
    newArr.splice(newI, 0, newArr.splice(old_index, 1)[0]);
    return newArr;
  }
}

/**
 * getEntry - get an entry of object from and array of keys. Allows to go deep in an object without the use of brackets [][][]
 * @returns the value at of the searched entry or undefined
 * @param object any object
 * @param keyPath an array of keys to acces entry
 * @param lookupKey if the searched object is made from intermediate objects, allows to look up in the intermediate object.
 */
export function getEntry(
  object: any,
  keyPath: string[],
  lookupKey?: string,
): any {
  if (keyPath.length === 0) {
    return undefined;
  }
  const newKeys = [...keyPath];
  let entry: any = object;
  while (newKeys.length > 0) {
    const key = newKeys.shift();
    if (
      key == null ||
      entry == null ||
      typeof entry !== 'object' ||
      !(key in entry)
    ) {
      return undefined;
    } else {
      entry = lookupKey != null ? entry[key][lookupKey] : entry[key];
    }
  }
  return entry;
}

/**
 * setEntry - allows to set and object entry deep inside the object without the use of brackets [][][]7
 * @returns a new object with the created/modified entry or undefined (no keys or noOverride used and key allready taken)
 * @param object any object
 * @param value any value to insert
 * @param keyPath an array of keys to acces entry
 * @param defaultObjectItem an object that describes the entry pattern and a lookup key to find the next entry
 * @param noOverride if set to true, en entry that already contains something will not be overriden
 */
export function setEntry<T, I>(
  object: T,
  value: I,
  keyPath: string[],
  defaultObjectItem?: { defaultObject: I; lookupKey: keyof I },
  noOverride: boolean = false,
): T | undefined {
  const newKeys = [...keyPath];
  const newObject = cloneDeep(object);
  let entry: any = newObject;
  while (newKeys.length > 0) {
    const key = newKeys.shift();
    if (key == null || entry == null || typeof entry !== 'object') {
      return undefined;
    } else if (newKeys.length > 0) {
      if (
        !noOverride &&
        (typeof entry[key] !== 'object' ||
          (defaultObjectItem && !(defaultObjectItem.lookupKey in entry[key])))
      ) {
        entry[key] = defaultObjectItem
          ? {
              ...defaultObjectItem.defaultObject,
              [defaultObjectItem.lookupKey]: {},
            }
          : {};
      }
      entry = defaultObjectItem
        ? entry[key][defaultObjectItem.lookupKey]
        : entry[key];
    } else {
      entry[key] = value;
      return newObject;
    }
  }
  return undefined;
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeDeep(target: any, ...sources: any): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * arrayRemoveDuplicates - Removes the duplicates  in an array
 * Warning, it's not efficient at all, use it on samll arrays and not in loops.
 * @param a - the array to trim
 */
export function arrayRemoveDuplicates(a: unknown[]) {
  return a.filter(function (item, pos) {
    return a.indexOf(item) == pos;
  });
}

export function replace(
  str: string,
  index: number,
  length: number,
  replacement: string,
) {
  return str.substr(0, index) + replacement + str.substr(index + length - 1);
}

interface LruNode<K, V> {
  key: K;
  value: V;
  next: LruNode<K, V> | null;
  previous: LruNode<K, V> | null;
}

interface LRU<K, V> {
  size(): number;
  has(key: K): boolean;
  get(key: K): V | undefined;
  set(key: K, value: V): V;
}

export function createLRU<K, V>(maxSize?: number): LRU<K, V> {
  const index = new Map<K, LruNode<K, V>>();
  let head: LruNode<K, V> | null = null;
  let tail: LruNode<K, V> | null = null;

  /**
   * get and bring to front
   */
  const get = (key: K) => {
    const node = index.get(key);
    if (node) {
      // remove from list and link previous to next
      const prev = node.previous;
      const next = node.next;

      if (prev) {
        prev.next = next;
      } else {
        // no prev means node is HEAD
        head = next;
      }

      if (next) {
        next.previous = prev;
      } else {
        // no next means node is the TAIL
        // new tail is prev
        tail = prev;
      }

      // move node to head
      node.previous = null;
      node.next = head;

      if (head) {
        head.previous = node;
      }
      head = node;

      return node.value;
    }
  };

  const removeOldest = () => {
    console.log('RemoveOldest');
    if (tail) {
      if (tail.previous) {
        // penultimate becomes the last
        tail.previous.next = null;
      }
      index.delete(tail.key);
      tail = tail.previous;
    }
  };

  return {
    size() {
      return index.size;
    },
    has(key: K) {
      return index.has(key);
    },
    get,
    set(key: K, value: V) {
      if (index.get(key)) {
        // update item
        const node = index.get(key)!;
        node.value = value;
        // get to move to front
        get(key);
        return value;
      } else {
        // new item
        const newNode: LruNode<K, V> = {
          key,
          value,
          previous: null,
          next: head,
        };
        if (head) {
          head.previous = newNode;
        }
        head = newNode;
        if (!tail) {
          // first interted item is the head and the tail
          tail = newNode;
        }
        index.set(key, newNode);

        if (maxSize && index.size > maxSize) {
          removeOldest();
        }
        return value;
      }
    },
  };
}
