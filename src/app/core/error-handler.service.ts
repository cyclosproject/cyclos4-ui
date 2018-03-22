import { Injectable } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { FormatService } from 'app/core/format.service';
import {
  ErrorKind, NotFoundError, InputError, InputErrorCode,
  UnauthorizedError, UnauthorizedErrorCode, PasswordStatusEnum, ForbiddenError,
  ForbiddenErrorCode, PaymentError, PaymentErrorCode, ForgottenPasswordError, ForgottenPasswordErrorCode
} from 'app/api/models';
import { NgForm } from '@angular/forms';
import { Messages } from 'app/messages/messages';
import { HttpErrorResponse } from '@angular/common/http';
import { NextRequestState } from './next-request-state';
import { ErrorStatus } from './error-status';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { Router } from '@angular/router';
import { LoginService } from 'app/core/login.service';

/**
 * Service used to handle application errors
 */
@Injectable()
export class ErrorHandlerService {

  constructor(
    private messages: Messages,
    private router: Router,
    private loginService: LoginService,
    private notificationService: NotificationService,
    private formatService: FormatService,
    private nextRequestState: NextRequestState,
    private dataForUiHolder: DataForUiHolder
  ) { }


  /**
   * Shows validation errors of the form
   */
  showFormErrors(form: NgForm): boolean {
    let message = '';
    const errors = form.control.errors;
    for (const name in errors) {
      if (errors.hasOwnProperty(name)) {
        const propertyErrors = errors[name];
        if (propertyErrors != null) {
          message += form.controls[name] + '<br>';
        }
      }
    }
    if (message) {
      message = this.messages.errorValidation() + '<br>' + message;
      this.notificationService.error(message);
      return true;
    }
    return false;
  }

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
    let message: string = null;
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
          message = this.messages.errorNetwork();
          break;
        case ErrorStatus.UNAUTHORIZED:
          if (error.code === UnauthorizedErrorCode.LOGGED_OUT || this.nextRequestState.sessionToken == null) {
            // Was logged out. Fetch the DataForUi again and go to the login page.
            this.nextRequestState.sessionToken = null;
            this.dataForUiHolder.reload()
              .then(dataForUi => {
                if (dataForUi.auth == null) {
                  this.loginService.redirectUrl = this.router.url;
                  this.router.navigateByUrl('/login');
                }
              });
            return;
          }
          message = this.unauthorizedErrorMessage(error as UnauthorizedError);
          break;
        case ErrorStatus.FORBIDDEN:
          message = this.forbiddenErrorMessage(error as ForbiddenError);
          break;
        case ErrorStatus.NOT_FOUND:
          message = this.notFoundErrorMessage(error as NotFoundError);
          break;
        case ErrorStatus.UNPROCESSABLE_ENTITY:
          message = this.inputErrorMessage(error as InputError);
          break;
        case ErrorStatus.INTERNAL_SERVER_ERROR:
          // The internal server error may be a specific kind or a general error
          if (error.hasOwnProperty('kind')) {
            switch (error.kind) {
              case ErrorKind.PAYMENT:
                // A payment error
                message = this.paymentErrorMessage(error);
                break;
              case ErrorKind.OTP:
                // An error while generating an OTP
                message = this.messages.passwordOtpError();
                break;
              case ErrorKind.FORGOTTEN_PASSWORD:
                // An error while changing a forgotten password
                message = this.forgottenPasswordErrorMessage(error);
                break;
            }
          }
      }
    }

    if (!message) {
      // No specific message. Show a general message
      message = this.messages.errorGeneral();
    }
    this.notificationService.error(message);
  }

  /**
   * Returns the error message for an input error
   * @param error The error
   */
  public inputErrorMessage(error: InputError): string {
    if (error == null) {
      return null;
    }
    let message = this.messages.errorValidation();
    if (error.code === InputErrorCode.VALIDATION) {
      const items: string[] = [];
      (error.generalErrors || []).forEach(e => items.push(e));
      (error.properties || []).forEach(p => {
        (error.propertyErrors[p] || []).forEach(e => items.push(e));
      });
      (error.customFields || []).forEach(p => {
        (error.customFieldErrors[p] || []).forEach(e => items.push(e));
      });
      if (items.length === 1) {
        return items[0];
      } else if (items.length > 1) {
        message = '<b>' + message + '</b><ul><li>' + items.join('</li><li>') + '</li></ul>';
      }
    }
    return message;
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
        return this.messages.errorEntityNotFoundKey(error.key, error.entityType);
      } else {
        return this.messages.errorEntityNotFound(error.entityType);
      }
    } else {
      return this.messages.errorNotFound();
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
            return this.messages.errorLoginPasswordDisabled();
          case PasswordStatusEnum.RESET:
            return this.messages.errorLoginPasswordReset();
          case PasswordStatusEnum.INDEFINITELY_BLOCKED:
            return this.messages.errorLoginPasswordIndefinitelyBlocked();
          case PasswordStatusEnum.TEMPORARILY_BLOCKED:
            return this.messages.errorLoginPasswordTemporarilyBlocked();
          case PasswordStatusEnum.EXPIRED:
            return this.messages.errorLoginPasswordExpired();
          case PasswordStatusEnum.PENDING:
            return this.messages.errorLoginPasswordPending();
          default:
            return this.messages.errorLogin();
        }
      case UnauthorizedErrorCode.LOGGED_OUT:
        return this.messages.errorSessionExpired();
      default:
        return this.messages.errorPermission();
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
        return this.messages.errorIllegalAction();
      case ForbiddenErrorCode.INVALID_PASSWORD:
        return this.messages.errorInvalid(passwordType);
      case ForbiddenErrorCode.EXPIRED_PASSWORD:
        return this.messages.errorPasswordExpired(passwordType);
      case ForbiddenErrorCode.TEMPORARILY_BLOCKED:
        return this.messages.errorPasswordTemporarilyBlocked(passwordType);
      case ForbiddenErrorCode.INDEFINITELY_BLOCKED:
        return this.messages.errorPasswordIndefinitelyBlocked(passwordType);
      default:
        return this.messages.errorPermission();
    }
  }

  /**
   * Returns the error message for a PaymentError
   * @param error The error
   */
  public paymentErrorMessage(error: PaymentError): string {
    error = error || {} as PaymentError;
    const count = () => this.formatService.formatAsNumber(error.maxPayments, 0);
    const amount = () => this.formatService.formatAsCurrency(error.currency, error.maxAmount);
    switch (error.code) {
      case PaymentErrorCode.TIME_BETWEEN_PAYMENTS_NOT_MET:
        return this.messages.errorPaymentMinTime();
      case PaymentErrorCode.INSUFFICIENT_BALANCE:
        return this.messages.errorPaymentBalance();
      case PaymentErrorCode.DESTINATION_UPPER_LIMIT_REACHED:
        return this.messages.errorPaymentUpperCreditLimit();
      case PaymentErrorCode.DAILY_AMOUNT_EXCEEDED:
        return this.messages.errorPaymentDayAmount(amount());
      case PaymentErrorCode.DAILY_PAYMENTS_EXCEEDED:
        return this.messages.errorPaymentDayCount(count());
      case PaymentErrorCode.WEEKLY_AMOUNT_EXCEEDED:
        return this.messages.errorPaymentWeekAmount(amount());
      case PaymentErrorCode.WEEKLY_PAYMENTS_EXCEEDED:
        return this.messages.errorPaymentWeekCount(count());
      case PaymentErrorCode.MONTHLY_AMOUNT_EXCEEDED:
        return this.messages.errorPaymentMonthAmount(amount());
      case PaymentErrorCode.MONTHLY_PAYMENTS_EXCEEDED:
        return this.messages.errorPaymentMonthCount(count());
      default:
        return this.messages.errorGeneral();
    }
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
          return this.messages.errorForgottenPasswordInvalidSecurityAnswerKeyInvalidated();
        } else {
          return this.messages.errorForgottenPasswordInvalidSecurityAnswer();
        }
      default:
        return this.messages.errorGeneral();
    }
  }
}
