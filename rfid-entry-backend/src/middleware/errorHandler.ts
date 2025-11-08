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
