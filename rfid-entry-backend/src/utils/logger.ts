<<<<<<< HEAD
// Winston logger setup
=======
// Winston logger setup
const logger = {
  info: (message: string) => console.log(message),
  error: (message: string, error?: unknown) => console.error(message, error),
  warn: (message: string) => console.warn(message),
  debug: (message: string) => console.debug(message),
};

export default logger;
>>>>>>> 1d4ea679ec47cd864a634980c7f3698cd3db9f9f
