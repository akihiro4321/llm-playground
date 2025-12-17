export class HttpError extends Error {
  status: number;

  /**
   * ステータスコード付きのエラーを表す基底クラスです。
   *
   * @param status - HTTPステータスコード。
   * @param message - エラーメッセージ。
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  /**
   * 400 Bad Requestを表すユーティリティエラーです。
   *
   * @param message - エラーメッセージ。
   */
  constructor(message: string) {
    super(400, message);
  }
}
