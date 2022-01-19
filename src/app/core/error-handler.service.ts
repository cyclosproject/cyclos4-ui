import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  BuyVoucherError, BuyVoucherErrorCode, ConflictError, ConflictErrorCode,
  ErrorKind, ForbiddenError, ForbiddenErrorCode, ForgottenPasswordError,
  ForgottenPasswordErrorCode, InputError, InputErrorCode, NestedError, NotFoundError,
  PasswordStatusEnum, PaymentError, PaymentErrorCode, RedeemVoucherError,
  RedeemVoucherErrorCode, ShoppingCartError, ShoppingCartErrorCode,
  TopUpVoucherError,
  TopUpVoucherErrorCode,
  UnauthorizedError, UnauthorizedErrorCode, UnavailableError, UnavailableErrorCode, UserStatusEnum
} from 'app/api/models';
import { ApiI18nService } from 'app/core/api-i18n.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { FormatService } from 'app/core/format.service';
import { NotificationService } from 'app/core/notification.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { empty } from 'app/shared/helper';
import { first } from 'rxjs/operators';
import { ErrorStatus } from './error-status';
import { NextRequestState } from './next-request-state';

/**
 * Service used to handle application errors
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {

  // These handlers are used to reduce the initial bundle, so other apps (not the ui)
  // can use the same error handler without pulling a lot of dependencies.
  goToLoginPageHandler: () => any;
  validationErrorHandler: (error: InputError) => any;

  constructor(
    private notification: NotificationService,
    private format: FormatService,
    private nextRequestState: NextRequestState,
    private dataForFrontendHolder: DataForFrontendHolder,
    @Inject(I18nInjectionToken) private i18n: I18n,
    private apiI18n: ApiI18nService
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
      console.dir(err.error);
    } else {
      // Server-generated error
      const error = this.parseError(err.error);
      if (!this.i18n.initialized$.value) {
        //In case the translations weren't loaded show a fixed message
        this.handleErrorWhenNoTranslations(err.status, error);
      } else {
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
          case ErrorStatus.SERVICE_UNAVAILABLE:
            this.handleUnavailableError(error as UnavailableError);
            return;
          case ErrorStatus.INTERNAL_SERVER_ERROR:
            // The internal server error may be a specific kind or a general error
            if (error != null && error.hasOwnProperty('kind')) {
              switch (error.kind) {
                case ErrorKind.PAYMENT:
                  // A payment error
                  this.handlePaymentError(error as PaymentError);
                  return;
                case ErrorKind.FORGOTTEN_PASSWORD:
                  // An error while changing a forgotten password
                  this.handleForgottenPasswordError(error as ForgottenPasswordError);
                  return;
                case ErrorKind.REDEEM_VOUCHER:
                  this.handleRedeemVoucherError(error as RedeemVoucherError);
                  return;
                case ErrorKind.TOP_UP_VOUCHER:
                  this.handleTopUpVoucherError(error as TopUpVoucherError);
                  return;
                case ErrorKind.BUY_VOUCHER:
                  this.handleBuyVoucherError(error as BuyVoucherError);
                  return;
                case ErrorKind.SHOPPING_CART:
                  this.handleShoppingCartError(error as ShoppingCartError);
                  return;
                case ErrorKind.NESTED:
                  // An error in a nested property
                  this.handleNestedError(error as NestedError);
                  return;
              }
            }
        }
        // No known specific error was handled
        this.handleGeneralError();
      }
    }
  }

  /**
   * It only handles a handful of server errors (the most common ones) when the translations were not loaded.
   */
  handleErrorWhenNoTranslations(httpStatus: number, error: any) {
    console.error("Translations are not loaded. Error:");
    console.dir(error);
    switch (httpStatus) {
      case ErrorStatus.NOT_FOUND:
        this.notification.error("The location you typed or tried to access was not found");
        return;
      case ErrorStatus.UNAUTHORIZED:
      case ErrorStatus.FORBIDDEN:
        this.notification.error("You don't have sufficient permissions to perform the requested action");
        return;
    }
    this.notification.error("There was an unexpected error while processing your request");
  }

  public parseError(err: any): any {
    let error = err;
    if (typeof error === 'string') {
      try {
        error = JSON.parse(error);
      } catch (e) {
        error = null;
      }
    }
    return error;
  }

  public handleInvalidRequest() {
    this.notification.error(this.i18n.error.invalidRequest);
  }

  public handleUnauthorizedError(error: UnauthorizedError) {
    const goToLogin = () => {
      if (this.goToLoginPageHandler) {
        this.goToLoginPageHandler();
      } else {
        this.notification.error(this.unauthorizedErrorMessage(error));
      }
    };
    if (error?.code === UnauthorizedErrorCode.MISSING_AUTHORIZATION) {
      // Should be logged-in. Redirect to login page.
      goToLogin();
    } else if (error?.code === UnauthorizedErrorCode.LOGGED_OUT) {
      // Was logged out. Fetch the DataForFrontend again (as guest) and go to the login page.
      this.nextRequestState.setSessionToken(null);
      this.dataForFrontendHolder.reload().pipe(first()).subscribe(() => goToLogin());
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
    if (this.validationErrorHandler && [InputErrorCode.VALIDATION, InputErrorCode.AGGREGATED].includes(error?.code)) {
      this.validationErrorHandler(error);
    } else {
      this.notification.error(this.inputErrorMessage(error));
    }
  }

  public handleRedeemVoucherError(error: RedeemVoucherError) {
    if (error?.code === RedeemVoucherErrorCode.PAYMENT) {
      this.handlePaymentError(error.paymentError);
    } else {
      this.notification.error(this.redeemVoucherErrorMessage(error));
    }
  }

  public handleTopUpVoucherError(error: TopUpVoucherError) {
    if (error?.code === TopUpVoucherErrorCode.PAYMENT) {
      this.handlePaymentError(error.paymentError);
    } else {
      this.notification.error(this.topUpVoucherErrorMessage(error));
    }
  }

  public handleShoppingCartError(error: ShoppingCartError) {
    this.notification.error(this.shoppingCartErrorMessage(error));
  }

  private shoppingCartErrorMessage(error: ShoppingCartError) {
    if (error?.code === ShoppingCartErrorCode.CAN_NOT_BUY_FROM_SELLER) {
      return this.i18n.ad.error.cannotBuyFromSeller;
    } else if (error?.code === ShoppingCartErrorCode.NOT_ENOUGH_STOCK) {
      return this.i18n.ad.error.notEnoughStock;
    }
    return this.general;
  }

  public handleBuyVoucherError(error: BuyVoucherError) {
    if (error?.code === BuyVoucherErrorCode.PAYMENT) {
      this.handlePaymentError(error.paymentError);
    } else {
      this.notification.error(this.buyVoucherErrorMessage(error));
    }
  }

  private buyVoucherErrorMessage(error: BuyVoucherError): string {
    switch (error?.code) {
      case BuyVoucherErrorCode.MAX_AMOUNT_FOR_PERIOD:
        return this.i18n.voucher.error.buy.amountForPeriod({ date: error.dateAllowedAgain, amount: error.amountLeftForBuying });
      case BuyVoucherErrorCode.MAX_OPEN_AMOUNT:
        return this.i18n.voucher.error.buy.openAmount({ maxAmount: error.maxOpenAmount, currentAmount: error.currentOpenAmount });
      case BuyVoucherErrorCode.MAX_TOTAL_OPEN_AMOUNT:
        return this.i18n.voucher.error.totalOpenAmount({ maxAmount: error.maxOpenAmount, currentAmount: error.currentOpenAmount });
      case BuyVoucherErrorCode.NOT_ALLOWED_FOR_USER:
        return this.i18n.voucher.error.buy.notAllowedForUser;
    }
    return this.general;
  }

  private redeemVoucherErrorMessage(error: RedeemVoucherError): string {
    switch (error?.code) {
      case RedeemVoucherErrorCode.NOT_ALLOWED_FOR_USER:
        return this.i18n.voucher.error.redeem.user;
      case RedeemVoucherErrorCode.NOT_ALLOWED_FOR_VOUCHER:
        return this.i18n.voucher.error.redeem.status(this.apiI18n.voucherStatus(error.voucherStatus));
      case RedeemVoucherErrorCode.NOT_ALLOWED_TODAY:
        const allowedDays = error.allowedDays.map(day => this.format.weekDay(day)).join(', ');
        return this.i18n.voucher.error.redeem.notAllowedToday(allowedDays);
      case RedeemVoucherErrorCode.NOT_ALLOWED_YET:
        return this.i18n.voucher.error.redeem.notAllowedYet(error.redeemAfterDate);
      case RedeemVoucherErrorCode.INSUFFICIENT_BALANCE:
        if (error.balance && error.currency) {
          const balance = this.format.formatAsCurrency(error.currency, error.balance);
          return this.i18n.voucher.error.redeem.insufficientBalanceBalance(balance);
        } else {
          return this.i18n.voucher.error.redeem.insufficientBalance;
        }
      case RedeemVoucherErrorCode.USER_BLOCKED:
        return this.i18n.voucher.error.redeem.userBlocked;
      case RedeemVoucherErrorCode.PAYMENT:
        return this.paymentErrorMessage(error.paymentError);
    }
    return this.general;
  }

  private topUpVoucherErrorMessage(error: TopUpVoucherError): string {
    switch (error?.code) {
      case TopUpVoucherErrorCode.ACTIVATION_EXPIRED:
        return this.i18n.voucher.error.topUp.activationExpired(this.format.formatAsDateTime(error.activationLimit));
      case TopUpVoucherErrorCode.NOT_ALLOWED_FOR_VOUCHER:
        return this.i18n.voucher.error.topUp.status(this.apiI18n.voucherStatus(error.voucherStatus));
      case TopUpVoucherErrorCode.ALREADY_ACTIVATED:
        return this.i18n.voucher.error.topUp.alreadyActivated;
      case TopUpVoucherErrorCode.MAX_BALANCE_REACHED:
        return this.i18n.voucher.error.topUp.maxBalanceReached;
      case TopUpVoucherErrorCode.PAYMENT:
        return this.paymentErrorMessage(error.paymentError);
    }
    return this.general;
  }

  public handleConflictError(error: ConflictError) {
    this.notification.error(this.conflictErrorMessage(error));
  }

  public handleUnavailableError(error: UnavailableError) {
    this.notification.error(this.unavailableErrorMessage(error));
  }

  public handlePaymentError(error: PaymentError) {
    this.notification.error(this.paymentErrorMessage(error));
  }

  public handleForgottenPasswordError(error: ForgottenPasswordError) {
    this.notification.error(this.forgottenPasswordErrorMessage(error));
  }

  public handleNestedError(error: NestedError) {
    this.notification.error(this.nestedErrorMessage(error));
  }

  public handleGeneralError() {
    this.notification.error(this.general);
  }

  /**
   * Returns the error message for an input error
   * @param error The error
   */
  public inputErrorMessage(error: InputError): string {
    switch (error?.code) {
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

  public validationErrorMessage(errors: string[]): string {
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

  public unavailableErrorMessage(error: UnavailableError): string {
    error = error || {} as UnavailableError;
    switch (error.code) {
      case UnavailableErrorCode.EMAIL_SENDING:
        return this.i18n.error.emailSending;
      case UnavailableErrorCode.SMS_SENDING:
        return this.i18n.error.smsSending;
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
    if (error?.entityType) {
      if (error.key) {
        return this.i18n.error.notFound.typeKey({
          type: error.entityType,
          key: error.key,
        });
      } else {
        return this.i18n.error.notFound.type(error.entityType);
      }
    } else {
      return this.i18n.error.notFound.location;
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
        const missingSecondaryPassword = error.missingSecondaryPassword;
        const secondaryDeviceAllowed = !!error.secondaryDeviceAllowed;
        if (missingSecondaryPassword && secondaryDeviceAllowed) {
          return this.i18n.login.error.confirmation.missingBoth(missingSecondaryPassword.name);
        } else if (missingSecondaryPassword && !secondaryDeviceAllowed) {
          return this.i18n.login.error.confirmation.missingPassword(missingSecondaryPassword.name);
        } else if (!missingSecondaryPassword && secondaryDeviceAllowed) {
          return this.i18n.login.error.confirmation.missingDevice;
        }
        switch (error.passwordStatus) {
          case PasswordStatusEnum.DISABLED:
            return this.i18n.login.error.password.disabled;
          case PasswordStatusEnum.RESET:
            return this.i18n.login.error.password.reset;
          case PasswordStatusEnum.INDEFINITELY_BLOCKED:
            return this.i18n.login.error.password.indefinitelyBlocked;
          case PasswordStatusEnum.TEMPORARILY_BLOCKED:
            return this.i18n.login.error.password.temporarilyBlocked;
          case PasswordStatusEnum.EXPIRED:
            return this.i18n.login.error.password.expired;
        }

        switch (error.userStatus) {
          case UserStatusEnum.BLOCKED:
            return this.i18n.login.error.user.blocked;
          case UserStatusEnum.DISABLED:
            return this.i18n.login.error.user.disabled;
          case UserStatusEnum.PENDING:
            return this.i18n.login.error.user.pending;
        }
        return this.i18n.error.login;
      case UnauthorizedErrorCode.REMOTE_ADDRESS_BLOCKED:
        return this.i18n.error.remoteAddressBlocked;
      case UnauthorizedErrorCode.UNAUTHORIZED_ADDRESS:
        return this.i18n.error.unauthorized.address;
      case UnauthorizedErrorCode.UNAUTHORIZED_URL:
        return this.i18n.error.unauthorized.url;
      case UnauthorizedErrorCode.INVALID_NETWORK:
        return this.i18n.error.networkInaccessible;
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
    switch (error?.code) {
      case ForbiddenErrorCode.ILLEGAL_ACTION:
        return this.i18n.error.illegalAction;
      case ForbiddenErrorCode.INVALID_PASSWORD:
        return this.i18n.password.error.invalid((error.passwordType || {}).name);
      case ForbiddenErrorCode.EXPIRED_PASSWORD:
        return this.i18n.password.error.expired;
      case ForbiddenErrorCode.TEMPORARILY_BLOCKED:
        return this.i18n.password.error.temporarilyBlocked;
      case ForbiddenErrorCode.INDEFINITELY_BLOCKED:
        return this.i18n.password.error.indefinitelyBlocked;
      case ForbiddenErrorCode.OTP_INVALIDATED:
        return this.i18n.password.error.otpInvalidated;
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
      case PaymentErrorCode.YEARLY_AMOUNT_EXCEEDED:
        return this.i18n.transaction.error.yearlyAmount(amount());
      default:
        return this.general;
    }
  }

  /**
   * Returns the error message for a ForgottenPasswordError
   * @param error The error
   */
  public forgottenPasswordErrorMessage(error: ForgottenPasswordError): string {
    switch (error?.code) {
      case ForgottenPasswordErrorCode.INVALID_SECURITY_ANSWER:
        if (error.keyInvalidated) {
          return this.i18n.error.securityAnswer.disabled;
        } else {
          return this.i18n.error.securityAnswer.invalid;
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
