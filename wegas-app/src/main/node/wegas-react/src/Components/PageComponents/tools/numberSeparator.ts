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

export function removeSeparator2(
  value: string | number
){
  return parser.parse(String(value))
}


export function addSeparator2(value: number | undefined) {
  return parser.toLocale(value);
}


//
/**
 * Parses numbers from a string represented in a given locale
 * All spaces are trimmed
 * the dot (.) as decimal separator is supported in any case
 * Converts numbers to locale representation
 * inspired by https://observablehq.com/@mbostock/localized-number-parsing
 */
class NumberParser {
  private readonly group: RegExp;
  private readonly decimal: RegExp;
  private readonly numeral: RegExp;
  private readonly index: (s :string) => string;
  private readonly format : Intl.NumberFormat;

  constructor(locale: string) {
    this.format = new Intl.NumberFormat(locale);
    const parts = this.format.formatToParts(12345.6);
    const numerals = [...new Intl.NumberFormat(locale, {useGrouping: false}).format(9876543210)].reverse();
    const index = new Map(numerals.map((d, i) => [d, i]));
    this.group = new RegExp(`[${parts?.find(d => d.type === "group")?.value || ''}]`, "g");
    this.decimal = new RegExp(`[${parts?.find(d => d.type === "decimal")?.value || ''}]`);
    this.numeral = new RegExp(`[${numerals.join("")}]`, "g");
    this.index = (d:string) => String(index.get(d)!);
  }

  toLocale(value: number | undefined): string {
    return value === undefined ? '' : this.format.format(value);
  }

  parse(value: string) {
    const cleaned = value.replace(/\s/g,"")
      .replace(this.group, "")
      .replace(this.decimal, ".")
      .replace(this.numeral, this.index);
    return cleaned ? +cleaned : NaN;
  }
}

const parser = new NumberParser(navigator.language);
