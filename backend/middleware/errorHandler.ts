import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors/httpError.js";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error("Unexpected error", err);
  res.status(500).json({ error: "サーバーエラーが発生しました。" });
};
