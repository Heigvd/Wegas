
/**
 * Parses numbers from a string representation formatted as the navigator's locale
 * Spaces are removed in any case
 * dot (.) as decimal separator is always supported
 * */
export function parseNumber(value: string): number{
  return parser.parse(value);
}

/**
 * Formats a number according to the navigator's locale code
 * @param value the value to format
 */
export function toFormattedString(value: number | undefined): string {
  return parser.toLocale(value);
}

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

  parse(value: string): number {
    const cleaned = value.replace(/\s/g,"")
      .replace(this.group, "")
      .replace(this.decimal, ".")
      .replace(this.numeral, this.index);
    return cleaned ? +cleaned : NaN;
  }
}

const parser = new NumberParser(navigator.language);
