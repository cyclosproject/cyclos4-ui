import { Injectable } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { FormatService } from 'app/core/format.service';
import {
  ErrorKind, NotFoundError, InputError, InputErrorCode,
  UnauthorizedError, UnauthorizedErrorCode, PasswordStatusEnum, ForbiddenError,
  ForbiddenErrorCode, PaymentError, PaymentErrorCode, ForgottenPasswordError,
  ForgottenPasswordErrorCode, ConflictError, ConflictErrorCode, OtpError, NestedError
} from 'app/api/models';
import { HttpErrorResponse } from '@angular/common/http';
import { NextRequestState } from './next-request-state';
import { ErrorStatus } from './error-status';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { Router } from '@angular/router';
import { LoginService } from 'app/core/login.service';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { LayoutService } from 'app/shared/layout.service';
import { empty, focusFirstInvalid } from 'app/shared/helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { LoginState, LoginReason } from 'app/core/login-state';

/**
 * Service used to handle application errors
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(
    private router: Router,
    private notification: NotificationService,
    private format: FormatService,
    private layout: LayoutService,
    private nextRequestState: NextRequestState,
    private loginState: LoginState,
    private dataForUiHolder: DataForUiHolder,
    private i18n: I18n
  ) { }

  /**
   * Used to perform an HTTP request with a custom error handling code.
   * This prevents the default error handling, allowing services and components to
   * handle specific errors without always triggering the default error handling.
   * The callback receives the `defaultHandling` function that performs the default
   * error handling, so, the custom error handler can call it on unhandled cases.
   * @param callback The function that actually performs the HTTP request
   */
  requestWithCustomErrorHandler(callback: (defaultHandling: (response: HttpErrorResponse) => void) => any) {
    this.nextRequestState.ignoreNextError = true;
    callback(resp => this.handleHttpError(resp));
  }

  /**
   * Handles an from the given Http response
   * @param err The response object
   */
  handleHttpError(err: HttpErrorResponse) {
    if (err.error instanceof Error) {
      // Client-side error
      console.error('Client-side request error');
      console.error(err.error);
    } else {
      // Server-generated error
      let error = err.error;
      if (typeof error === 'string') {
        try {
          error = JSON.parse(error);
        } catch (e) {
          error = null;
        }
      }
      switch (err.status) {
        case ErrorStatus.INVALID_REQUEST:
          this.handleInvalidRequest();
          return;
        case ErrorStatus.UNAUTHORIZED:
          this.handleUnauthorizedError(error as UnauthorizedError);
          return;
        case ErrorStatus.FORBIDDEN:
          this.handleForbiddenError(error as ForbiddenError);
          return;
        case ErrorStatus.NOT_FOUND:
          this.handleNotFoundError(error as NotFoundError);
          return;
        case ErrorStatus.UNPROCESSABLE_ENTITY:
          this.handleInputError(error as InputError);
          return;
        case ErrorStatus.CONFLICT:
          this.handleConflictError(error as ConflictError);
          return;
        case ErrorStatus.INTERNAL_SERVER_ERROR:
          // The internal server error may be a specific kind or a general error
          if (error != null && error.hasOwnProperty('kind')) {
            switch (error.kind) {
              case ErrorKind.PAYMENT:
                // A payment error
                this.handlePaymentError(error as PaymentError);
                return;
              case ErrorKind.OTP:
                // An error while generating an OTP
                this.handleOtpError(error as OtpError);
                return;
              case ErrorKind.FORGOTTEN_PASSWORD:
                // An error while changing a forgotten password
                this.handleForgottenPasswordError(error as ForgottenPasswordError);
                return;
              case ErrorKind.NESTED:
                // An error in a nested property
                this.handleNestedError(error as NestedError);
            }
          }
      }
      // No known specific error was handled
      this.handleGeneralError();
    }

    // The error was not handled yet. Handle as general
    this.handleGeneralError();
  }

  public handleInvalidRequest() {
    this.notification.error(this.i18n(`It is not possible to connect to the server.<br>
    Please make sure you are connected to the Internet and try again in a few seconds.`));
  }

  public handleUnauthorizedError(error: UnauthorizedError) {
    if (error.code === UnauthorizedErrorCode.MISSING_AUTHORIZATION) {
      // Should be logged-in. Redirect to login page.
      this.loginState.redirectUrl = this.router.url;
      this.router.navigateByUrl('/login');
    } else if (error.code === UnauthorizedErrorCode.LOGGED_OUT) {
      // Was logged out. Fetch the DataForUi again (as guest) and go to the login page.
      this.nextRequestState.sessionToken = null;
      this.dataForUiHolder.reload()
        .subscribe(dataForUi => {
          this.loginState.redirectUrl = this.router.url;
          this.router.navigateByUrl('/login');
        });
    } else {
      this.notification.error(this.unauthorizedErrorMessage(error));
    }
  }

  public handleForbiddenError(error: ForbiddenError) {
    this.notification.error(this.forbiddenErrorMessage(error));
  }

  public handleNotFoundError(error: NotFoundError) {
    this.notification.error(this.notFoundErrorMessage(error));
  }

  public handleInputError(error: InputError) {
    if ([InputErrorCode.VALIDATION, InputErrorCode.AGGREGATED].includes(error.code)) {
      // Will resort on page mapping to FormControls. Unmapped errors will be shown as general.
      const page = this.layout.currentPage;
      const generalErrors: string[] = [];
      this.collectInputErrors(page, generalErrors, error);

      // Show in a notification the general errors
      if (!empty(generalErrors)) {
        const sub = this.notification.error(this.validationErrorMessage(generalErrors)).onClosed.subscribe(() => {
          focusFirstInvalid();
          sub.unsubscribe();
        });
      } else {
        focusFirstInvalid();
      }
    } else {
      this.notification.error(this.inputErrorMessage(error));
    }
  }

  private collectInputErrors(page: BasePageComponent<any>, generalErrors: string[],
    error: InputError, nestedProperty?: string, nestedIndex?: number) {
    if (error == null || error.code == null) {
      return;
    }
    if (error.code === InputErrorCode.VALIDATION) {
      // Validation errors
      if (!empty(error.generalErrors)) {
        generalErrors.push.apply(generalErrors, error.generalErrors);
      }

      // Property errors
      for (const key of error.properties || []) {
        const errors = error.propertyErrors[key];
        this.applyInputErrors(generalErrors, errors, page,
          { property: key, nestedProperty: nestedProperty, nestedIndex: nestedIndex });
      }

      // Custom field errors
      for (const key of error.customFields || []) {
        const errors = error.customFieldErrors[key];
        this.applyInputErrors(generalErrors, errors, page,
          { customField: key, nestedProperty: nestedProperty, nestedIndex: nestedIndex });
      }
    } else if (error.code === InputErrorCode.AGGREGATED) {
      // Aggregated errors
      for (const key of Object.keys(error.errors || {})) {
        const inputError = error.errors[key];
        this.collectInputErrors(page, generalErrors, inputError, key);
      }
      // Aggregated errors with index
      for (const key of Object.keys(error.indexedErrors || {})) {
        const indexedErrors = error.indexedErrors[key];
        for (let i = 0; i < indexedErrors.length; i++) {
          const inputError = indexedErrors[i];
          this.collectInputErrors(page, generalErrors, inputError, key, i);
        }
      }
    } else {
      // Handle other input errors as general errors
      generalErrors.push(this.inputErrorMessage(error));
    }
  }

  private applyInputErrors(generalErrors: string[], errors: string[], page: BasePageComponent<any>, locator: FormControlLocator) {
    if (!empty(errors)) {
      const control = page ? page.locateControl(locator) : null;
      if (control) {
        // A formControl is found - set its error
        control.setErrors({
          message: errors[0]
        });
      } else {
        // No form control -> show as general errors
        generalErrors.push.apply(generalErrors, errors);
      }
    }

  }

  public getAllErrors(error: InputError): string[] {
    if (error.code === InputErrorCode.VALIDATION) {
      const errors: string[] = [];
      if (!empty(error.generalErrors)) {
        errors.push.apply(errors, error.generalErrors);
      }
      for (const key of error.properties || []) {
        errors.push.apply(errors, error.propertyErrors[key]);
      }
      for (const key of error.customFields || []) {
        errors.push.apply(errors, error.customFieldErrors[key]);
      }
      return errors;
    } else {
      return [this.inputErrorMessage(error)];
    }
  }

  public handleConflictError(error: ConflictError) {
    this.notification.error(this.conflictErrorMessage(error));
  }

  public handlePaymentError(error: PaymentError) {
    this.notification.error(this.paymentErrorMessage(error));
  }

  public handleOtpError(error: OtpError) {
    this.notification.error(this.otpErrorMessage(error));
  }

  public handleForgottenPasswordError(error: ForgottenPasswordError) {
    this.notification.error(this.forgottenPasswordErrorMessage(error));
  }

  public handleNestedError(error: NestedError) {
    const message = this.nestedErrorMessage(error);
    const page = this.layout.currentPage;
    const control = page ? page.locateControl({ nestedProperty: error.property, nestedIndex: error.index }) : null;

    if (control) {
      // A formControl is found - set its error
      control.setErrors({
        message: message
      });
    } else {
      // No form control -> show as general errors
      this.notification.error(message);
    }
  }

  public handleGeneralError() {
    this.notification.error(this.general);
  }

  /**
   * Returns the error message for an input error
   * @param error The error
   */
  public inputErrorMessage(error: InputError): string {
    if (error == null) {
      return null;
    }
    switch (error.code) {
      case InputErrorCode.VALIDATION:
        const errors: string[] = [];
        (error.generalErrors || []).forEach(e => errors.push(e));
        (error.properties || []).forEach(p => {
          (error.propertyErrors[p] || []).forEach(e => errors.push(e));
        });
        (error.customFields || []).forEach(p => {
          (error.customFieldErrors[p] || []).forEach(e => errors.push(e));
        });
        return this.validationErrorMessage(errors);
      case InputErrorCode.QUERY_PARSE:
        return this.i18n('Invalid keywords');
      case InputErrorCode.FILE_UPLOAD_SIZE:
        return this.i18n('The uploaded file exceeds the maximum allowed size of {{size}}', {
          size: this.format.formatFileSize(error.maxFileSize)
        });
      case InputErrorCode.MAX_ITEMS:
        return this.i18n('Cannot add more than {{max}} elements', {
          max: error.maxItems
        });
      default:
        return this.validation;
    }
  }

  private get validation(): string {
    return this.i18n('The action couldn\'t be processed, as there were validation errors');
  }

  private validationErrorMessage(errors: string[]): string {
    if (empty(errors)) {
      return this.validation;
    } else if (errors.length === 1) {
      return errors[0];
    } else {
      const items = `<ul><li>${errors.join('</li><li>')}</li></ul>`;
      return `<strong>${this.validation}</strong>: ${items}`;
    }
  }

  /**
   * Returns the error message for a conflict error
   * @param error The error
   */
  public conflictErrorMessage(error: ConflictError): string {
    error = error || {} as ConflictError;
    switch (error.code) {
      case ConflictErrorCode.STALE_ENTITY:
        return this.i18n(`This data cannot be saved because it has been modified by someone else.<br>
          Please, load the page again and restart the operation.`);
      case ConflictErrorCode.CONSTRAINT_VIOLATED_ON_REMOVE:
        return this.i18n('This data cannot be removed because it is currently in use');
      default:
        return this.general;
    }
  }

  private get general(): string {
    return this.i18n('There was an unexpected error while processing your request');
  }

  /**
   * Returns the error message for a not found error
   * @param error The error
   */
  public notFoundErrorMessage(error: NotFoundError): string {
    if (error == null) {
      return null;
    }
    if (error.entityType) {
      if (error.key) {
        return this.i18n('The requested data could not be found: {{type}} with key {{key}}', {
          type: error.entityType,
          key: error.key
        });
      } else {
        return this.i18n('The requested data could not be found: {{type}}', {
          type: error.entityType
        });
      }
    } else {
      return this.i18n('The location you typed or tried to access was not found');
    }
  }

  /**
   * Returns the error message for an unauthorized error
   * @param error The error
   */
  public unauthorizedErrorMessage(error: UnauthorizedError): string {
    error = error || {} as UnauthorizedError;
    switch (error.code) {
      case UnauthorizedErrorCode.LOGIN:
        switch (error.passwordStatus) {
          case PasswordStatusEnum.DISABLED:
            return this.i18n('Your user account has been disabled. Please, contact the administration.');
          case PasswordStatusEnum.RESET:
            return this.i18n('Your password has been reset');
          case PasswordStatusEnum.INDEFINITELY_BLOCKED:
            return this.i18n('Your login password has been disabled by exceeding the maximum tries. Please, contact the administration.');
          case PasswordStatusEnum.TEMPORARILY_BLOCKED:
            return this.i18n('Your password is temporarily blocked by exceeding the maximum tries');
          case PasswordStatusEnum.EXPIRED:
            return this.i18n('Your password has expired. Please, contact the administration.');
          case PasswordStatusEnum.PENDING:
            return this.i18n('Your user account is pending for activation. Please, contact the administration for more information.');
          default:
            return this.i18n('The given name / password are incorrect. Please, try again.');
        }
      case UnauthorizedErrorCode.REMOTE_ADDRESS_BLOCKED:
        return this.i18n('Your IP address is blocked for exceeding login attempts');
      case UnauthorizedErrorCode.UNAUTHORIZED_ADDRESS:
        return this.i18n('Your IP address is not allowed to login');
      case UnauthorizedErrorCode.UNAUTHORIZED_URL:
        return this.i18n('Access is not allowed from this URL');
      case UnauthorizedErrorCode.LOGGED_OUT:
        return this.i18n('You have been disconnected. Please, login again and repeat the operation.');
      default:
        return this.i18n('You don\'t have sufficient permissions to perform the requested action');
    }
  }

  /**
   * Returns the error message for a forbidden error
   * @param error The error
   */
  public forbiddenErrorMessage(error: ForbiddenError): string {
    error = error || {} as ForbiddenError;
    const passwordType = (error.passwordType || {}).name;
    switch (error.code) {
      case ForbiddenErrorCode.ILLEGAL_ACTION:
        return this.i18n('The action you attempted to perform is invalid');
      case ForbiddenErrorCode.INVALID_PASSWORD:
        return this.i18n('{{type}} is invalid', {
          type: passwordType
        });
      case ForbiddenErrorCode.EXPIRED_PASSWORD:
        return this.i18n('{{type}} is has expired. Please, contact the administration', {
          type: passwordType
        });
      case ForbiddenErrorCode.TEMPORARILY_BLOCKED:
        return this.i18n('{{type}} is temporarily blocked by exceeding the maximum tries. Please, contact the administration', {
          type: passwordType
        });
      case ForbiddenErrorCode.INDEFINITELY_BLOCKED:
        return this.i18n('{{type}} is disabled by exceeding the maximum tries. Please, contact the administration', {
          type: passwordType
        });
      default:
        return this.i18n('You don\'t have sufficient permissions to perform the requested action');
    }
  }

  /**
   * Returns the error message for a PaymentError
   * @param error The error
   */
  public paymentErrorMessage(error: PaymentError): string {
    error = error || {} as PaymentError;
    const count = () => this.format.formatAsNumber(error.maxPayments, 0);
    const amount = () => this.format.formatAsCurrency(error.currency, error.maxAmount);
    switch (error.code) {
      case PaymentErrorCode.TIME_BETWEEN_PAYMENTS_NOT_MET:
        return this.i18n('A minimum period of time should be awaited to make a payment of this type.');
      case PaymentErrorCode.INSUFFICIENT_BALANCE:
        return this.i18n('Insufficient balance to perform this operation');
      case PaymentErrorCode.DESTINATION_UPPER_LIMIT_REACHED:
        return this.i18n('You cannot perform this payment because the upper balance limit of the destination account has been exceeded');
      case PaymentErrorCode.DAILY_AMOUNT_EXCEEDED:
        return this.i18n('The maximum amount per day ({{amount}}) was exceeded', {
          amount: amount()
        });
      case PaymentErrorCode.DAILY_PAYMENTS_EXCEEDED:
        return this.i18n('The maximum amount of payments per day ({{count}}) was exceeded', {
          count: count()
        });
      case PaymentErrorCode.WEEKLY_AMOUNT_EXCEEDED:
        return this.i18n('The maximum amount per week ({{amount}}) was exceeded', {
          amount: amount()
        });
      case PaymentErrorCode.WEEKLY_PAYMENTS_EXCEEDED:
        return this.i18n('The maximum amount of payments per week ({{count}}) was exceeded', {
          count: count()
        });
      case PaymentErrorCode.MONTHLY_AMOUNT_EXCEEDED:
        return this.i18n('The maximum amount per month ({{amount}}) was exceeded', {
          amount: amount()
        });
      case PaymentErrorCode.MONTHLY_PAYMENTS_EXCEEDED:
        return this.i18n('The maximum amount of payments per month ({{count}}) was exceeded', {
          count: count()
        });
      default:
        return this.general;
    }
  }

  /**
   * Returns the error message for an OtpError
   * @param error The error
   */
  public otpErrorMessage(error: OtpError): string {
    return this.i18n('There was an error when sending the password. Please, try again later.');
  }

  /**
   * Returns the error message for a ForgottenPasswordError
   * @param error The error
   */
  public forgottenPasswordErrorMessage(error: ForgottenPasswordError): string {
    error = error || {} as ForgottenPasswordError;
    switch (error.code) {
      case ForgottenPasswordErrorCode.INVALID_SECURITY_ANSWER:
        if (error.keyInvalidated) {
          return this.i18n(`By exceeding the number of security question attempts, this request has been aborted.<br>
            Please, contact the administration.`);
        } else {
          return this.i18n('The given security answer is invalid');
        }
      default:
        return this.general;
    }
  }

  public nestedErrorMessage(error: NestedError): string {
    if (error.inputError) {
      return this.inputErrorMessage(error.inputError);
    } else if (error.forbiddenError) {
      return this.forbiddenErrorMessage(error.forbiddenError);
    } else if (error.unauthorizedError) {
      return this.unauthorizedErrorMessage(error.unauthorizedError);
    } else if (error.notFoundError) {
      return this.notFoundErrorMessage(error.notFoundError);
    } else if (error.conflictError) {
      return this.conflictErrorMessage(error.conflictError);
    } else if (error.error) {
      return this.errorMessage(error.error);
    } else {
      return this.general;
    }
  }

  public errorMessage(error: any): string {
    if (error != null && error.hasOwnProperty('kind')) {
      switch (error.kind) {
        case ErrorKind.PAYMENT:
          // A payment error
          this.paymentErrorMessage(error as PaymentError);
          return;
        case ErrorKind.OTP:
          // An error while generating an OTP
          this.otpErrorMessage(error as OtpError);
          return;
        case ErrorKind.FORGOTTEN_PASSWORD:
          // An error while changing a forgotten password
          this.forgottenPasswordErrorMessage(error as ForgottenPasswordError);
          return;
        case ErrorKind.NESTED:
          // An error in a nested property
          this.nestedErrorMessage(error as NestedError);
      }
    }
    return this.general;
  }

}
