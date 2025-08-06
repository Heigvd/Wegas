export enum NumberSeparator {
  None = 'none',
  Space = 'space',
  Apostrophe = 'apostrophe',
  Comma = 'comma',
}

function parseSeparatorSymbol(separator?: NumberSeparator) {
  switch (separator) {
    case NumberSeparator.Space:
      return ' ';
    case NumberSeparator.Apostrophe:
      return "'";
    case NumberSeparator.Comma:
      return ',';
    default:
      return '';
  }
}

/**
 * Split numerical value with separator every period (3 digits)
 * @param value
 * @param separator
 */
export function addSeparator(
  value?: number,
  separator?: NumberSeparator,
): string {
  const separatorSymbol = parseSeparatorSymbol(separator);

  if (value === undefined) {
    return '';
  }

  const str = value.toString();
  const [integerPart, decimalPart] = str.split('.');

  const separatedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    separatorSymbol,
  );

  return decimalPart !== undefined
    ? `${separatedInteger}.${decimalPart}`
    : separatedInteger;
}

export function removeSeparator(
  value: string | number,
  separator?: NumberSeparator,
): number {
  const separatorSymbol = parseSeparatorSymbol(separator);

  return Number(value.toString().replace(new RegExp(separatorSymbol, 'g'), ''));
}
