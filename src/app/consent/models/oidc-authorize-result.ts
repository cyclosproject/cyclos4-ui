/**
 * Result after an OAuth2 / OpenID Connect approve / deny
 */
export interface OidcAuthorizeResult {
  url: string;
  postData?: { [key: string]: string };
}
