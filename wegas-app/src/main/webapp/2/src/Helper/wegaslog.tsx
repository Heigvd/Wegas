export const wlog = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (
    process.env.NODE_ENV === undefined ||
    process.env.NODE_ENV.indexOf('production') === -1
  ) {
    // eslint-disable-next-line no-console
    console.log(message, optionalParams);
  }
};
