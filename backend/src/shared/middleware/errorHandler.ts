import { ErrorHandler } from "hono";
import { HttpError } from "@/shared/errors/httpError";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as ContentfulStatusCode);
  }

  console.error("Unexpected error", err);
  return c.json({ error: "サーバーエラーが発生しました。" }, 500);
};