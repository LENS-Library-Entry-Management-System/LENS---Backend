// Winston logger setup
const logger = {
  info: (message: string) => console.log(message),
  error: (message: string, error?: unknown) => console.error(message, error),
  warn: (message: string) => console.warn(message),
  debug: (message: string) => console.debug(message),
};

export default logger;
