import { ErrorHandler } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

import { HttpError } from "@/shared/errors/httpError";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as ContentfulStatusCode);
  }

  console.error("Unexpected error", err);
  return c.json({ error: "サーバーエラーが発生しました。" }, 500);
};