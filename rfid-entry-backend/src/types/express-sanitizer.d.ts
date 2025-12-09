declare module 'express-sanitizer' {
  function sanitizer<T>(obj: T): T;
  export = sanitizer;
}
