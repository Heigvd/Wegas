/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { HashMethod } from './API/restClient';

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);

  let currentByte = 0;
  for (let currentHexChar = 0; currentHexChar < hex.length; currentHexChar += 2) {
    bytes[currentByte] = Number.parseInt(hex.substring(currentHexChar, currentHexChar + 2), 16);
    currentByte++;
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPBKDF2(
  salt: string,
  password: string,
  hash: AlgorithmIdentifier,
  iterations: number,
  length: number,
): Promise<string> {
  const pwKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const uint8Salt = hexToUint8Array(salt);

  const params: Pbkdf2Params = {
    name: 'PBKDF2',
    hash: hash,
    salt: uint8Salt,
    iterations: iterations,
  };

  const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, length);

  return bytesToHex(keyBuffer);
}
function utf16toCodePoints(s: string) {
  const len = s.length;

  const cps = [];

  for (let i = 0; i < len; i++) {
    const c = s.charCodeAt(i);
    if (c < 0xd800 || c >= 0xe000) {
      // those code point are stored as-is
      cps.push(c);
    } else if (c < 0xdc00) {
      // those codepoints are encoded on two chars (surrogate pair)
      if (i < len) {
        i++;
        const c2 = s.charCodeAt(i);
        cps.push(0x10000 | ((c & 0x3ff) << 10) | (c2 & 0x3ff));
      } else {
        // whoops there is no two chars left
        cps.push(0xfffd);
      }
    } else if (c < 0xe000) {
      // invalid as such a char should have been handled by the previous case.
      cps.push(0xfffd);
    }
  }
  return cps;
}

function strToUtf8Array(str: string): Uint8Array {
  const cp = utf16toCodePoints(str);
  const array: number[] = [];
  for (let i = 0; i < cp.length; i++) {
    const char = cp[i];
    if (char != null) {
      // how many byte ?
      if (char < 0x7f) {
        // 7bits on one byte
        // 0xxxxxxx
        array.push(char);
      } else if (char <= 0x7ff) {
        // 11bits on two bytes
        // 110x xxxx 10xx xxxx
        array.push(0xc0 | (char >> 6));
        array.push(0x80 | (char & 0x3f));
      } else if (char <= 0xffff) {
        // 16bits on three bytes
        // 1110xxxx 10xxxxxx 10xxxxxx
        array.push(0xe0 | (char >> 12));
        array.push(0x80 | ((char >> 6) & 0x3f));
        array.push(0x80 | (char & 0x3f));
      } else {
        // 24bits on four bytes
        // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
        array.push(0xf0 | (char >> 18));
        array.push(0x80 | ((char >> 12) & 0x3f));
        array.push(0x80 | ((char >> 6) & 0x3f));
        array.push(0x80 | (char & 0x3f));
      }
    }
  }

  return new Uint8Array(array);
}

export async function hashSha512(salt: string, password: string): Promise<string> {
  const data = (salt != null ? salt : '') + password;

  const msgUint8 =
    typeof TextEncoder !== 'undefined' // eg edge <= 44
      ? new TextEncoder().encode(data)
      : strToUtf8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(function (b) {
      return b.toString(16).padStart(2, '0');
    })
    .join(''); // convert bytes to hex string
}

export async function hashSha256(salt: string, password: string): Promise<string> {
  const data = (salt != null ? salt : '') + password;

  const msgUint8 =
    typeof TextEncoder !== 'undefined' // eg edge <= 44
      ? new TextEncoder().encode(data)
      : strToUtf8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(function (b) {
      return b.toString(16).padStart(2, '0');
    })
    .join(''); // convert bytes to hex string
}

export async function hashPassword(
  method: HashMethod,
  salt: string | null | undefined,
  password: string,
): Promise<string> {
  const theSalt = salt || '';
  switch (method) {
    case 'PLAIN':
      return theSalt + password;
    case 'SHA_256':
      return hashSha256(theSalt, password);
    case 'SHA_512':
      return hashSha512(theSalt, password);
  }
}
