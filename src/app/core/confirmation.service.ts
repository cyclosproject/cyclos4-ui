import { Injectable } from '@angular/core';
import { CreateDeviceConfirmation, CustomFieldDetailed, PasswordInput } from 'app/api/models';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

/**
 * Options to call the confirm method
 */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  labelPosition?: FieldLabelPosition;
  customFields?: CustomFieldDetailed[];
  createDeviceConfirmation?: () => CreateDeviceConfirmation;
  passwordInput?: PasswordInput;
  callback: (params: ConfirmCallbackParams) => void;
  cancelCallback?: () => void;
}

/**
 * The confirm calls its callback using this parameter
 */
export interface ConfirmCallbackParams {
  confirmationPassword?: string;
  customValues?: { [key: string]: string };
}

/**
 * Service used to manage notifications being displayed for users
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  // This handler is used to break the dependency on ConfirmationComponent,
  // which uses custom fields, and would increase the initial bundle size a lot.
  confirmHandler: (modal: BsModalService, options: ConfirmOptions) => BsModalRef;

  private ref: BsModalRef;

  // This flag is true for each confirmation if it was successful
  confirmed = false;

  constructor(private modal: BsModalService, apiInterceptor: ApiInterceptor) {
    apiInterceptor.hideConfirmationHandler = () => this.hide();
  }

  /**
   * Shows a confirmation dialog, invoking a callback when the user confirms.
   * Supports a confirmation password.
   * @param options The confirmation options:
   * - title: An optional title for the dialog
   * - message: An optional message
   * - cancelLabel: Allows overriding the cancel label
   * - confirmLabel: Allows overriding the confirm label
   * - customFields: When set, shows additional fields in the confirmation dialog
   * - labelPosition: When additional fields are shown, represents their label's position
   * - passwordInput: If a confirmation password is required to confirm
   * - createDeviceConfirmation: Required if passwordInput is not null. Is the callback that will create the DeviceConfirmation.
   * - callback: Function called when confirming. When a confirmation password is used,
   *   the typed password is passed as parameter.
   */
  confirm(options: ConfirmOptions): void {
    this.confirmed = false;
    if (options.passwordInput && !options.createDeviceConfirmation) {
      throw new Error("When there's a passwordInput it is also required to set the createDeviceConfirmation callback");
    }
    if (options.passwordInput == null) {
      // When no password input, set the confirmation as confirmed when the callback is called.
      // Otherwise it will be managed by the hide() method
      const originalCallback = options.callback;
      options.callback = p => {
        originalCallback(p);
        this.confirmed = true;
      };
    }
    this.ref = this.confirmHandler(this.modal, options);

    if (options.cancelCallback) {
      let hideSub = this.ref.onHide.subscribe(() => {
        if (!this.confirmed) {
          options.cancelCallback();
        }
        hideSub.unsubscribe();
      });
    }
  }

  /**
   * Hides the current visible confirmation popup
   */
  hide() {
    this.confirmed = true;
    if (this.ref) {
      this.modal.hide(this.ref.id);
    }
  }
}
