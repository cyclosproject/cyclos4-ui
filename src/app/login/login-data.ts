/**
 * Holds the data used for login
 */
export class LoginData {
  constructor(
    public principal: string = null,
    public password: string = null) {}

  get valid(): boolean {
    return (this.principal || '').length > 0
      && (this.password || '').length > 0
  }
}