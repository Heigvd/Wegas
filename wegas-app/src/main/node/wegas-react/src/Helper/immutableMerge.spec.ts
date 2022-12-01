/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2022 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import immutableMerge from './immutableMerge';

const o1 = {
  a: {
    a1: {
      a2: 'salut',
    },
  },
  b: {
    b1: {
      b11: 'salut',
    },
    b2: {
      b21: 'hello',
    },
  },
};

const o2 = {
  a: {
    a1: {
      a2: 'salut',
    },
  },
  b: {
    b1: {
      b11: 'Bonjour',
    },
    b2: {
      b21: 'hello',
    },
  },
};

type T = typeof o1;

function compare(o1: T, o2: T, result: T) {
  // eslint-disable-next-line no-console
  console.log('root === o1', result === o1);
  // eslint-disable-next-line no-console
  console.log('root === o2', result === o2);

  // eslint-disable-next-line no-console
  console.log('a === o1', result.a === o1.a);
  // eslint-disable-next-line no-console
  console.log('a === o2', result.a === o2.a);

  // eslint-disable-next-line no-console
  console.log('b === o1', result.b === o1.b);
  // eslint-disable-next-line no-console
  console.log('b === o2', result.b === o2.b);

  // eslint-disable-next-line no-console
  console.log('b1 === o1', result.b.b1 === o1.b.b1);
  // eslint-disable-next-line no-console
  console.log('b1 === o2', result.b.b1 === o2.b.b1);

  // eslint-disable-next-line no-console
  console.log('b2 === o1', result.b.b2 === o1.b.b2);
  // eslint-disable-next-line no-console
  console.log('b2 === o2', result.b.b2 === o2.b.b2);
}

test.each<[T, T]>([[o1, o2]])('Raw test', (o1: T, o2: T) => {
  compare(o1, o2, immutableMerge(o1, o2));
});
