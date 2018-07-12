import { Injectable } from '@angular/core';
import { Notification } from 'app/shared/notification';
import { NotificationType } from 'app/shared/notification-type';
import { MatDialog, MatDialogRef, MatSnackBarRef, MatSnackBar, SimpleSnackBar } from '@angular/material';
import { NotificationComponent } from 'app/shared/notification.component';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { YesNoComponent } from 'app/shared/yes-no.component';
import { PasswordInput } from 'app/api/models';
import { ConfirmWithPasswordComponent } from 'app/shared/confirm-with-password.component';

/**
 * Service used to manage notifications being displayed for users
 */
@Injectable()
export class NotificationService {

  /** The currently open notification */
  private open: MatDialogRef<NotificationComponent>;

  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) { }

  /**
   * Shows a message with the yes / no buttons
   * @param message The message to show
   * @returns An `Observable` which emits true / false according to the user selection
   */
  yesNo(message: string): Observable<Boolean> {
    return this.dialog.open(YesNoComponent, {
      autoFocus: false,
      data: message
    }).afterClosed();
  }

  /**
   * Shows a message and a confirmation password to confirm a given action
   * @param message The message to show
   * @param passwordInput The `PasswordInput` received from the server
   * @param confirmationMessage A message passed in to the `ConfirmationPasswordComponent`
   * @returns An `Observable` which emits the selected confirmation password or null if canceled
   */
  confirmWithPassword(message: string, passwordInput: PasswordInput, confirmationMessage?: string): Observable<string> {
    return this.dialog.open(ConfirmWithPasswordComponent, {
      autoFocus: false,
      data: {
        message: message,
        passwordInput: passwordInput,
        confirmationMessage: confirmationMessage
      }
    }).afterClosed();
  }

  /**
   * Shows a snack bar message (quick message on the bottom)
   */
  snackBar(message: string): MatSnackBarRef<SimpleSnackBar> {
    return this.snack.open(message);
  }

  /**
   * Shows an error notification
   * @param message The notification message
   * @returns The dialog reference
   */
  error(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.ERROR, message, allowClose);
  }

  /**
   * Shows a warning notification
   * @param message The notification message
   * @returns The dialog reference
   */
  warning(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.WARNING, message, allowClose);
  }

  /**
   * Shows an information notification
   * @param message The notification message
   * @returns The dialog reference
   */
  info(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.INFO, message, allowClose);
  }

  /**
   * Shows a notification with the given type
   * @param type The notification type to show
   * @param message The notification message
   * @returns The dialog reference
   */
  showNotification(type: NotificationType, message: string, allowClose = true):
    Observable<MatDialogRef<NotificationComponent>> {

    // Close the current notification, if any
    this.close();

    const result = new BehaviorSubject<MatDialogRef<NotificationComponent>>(null);
    const openDialog = () => {
      const ref = this.dialog.open(NotificationComponent, {
        disableClose: !allowClose
      });
      ref.afterClosed().subscribe(() => {
        this.open = null;
      });
      const component = ref.componentInstance;
      component.notification = new Notification(type, message.replace('\n', '<br>'));
      component.allowClose = allowClose;
      this.open = ref;
      result.next(ref);
    };
    window.setTimeout(openDialog, 100);
    return result.asObservable();
  }

  /**
   * Closes the currently visible notification, if any
   */
  close(): void {
    if (this.open) {
      this.open.close();
      this.open = null;
    }
  }
}
