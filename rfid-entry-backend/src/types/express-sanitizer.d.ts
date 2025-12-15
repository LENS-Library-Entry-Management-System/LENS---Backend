declare module 'express-sanitizer' {
    import express = require('express');
    function expressSanitizer(options?: Record<string, unknown>): express.RequestHandler;
    export = expressSanitizer;
}

declare namespace Express {
    interface Request {
        sanitize(str: string): string;
    }
}
