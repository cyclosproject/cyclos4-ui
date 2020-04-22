/**
 * Possible error statuses
 */
export enum ErrorStatus {
  /**
   * The request itself was not done
   */
  INVALID_REQUEST = 0,

  /**
   * Status Code: 401.
   */
  UNAUTHORIZED = 401,

  /**
   * Status Code: 403.
   */
  FORBIDDEN = 403,

  /**
   * Status Code: 404.
   */
  NOT_FOUND = 404,

  /**
   * Status Code: 409.
   */
  CONFLICT = 409,

  /**
   * Status Code: 422.
   */
  UNPROCESSABLE_ENTITY = 422,

  /**
   * Status Code: 500.
   */
  INTERNAL_SERVER_ERROR = 500,
}
