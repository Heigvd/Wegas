export const wlog = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    if (optionalParams.length === 0) {
      // eslint-disable-next-line no-console
      console.log(message);
    } else {
      // eslint-disable-next-line no-console
      console.log(message, optionalParams);
    }
  }
};
