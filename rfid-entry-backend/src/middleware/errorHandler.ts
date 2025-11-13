<<<<<<< HEAD
// Global error handling
=======
// Global error handling
import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // TODO: Implement error handling
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};

export default errorHandler;
>>>>>>> 1d4ea679ec47cd864a634980c7f3698cd3db9f9f
