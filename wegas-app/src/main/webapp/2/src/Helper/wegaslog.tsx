export const wlog = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(message, optionalParams);
  }
};
