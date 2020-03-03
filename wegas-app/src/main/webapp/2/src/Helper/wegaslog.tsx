export const wconsole = (
  csl: (message?: unknown, ...optionalParams: unknown[]) => void,
) => (message?: unknown, ...optionalParams: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    if (optionalParams.length === 0) {
      csl(message);
    } else {
      csl(message, optionalParams);
    }
  }
};

export const wlog = (message?: unknown, ...optionalParams: unknown[]): void =>
  // eslint-disable-next-line no-console
  wconsole(console.log)(message, optionalParams);

export const wwarn = (message?: unknown, ...optionalParams: unknown[]): void =>
  // eslint-disable-next-line no-console
  wconsole(console.warn)(message, optionalParams);
