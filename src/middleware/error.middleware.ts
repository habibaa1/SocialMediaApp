import type { Request, Response, NextFunction } from "express";

interface IError extends Error {
  statusCode?: number;
  cause?: unknown;
}

export const globalErrorHandler = (
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const response: any = { message: err.message || "Internal Server Error" };
  if (err.cause) {
    response.details = err.cause;
  }
  res.status(status).json(response);
};
