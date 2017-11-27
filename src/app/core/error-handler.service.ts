import { Injectable } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { FormatService } from 'app/core/format.service';
import {
  Error as ApiError, ErrorKind, NotFoundError, InputError, InputErrorCode,
  UnauthorizedError, UnauthorizedErrorCode, PasswordStatusEnum, ForbiddenError,
  ForbiddenErrorCode, PaymentError, PaymentErrorCode
} from 'app/api/models';
import { NgForm } from '@angular/forms';
import { GeneralMessages } from 'app/messages/general-messages';
import { HttpErrorResponse } from '@angular/common/http/src/response';

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
   * Status Code: 422.
   */
  UNPROCESSABLE_ENTITY = 422,

  /**
   * Status Code: 500.
   */
  INTERNAL_SERVER_ERROR = 500
}

/**
 * Service used to handle application errors
 */
@Injectable()
export class ErrorHandlerService {

  constructor(
    private generalMessages: GeneralMessages,
    private notificationService: NotificationService,
    private formatService: FormatService
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
      message = this.generalMessages.errorValidation() + '<br>' + message;
      this.notificationService.error(message);
      return true;
    }
    return false;
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
      let error;
      try {
        error = JSON.parse(err.message);
      } catch (e) {
        error = null;
      }
      switch (err.status) {
        case ErrorStatus.INVALID_REQUEST:
          message = this.generalMessages.errorNetwork();
          break;
        case ErrorStatus.UNAUTHORIZED:
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
          if (error instanceof ApiError) {
            switch (error.kind) {
              case ErrorKind.PAYMENT:
                // A payment error
                message = this.paymentErrorMessage(error);
                break;
              case ErrorKind.OTP:
                // An error while generating an OTP
                message = this.generalMessages.passwordOtpError();
                break;
            }
          }
      }
    }

    if (!message) {
      // No specific message. Show a general message
      message = this.generalMessages.errorGeneral();
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
    let message = this.generalMessages.errorValidation();
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
        return this.generalMessages.errorEntityNotFoundKey(error.entityType, error.key);
      } else {
        return this.generalMessages.errorEntityNotFound(error.entityType);
      }
    } else {
      return this.generalMessages.errorNotFound();
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
            return this.generalMessages.errorLoginPasswordDisabled();
          case PasswordStatusEnum.RESET:
            return this.generalMessages.errorLoginPasswordReset();
          case PasswordStatusEnum.INDEFINITELY_BLOCKED:
            return this.generalMessages.errorLoginPasswordIndefinitelyBlocked();
          case PasswordStatusEnum.TEMPORARILY_BLOCKED:
            return this.generalMessages.errorLoginPasswordTemporarilyBlocked();
          case PasswordStatusEnum.EXPIRED:
            return this.generalMessages.errorLoginPasswordExpired();
          case PasswordStatusEnum.PENDING:
            return this.generalMessages.errorLoginPasswordPending();
          default:
            return this.generalMessages.errorLogin();
        }
      case UnauthorizedErrorCode.LOGGED_OUT:
        return this.generalMessages.errorSessionExpired();
      default:
        return this.generalMessages.errorPermission();
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
        return this.generalMessages.errorIllegalAction();
      case ForbiddenErrorCode.INVALID_PASSWORD:
        return this.generalMessages.errorInvalid(passwordType);
      case ForbiddenErrorCode.EXPIRED_PASSWORD:
        return this.generalMessages.errorPasswordExpired(passwordType)
      case ForbiddenErrorCode.TEMPORARILY_BLOCKED:
        return this.generalMessages.errorPasswordTemporarilyBlocked(passwordType)
      case ForbiddenErrorCode.INDEFINITELY_BLOCKED:
        return this.generalMessages.errorPasswordIndefinitelyBlocked(passwordType)
      default:
        return this.generalMessages.errorPermission();
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
        return this.generalMessages.errorPaymentMinTime();
      case PaymentErrorCode.INSUFFICIENT_BALANCE:
        return this.generalMessages.errorPaymentBalance();
      case PaymentErrorCode.DESTINATION_UPPER_LIMIT_REACHED:
        return this.generalMessages.errorPaymentUpperCreditLimit();
      case PaymentErrorCode.DAILY_AMOUNT_EXCEEDED:
        return this.generalMessages.errorPaymentDayAmount(amount());
      case PaymentErrorCode.DAILY_PAYMENTS_EXCEEDED:
        return this.generalMessages.errorPaymentDayCount(count());
      case PaymentErrorCode.WEEKLY_AMOUNT_EXCEEDED:
        return this.generalMessages.errorPaymentWeekAmount(amount());
      case PaymentErrorCode.WEEKLY_PAYMENTS_EXCEEDED:
        return this.generalMessages.errorPaymentWeekCount(count());
      case PaymentErrorCode.MONTHLY_AMOUNT_EXCEEDED:
        return this.generalMessages.errorPaymentMonthAmount(amount());
      case PaymentErrorCode.MONTHLY_PAYMENTS_EXCEEDED:
        return this.generalMessages.errorPaymentMonthCount(count());
      default:
        return this.generalMessages.errorGeneral();
    }
  }
}
