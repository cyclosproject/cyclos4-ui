export interface SnackBarOptions {
  /**
   * The time, in milliseconds, the snack bar should be visible.
   * By default, 3 seconds.
   */
  timeout?: number;
}

/**
 * Defines the API for a snack bar provider
 */
export interface SnackBarProvider {
  /**
   * Shows the snackbar with the given message
   * @param message The snackbar message
   */
  show(message: string, options?: SnackBarOptions): void;

  /**
   * Hides the current snack bar
   */
  hide(): void;
}
