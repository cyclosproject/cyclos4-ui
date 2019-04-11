import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ConflictError, ConflictErrorCode, ErrorKind, ForbiddenError, ForbiddenErrorCode, ForgottenPasswordError, ForgottenPasswordErrorCode, InputError, InputErrorCode, NestedError, NotFoundError, OtpError, PasswordStatusEnum, PaymentError, PaymentErrorCode, UnauthorizedError, UnauthorizedErrorCode } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { I18n } from 'app/i18n/i18n';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { empty, focusFirstInvalid } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ErrorStatus } from './error-status';
import { NextRequestState } from './next-request-state';

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
    private login: LoginService,
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
  requestWithCustomErrorHandler<T>(callback: (defaultHandling: (response: HttpErrorResponse) => void) => T): T {
    this.nextRequestState.ignoreNextError = true;
    return callback(resp => this.handleHttpError(resp));
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
    this.notification.error(this.i18n.error.invalidRequest);
  }

  public handleUnauthorizedError(error: UnauthorizedError) {
    if (error.code === UnauthorizedErrorCode.MISSING_AUTHORIZATION) {
      // Should be logged-in. Redirect to login page.
      this.login.goToLoginPage(this.router.url);
    } else if (error.code === UnauthorizedErrorCode.LOGGED_OUT) {
      // Was logged out. Fetch the DataForUi again (as guest) and go to the login page.
      this.nextRequestState.setSessionToken(null);
      this.dataForUiHolder.reload()
        .subscribe(() => {
          this.login.goToLoginPage(this.router.url);
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
        return this.i18n.error.queryParse;
      case InputErrorCode.FILE_UPLOAD_SIZE:
        return this.i18n.error.uploadSizeExceeded(this.format.formatFileSize(error.maxFileSize));
      case InputErrorCode.MAX_ITEMS:
        return this.i18n.error.maxItems(String(error.maxItems));
      default:
        return this.validation;
    }
  }

  private get validation(): string {
    return this.i18n.error.validation;
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
        return this.i18n.error.staleEntity;
      case ConflictErrorCode.CONSTRAINT_VIOLATED_ON_REMOVE:
        return this.i18n.error.removeDataInUse;
      default:
        return this.general;
    }
  }

  private get general(): string {
    return this.i18n.error.general;
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
        return this.i18n.error.notFoundTypeKey({
          type: error.entityType,
          key: error.key
        });
      } else {
        return this.i18n.error.notFoundType(error.entityType);
      }
    } else {
      return this.i18n.error.notFound;
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
            return this.i18n.error.passwordDisabled;
          case PasswordStatusEnum.RESET:
            return this.i18n.error.passwordReset;
          case PasswordStatusEnum.INDEFINITELY_BLOCKED:
            return this.i18n.error.passwordIndefinitelyBlocked;
          case PasswordStatusEnum.TEMPORARILY_BLOCKED:
            return this.i18n.error.passwordTemporarilyBlocked;
          case PasswordStatusEnum.EXPIRED:
            return this.i18n.error.passwordExpired;
          case PasswordStatusEnum.PENDING:
            return this.i18n.error.passwordPending;
          default:
            return this.i18n.error.login;
        }
      case UnauthorizedErrorCode.REMOTE_ADDRESS_BLOCKED:
        return this.i18n.error.remoteAddressBlocked;
      case UnauthorizedErrorCode.UNAUTHORIZED_ADDRESS:
        return this.i18n.error.unauthorizedAddress;
      case UnauthorizedErrorCode.UNAUTHORIZED_URL:
        return this.i18n.error.unauthorizedUrl;
      case UnauthorizedErrorCode.LOGGED_OUT:
        return this.i18n.error.loggedOut;
      default:
        return this.i18n.error.permission;
    }
  }

  /**
   * Returns the error message for a forbidden error
   * @param error The error
   */
  public forbiddenErrorMessage(error: ForbiddenError): string {
    error = error || {} as ForbiddenError;
    switch (error.code) {
      case ForbiddenErrorCode.ILLEGAL_ACTION:
        return this.i18n.error.illegalAction;
      case ForbiddenErrorCode.INVALID_PASSWORD:
        return this.i18n.error.passwordInvalid((error.passwordType || {}).name);
      case ForbiddenErrorCode.EXPIRED_PASSWORD:
        return this.i18n.error.passwordExpired;
      case ForbiddenErrorCode.TEMPORARILY_BLOCKED:
        return this.i18n.error.passwordTemporarilyBlocked;
      case ForbiddenErrorCode.INDEFINITELY_BLOCKED:
        return this.i18n.error.passwordIndefinitelyBlocked;
      default:
        return this.i18n.error.permission;
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
        return this.i18n.transaction.error.minTime;
      case PaymentErrorCode.INSUFFICIENT_BALANCE:
        return this.i18n.transaction.error.balance;
      case PaymentErrorCode.DESTINATION_UPPER_LIMIT_REACHED:
        return this.i18n.transaction.error.upperLimit;
      case PaymentErrorCode.DAILY_AMOUNT_EXCEEDED:
        return this.i18n.transaction.error.dailyAmount(amount());
      case PaymentErrorCode.DAILY_PAYMENTS_EXCEEDED:
        return this.i18n.transaction.error.dailyCount(count());
      case PaymentErrorCode.WEEKLY_AMOUNT_EXCEEDED:
        return this.i18n.transaction.error.weeklyAmount(amount());
      case PaymentErrorCode.WEEKLY_PAYMENTS_EXCEEDED:
        return this.i18n.transaction.error.weeklyCount(count());
      case PaymentErrorCode.MONTHLY_AMOUNT_EXCEEDED:
        return this.i18n.transaction.error.monthlyAmount(amount());
      case PaymentErrorCode.MONTHLY_PAYMENTS_EXCEEDED:
        return this.i18n.transaction.error.monthlyCount(count());
      default:
        return this.general;
    }
  }

  /**
   * Returns the error message for an OtpError
   * @param error The error
   */
  public otpErrorMessage(_error: OtpError): string {
    return this.i18n.error.otp;
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
          return this.i18n.error.securityAnswerDisabled;
        } else {
          return this.i18n.error.securityAnswer;
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
