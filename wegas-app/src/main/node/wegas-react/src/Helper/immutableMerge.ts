/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2022 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

export default function immutableMerge<T>(a: T, b: T): T {
  const seenObjects: unknown[] = [];

  function __immutableMerge<T>(a: T, b: T): T {
    if (Object.is(a, b)) {
      //("Object Is => a", {a, b});
      return a;
    };

    const typeOfA = typeof a;
    const typeOfB = typeof b;

    if (typeOfA !== typeOfB) {
      // type change means full change
      //("Type change");
      return b;
    }

    if (Array.isArray(a)) {
      //("Array Case");
      const aArray: unknown[] = a;
      const bArray: unknown[] = b as unknown as unknown[];

      const result: unknown[] = a;
      let changes = aArray.length !== bArray.length;
      for (const p in bArray) {
        //("Test index ", p);
        const aValue = aArray[p];
        const bValue = bArray[p];
        const mValue = immutableMerge(aValue, bValue);
        result.push(mValue);

        if (mValue !== aValue) {
          //("change", mValue);
          changes = true;
        }
      }

      if (changes) {
        //("CHanges => ", result);
        return result as unknown as T;
      } else {
        //("No Changes => ", a);
        return a;
      }
    } else if (typeOfA === 'object') {
      seenObjects.push(a);
      if (seenObjects.includes(a)) {
        throw "Cyclic Object";
      }
      //("Object Case");
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      const result: Record<string, unknown> = {}
      let changes = keysA.length !== keysB.length;
      for (const k of keysB) {
        //("Test key ", k);
        const aValue = (a as any)[k];
        const bValue = (b as any)[k];
        const mValue = immutableMerge(aValue, bValue);
        result[k] = mValue;
        if (mValue !== aValue) {
          //("change", mValue);
          changes = true;
        }
      }

      if (changes) {
        //("CHanges => ", result);
        return result as unknown as T;
      } else {
        //("No Changes => ", a);
        return a;
      }

    }

    //("Fallback", {a, b});
    return b;
  }

  return __immutableMerge(a, b);
}

