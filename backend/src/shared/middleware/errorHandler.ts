import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/shared/errors/httpError";

/**
 * コントローラー内の例外を捕捉し、HTTPレスポンスに変換するエラーハンドラーです。
 *
 * @param err - ハンドリング対象のエラー。
 * @param _req - Expressのリクエスト（未使用）。
 * @param res - レスポンスオブジェクト。
 * @param _next - 次のミドルウェア（未使用）。
 */
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
