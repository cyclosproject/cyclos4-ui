/**
 * Defines the API for a snack bar provider
 */
export interface SnackBarProvider {

  /**
   * Shows the snackbar with the given message
   * @param message The snackbar message
   */
  show(message: string): void;

  /**
   * Hides the current snack bar
   */
  hide(): void;
}
