import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  InternalNamedEntity, NotificationKind, NotificationKindMediums,
  NotificationSettingsDataForEdit, RoleEnum, SystemAlertTypeEnum, UserAlertTypeEnum,
} from 'app/api/models';
import { NotificationSettingsService } from 'app/api/services';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

@Component({
  selector: 'notification-settings-form',
  templateUrl: 'notification-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsFormComponent
  extends BasePageComponent<NotificationSettingsDataForEdit>
  implements OnInit {

  user: string;
  adminSettings: boolean;
  singleAccount: boolean;
  form: FormGroup;
  notificationSections = new Map<string, NotificationKindMediums[]>();
  kindControlsMap = new Map<NotificationKind, FormControl>();
  kindFieldOptionsMap = new Map<NotificationKind, FieldOption[]>();

  constructor(
    injector: Injector,
    private notificationSettingsService: NotificationSettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.user = this.route.snapshot.params.user;

    this.addSub(this.notificationSettingsService.getNotificationSettingsDataForEdit({ user: this.user })
      .subscribe(data => this.data = data));
  }

  onDataInitialized(data: NotificationSettingsDataForEdit) {
    this.adminSettings = data.role === RoleEnum.ADMINISTRATOR;
    this.form = this.formBuilder.group({
      version: data.settings.version,
    });

    if (this.adminSettings) {
      if (!this.hasSettings(data)) {
        // Display a notification when there aren't any admin settings to show
        this.notification.info(this.i18n.notificationSettings.notAvailableSettings);
        return;
      }
      // Add all notifications without section
      this.notificationSections.set('', data.settings.notifications);

      // Message categories
      this.form.addControl('forwardMessageCategories', this.formBuilder.control(data.settings.forwardMessageCategories));
    }

    // Forward to email
    if (data.forwardMessagesAllowed) {
      this.form.setControl('forwardMessages', this.formBuilder.control(data.settings.forwardMessages));
    }

    // Notifications
    const kinds = [];
    const notificationValues = this.formBuilder.array([]);
    for (const value of data.settings.notifications) {
      const typeForm = this.formBuilder.group({
        internal: value.internal,
        kind: value.kind,
        // Handle null (or undefined) to indicate which fields wont be added in the HTML component
        sms: value.sms === undefined ? null : value.sms,
        email: value.email === undefined ? null : value.email,
      });
      // Enable/disable email and sms controls based on internal field
      this.addSub(typeForm.controls.internal.valueChanges.subscribe(() => {
        this.updateControls(typeForm);
      }));
      this.updateControls(typeForm);
      notificationValues.push(typeForm);
      kinds.push(value.kind);
      // Add user notifications grouped by sections
      if (!this.adminSettings) {
        const section = this.resolveSection(value.kind);
        const values = this.notificationSections.get(section);
        if (values) {
          values.push(value);
        } else {
          this.notificationSections.set(section, [value]);
        }
      }
    }
    if (kinds.length > 0) {
      for (const kind of kinds) {
        let options: FieldOption[];
        let values: string[];
        let property: string;
        [options, values, property] = this.resolveOptions(kind, data);
        const control = this.formBuilder.control(values);
        this.kindControlsMap.set(kind, control);
        this.form.setControl(property, control);
        this.kindFieldOptionsMap.set(kind, options);
      }
    }
    this.form.setControl('notifications', notificationValues);

    // Payment
    if (!empty(data.userAccounts)) {
      this.singleAccount = data.userAccounts.length === 1;
      const accountControls: FormGroup = this.formBuilder.group({});
      for (const at of data.userAccounts) {
        const accountValue = (data.settings.userAccounts[this.ApiHelper.internalNameOrId(at)] || {});
        const notificationAmount = accountValue.paymentAmount || {};
        accountControls.setControl(at.id, this.formBuilder.group({
          paymentAmount: this.formBuilder.group({
            min: notificationAmount.min,
            max: notificationAmount.max,
          }),
        }));
      }
      this.form.setControl('userAccounts', accountControls);
    }
  }

  /**
   * Update controls related to internal field (master) when is enabled/disabled
   */
  private updateControls(typeForm: FormGroup) {
    if (typeForm.controls.internal.value) {
      if (typeForm.controls.sms) {
        typeForm.controls.sms.enable();
      }
      if (typeForm.controls.email) {
        typeForm.controls.email.enable();
      }
    } else {
      if (typeForm.controls.sms) {
        typeForm.controls.sms.disable();
      }
      if (typeForm.controls.email) {
        typeForm.controls.email.disable();
      }
    }
  }

  save() {
    const value = this.form.value;
    const request: Observable<string | void> = this.notificationSettingsService.saveNotificationSettings({ user: this.user, body: value });
    this.addSub(request.subscribe(() => {
      this.reload();
      this.notification.snackBar(this.i18n.notificationSettings.saved);
    }));
  }

  /**
   * Returns if there are any settings to edit (notifications / message categories)
   */
  protected hasSettings(data: NotificationSettingsDataForEdit) {
    return !empty(data.settings.notifications) &&
      (this.adminSettings ? !empty(data.messageCategories) : true);
  }

  /**
   * Resolves a section name (e.g Personal/Accounts/Marketplace/etc) for a given kind
   */
  protected resolveSection(kind: NotificationKind) {
    if (kind.startsWith('account')) {
      return this.i18n.notificationSettings.accounts;
    } else if (kind.startsWith('personal')) {
      return this.i18n.notificationSettings.personal;
    } else if (kind.startsWith('buyer')) {
      return this.i18n.notificationSettings.marketplaceAsBuyer;
    } else if (kind.startsWith('seller')) {
      return this.i18n.notificationSettings.marketplaceAsSeller;
    } else if (kind.startsWith('reference') || kind.startsWith('feedback')) {
      return this.i18n.notificationSettings.feedbackAndReferences;
    }
    return '';
  }

  resolveMenu() {
    return this.adminSettings || this.user === this.ApiHelper.SELF ?
      Menu.NOTIFICATIONS_SETTINGS : this.menu.searchUsersMenu();
  }

  /**
   * Resolves the according control in the form for the given kind
   */
  resolveControl(kind: NotificationKind): FormGroup {
    const controls = (this.form.controls.notifications as FormArray).controls;
    for (const control of controls) {
      const typeForm = control as FormGroup;
      if (typeForm.controls.kind.value === kind) {
        return typeForm;
      }
    }
    return null;
  }

  /**
   * Enables or disables all the notifications fields in the given section group
   */
  enableNotifications(section: string, enable: boolean) {
    for (const medium of this.notificationSections.get(section)) {
      const typeForm = this.resolveControl(medium.kind);
      typeForm.controls.internal.setValue(enable);
    }
  }

  /**
   * Returns an according label for every notification kind (admin / broker / user)
   */
  resolveNotificationLabel(notification: NotificationKindMediums) {
    switch (notification.kind) {
      case NotificationKind.ADMIN_AD_PENDING_AUTHORIZATION:
        return this.i18n.notification.admin.adPendingAuthorization;
      case NotificationKind.ADMIN_APPLICATION_ERROR:
        return this.i18n.notification.admin.applicationErrors;
      case NotificationKind.ADMIN_EXTERNAL_PAYMENT_EXPIRED:
        return this.i18n.notification.admin.externalPaymentExpired;
      case NotificationKind.ADMIN_EXTERNAL_PAYMENT_PERFORMED_FAILED:
        return this.i18n.notification.admin.externalPaymentPerformedFailed;
      case NotificationKind.ADMIN_GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
        return this.i18n.notification.admin.generatedVouchersAboutToExpire;
      case NotificationKind.ADMIN_GENERATED_VOUCHERS_EXPIRED:
        return this.i18n.notification.admin.generatedVouchersExpired;
      case NotificationKind.ADMIN_NETWORK_CREATED:
        return this.i18n.notification.admin.networkCreated;
      case NotificationKind.ADMIN_PAYMENT_AWAITING_AUTHORIZATION:
        return this.i18n.notification.admin.paymentAwaitingAuthorization;
      case NotificationKind.ADMIN_PAYMENT_PERFORMED:
        return this.i18n.notification.admin.paymentPerformed;
      case NotificationKind.ADMIN_SYSTEM_ALERT:
        return this.i18n.notification.admin.systemAlert;
      case NotificationKind.ADMIN_USER_ALERT:
        return this.i18n.notification.admin.userAlert;
      case NotificationKind.ADMIN_USER_IMPORT_REGISTRATION:
        return ''; // Not used
      case NotificationKind.ADMIN_USER_REGISTRATION:
        return this.i18n.notification.admin.userRegistration;
      case NotificationKind.ADMIN_VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        return this.i18n.notification.admin.voucherBuyingAboutToExpire;
      case NotificationKind.ACCOUNT_ALL_NON_SMS_PERFORMED_PAYMENTS:
        return this.i18n.notification.user.account.allNonSmsPerformedPayments;
      case NotificationKind.ACCOUNT_AUTHORIZED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.authorizedPaymentCanceled;
      case NotificationKind.ACCOUNT_AUTHORIZED_PAYMENT_DENIED:
        return this.i18n.notification.user.account.authorizedPaymentDenied;
      case NotificationKind.ACCOUNT_AUTHORIZED_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.authorizedPaymentExpired;
      case NotificationKind.ACCOUNT_AUTHORIZED_PAYMENT_SUCCEEDED:
        return this.i18n.notification.user.account.authorizedPaymentSucceeded;
      case NotificationKind.ACCOUNT_BOUGHT_VOUCHERS_ABOUT_TO_EXPIRE:
        return this.i18n.notification.user.account.boughtVouchersAboutToExpire;
      case NotificationKind.ACCOUNT_BOUGHT_VOUCHERS_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.boughtVouchersExpirationDateChanged;
      case NotificationKind.ACCOUNT_BOUGHT_VOUCHERS_EXPIRED:
        return this.i18n.notification.user.account.boughtVouchersExpired;
      case NotificationKind.ACCOUNT_EXTERNAL_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.externalPaymentExpired;
      case NotificationKind.ACCOUNT_EXTERNAL_PAYMENT_PERFORMED_FAILED:
        return this.i18n.notification.user.account.externalPaymentPerformedFailed;
      case NotificationKind.ACCOUNT_EXTERNAL_PAYMENT_RECEIVED_FAILED:
        return this.i18n.notification.user.account.externalPaymentReceivedFailed;
      case NotificationKind.ACCOUNT_INCOMING_RECURRING_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.incomingRecurringPaymentCanceled;
      case NotificationKind.ACCOUNT_INCOMING_RECURRING_PAYMENT_FAILED:
        return this.i18n.notification.user.account.incomingRecurringPaymentFailed;
      case NotificationKind.ACCOUNT_INCOMING_RECURRING_PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.incomingRecurringPaymentReceived;
      case NotificationKind.ACCOUNT_INCOMING_SCHEDULED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.incomingScheduledPaymentCanceled;
      case NotificationKind.ACCOUNT_INCOMING_SCHEDULED_PAYMENT_FAILED:
        return this.i18n.notification.user.account.incomingScheduledPaymentFailed;
      case NotificationKind.ACCOUNT_INCOMING_SCHEDULED_PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.incomingScheduledPaymentReceived;
      case NotificationKind.ACCOUNT_LIMIT_CHANGE:
        return this.i18n.notification.user.account.limitChange;
      case NotificationKind.ACCOUNT_OPERATOR_AUTHORIZED_PAYMENT_APPROVED_STILL_PENDING:
        return this.i18n.notification.user.account.operator.authorizedPaymentApprovedStillPending;
      case NotificationKind.ACCOUNT_OPERATOR_AUTHORIZED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.operator.authorizedPaymentCanceled;
      case NotificationKind.ACCOUNT_OPERATOR_AUTHORIZED_PAYMENT_DENIED:
        return this.i18n.notification.user.account.operator.authorizedPaymentDenied;
      case NotificationKind.ACCOUNT_OPERATOR_AUTHORIZED_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.operator.authorizedPaymentExpired;
      case NotificationKind.ACCOUNT_OPERATOR_AUTHORIZED_PAYMENT_SUCCEEDED:
        return this.i18n.notification.user.account.operator.authorizedPaymentSucceeded;
      case NotificationKind.ACCOUNT_OPERATOR_PAYMENT_AWAITING_AUTHORIZATION:
        return this.i18n.notification.user.account.operator.paymentAwaitingAuthorization;
      case NotificationKind.ACCOUNT_PAYMENT_AWAITING_AUTHORIZATION:
        return this.i18n.notification.user.account.paymentAwaitingAuthorization;
      case NotificationKind.ACCOUNT_PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.paymentReceived;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_CANCELED:
        return this.i18n.notification.user.account.paymentRequestCanceled;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_DENIED:
        return this.i18n.notification.user.account.paymentRequestDenied;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.paymentRequestExpirationDateChanged;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_EXPIRED:
        return this.i18n.notification.user.account.paymentRequestExpired;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_PROCESSED:
        return this.i18n.notification.user.account.paymentRequestProcessed;
      case NotificationKind.ACCOUNT_PAYMENT_REQUEST_RECEIVED:
        return this.i18n.notification.user.account.paymentRequestReceived;
      case NotificationKind.ACCOUNT_RECURRING_PAYMENT_FAILED:
        return this.i18n.notification.user.account.recurringPaymentFailed;
      case NotificationKind.ACCOUNT_RECURRING_PAYMENT_OCCURRENCE_PROCESSED:
        return this.i18n.notification.user.account.recurringPaymentOcurrenceProcessed;
      case NotificationKind.ACCOUNT_SCHEDULED_PAYMENT_FAILED:
        return this.i18n.notification.user.account.scheduledPaymentFailed;
      case NotificationKind.ACCOUNT_SCHEDULED_PAYMENT_INSTALLMENT_PROCESSED:
        return this.i18n.notification.user.account.scheduledPaymentInstallmentProcessed;
      case NotificationKind.ACCOUNT_SCHEDULED_PAYMENT_REQUEST_FAILED:
        return this.i18n.notification.user.account.scheduledPaymentRequestFailed;
      case NotificationKind.ACCOUNT_SENT_PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.sentPaymentRequestExpirationDateChanged;
      case NotificationKind.ACCOUNT_SMS_PERFORMED_PAYMENT:
        return this.i18n.notification.user.account.smsPerformedPayment;
      case NotificationKind.ACCOUNT_TICKET_WEBHOOK_FAILED:
        return this.i18n.notification.user.account.ticketWebhookFailed;
      case NotificationKind.BROKERING_AD_PENDING_AUTHORIZATION:
        return this.i18n.notification.user.brokering.adPendingAuthorization;
      case NotificationKind.BROKERING_MEMBER_ASSIGNED:
        return this.i18n.notification.user.brokering.memberAssigned;
      case NotificationKind.BROKERING_MEMBER_UNASSIGNED:
        return this.i18n.notification.user.brokering.memberUnassigned;
      case NotificationKind.BUYER_AD_INTEREST_NOTIFICATION:
        return this.i18n.notification.user.buyer.adInterestNotification;
      case NotificationKind.BUYER_AD_QUESTION_ANSWERED:
        return this.i18n.notification.user.buyer.adQuestionAnswered;
      case NotificationKind.BUYER_ORDER_CANCELED:
        return this.i18n.notification.user.buyer.orderCanceled;
      case NotificationKind.BUYER_ORDER_PAYMENT_CANCELED:
        return this.i18n.notification.user.buyer.orderPaymentCanceled;
      case NotificationKind.BUYER_ORDER_PAYMENT_DENIED:
        return this.i18n.notification.user.buyer.orderPaymentDenied;
      case NotificationKind.BUYER_ORDER_PAYMENT_EXPIRED:
        return this.i18n.notification.user.buyer.orderPaymentExpired;
      case NotificationKind.BUYER_ORDER_PENDING:
        return this.i18n.notification.user.buyer.orderPending;
      case NotificationKind.BUYER_ORDER_PENDING_AUTHORIZATION:
        return this.i18n.notification.user.buyer.orderPendingAuthorization;
      case NotificationKind.BUYER_ORDER_PENDING_DELIVERY_DATA:
        return this.i18n.notification.user.buyer.orderPendingDeliveryData;
      case NotificationKind.BUYER_ORDER_PROCESSED_BY_SELLER:
        return this.i18n.notification.user.buyer.orderProcessedBySeller;
      case NotificationKind.BUYER_ORDER_REJECTED_BY_SELLER:
        return this.i18n.notification.user.buyer.orderRejectedBySeller;
      case NotificationKind.BUYER_SALE_PENDING:
        return this.i18n.notification.user.buyer.buyerSalePending;
      case NotificationKind.BUYER_SALE_REJECTED_BY_SELLER:
        return this.i18n.notification.user.buyer.buyerSaleRejectedBySeller;
      case NotificationKind.FEEDBACK_CHANGED:
        return this.i18n.notification.user.feedback.changed;
      case NotificationKind.FEEDBACK_CREATED:
        return this.i18n.notification.user.feedback.created;
      case NotificationKind.FEEDBACK_EXPIRATION_REMINDER:
        return this.i18n.notification.user.feedback.expirationReminder;
      case NotificationKind.FEEDBACK_OPTIONAL:
        return this.i18n.notification.user.feedback.optional;
      case NotificationKind.FEEDBACK_REPLY_CREATED:
        return this.i18n.notification.user.feedback.replyCreated;
      case NotificationKind.FEEDBACK_REQUIRED:
        return this.i18n.notification.user.feedback.required;
      case NotificationKind.PERSONAL_BROKER_ASSIGNED:
        return this.i18n.notification.user.personal.brokerAssigned;
      case NotificationKind.PERSONAL_BROKER_UNASSIGNED:
        return this.i18n.notification.user.personal.brokerUnassigned;
      case NotificationKind.PERSONAL_MAX_SMS_PER_MONTH_REACHED:
        return this.i18n.notification.user.personal.maxSmsPerMonthReached;
      case NotificationKind.PERSONAL_NEW_TOKEN:
        const val = this.i18n.notification.user.personal.newToken;
        return val;
      case NotificationKind.PERSONAL_NEW_TOKEN_PENDING_ACTIVATION:
        return this.i18n.notification.user.personal.newTokenPendingActivation;
      case NotificationKind.PERSONAL_PASSWORD_STATUS_CHANGED:
        return this.i18n.notification.user.personal.passwordStatusChanged;
      case NotificationKind.PERSONAL_TOKEN_STATUS_CHANGED:
        return this.i18n.notification.user.personal.tokenStatusChanged;
      case NotificationKind.PERSONAL_USER_STATUS_CHANGED:
        return this.i18n.notification.user.personal.userStatusChanged;
      case NotificationKind.REFERENCE_CHANGED:
        return this.i18n.notification.user.reference.changed;
      case NotificationKind.REFERENCE_CREATED:
        return this.i18n.notification.user.reference.created;
      case NotificationKind.SELLER_AD_AUTHORIZED:
        return this.i18n.notification.user.seller.adAuthorized;
      case NotificationKind.SELLER_AD_EXPIRED:
        return this.i18n.notification.user.seller.adExpired;
      case NotificationKind.SELLER_AD_LOW_STOCK:
        return this.i18n.notification.user.seller.adLowStock;
      case NotificationKind.SELLER_AD_OUT_OF_STOCK:
        return this.i18n.notification.user.seller.adOutOfStock;
      case NotificationKind.SELLER_AD_QUESTION_CREATED:
        return this.i18n.notification.user.seller.adQuestionCreated;
      case NotificationKind.SELLER_AD_REJECTED:
        return this.i18n.notification.user.seller.adRejected;
      case NotificationKind.SELLER_ORDER_CANCELED:
        return this.i18n.notification.user.seller.orderCanceled;
      case NotificationKind.SELLER_ORDER_CREATED:
        return this.i18n.notification.user.seller.orderCreated;
      case NotificationKind.SELLER_ORDER_PAYMENT_CANCELED:
        return this.i18n.notification.user.seller.orderPaymentCanceled;
      case NotificationKind.SELLER_ORDER_PAYMENT_DENIED:
        return this.i18n.notification.user.seller.orderPaymentDenied;
      case NotificationKind.SELLER_ORDER_PAYMENT_EXPIRED:
        return this.i18n.notification.user.seller.orderPaymentExpired;
      case NotificationKind.SELLER_ORDER_PENDING_AUTHORIZATION:
        return this.i18n.notification.user.seller.orderPendingAuthorization;
      case NotificationKind.SELLER_ORDER_PENDING_DELIVERY_DATA:
        return this.i18n.notification.user.seller.orderPendingDeliveryData;
      case NotificationKind.SELLER_ORDER_PROCESSED_BY_BUYER:
        return this.i18n.notification.user.seller.orderProcessedByBuyer;
      case NotificationKind.SELLER_ORDER_REJECTED_BY_BUYER:
        return this.i18n.notification.user.seller.orderRejectedByBuyer;
      case NotificationKind.SELLER_SALE_PROCESSED_BY_BUYER:
        return this.i18n.notification.user.seller.saleProcessedByBuyer;
    }
    return '';
  }

  /**
   * Returns the list of field options, the values already set and the model property for the given kind.
   */
  resolveOptions(kind: NotificationKind, data: NotificationSettingsDataForEdit): [FieldOption[], string[], string] {
    let entities: InternalNamedEntity[];
    let values: string[];
    let alerts: SystemAlertTypeEnum[] | UserAlertTypeEnum[];
    let property: string;
    switch (kind) {
      case NotificationKind.ADMIN_EXTERNAL_PAYMENT_EXPIRED:
        entities = data.externalPayments;
        values = data.settings.externalPaymentsExpired;
        property = 'externalPaymentsExpired';
        break;
      case NotificationKind.ADMIN_EXTERNAL_PAYMENT_PERFORMED_FAILED:
        entities = data.externalPayments;
        values = data.settings.externalPaymentsFailed;
        property = 'externalPaymentsFailed';
        break;
      case NotificationKind.ADMIN_GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
      case NotificationKind.ADMIN_GENERATED_VOUCHERS_EXPIRED:
        entities = data.voucherConfigurations;
        values = data.settings.voucherConfigurations;
        property = 'voucherConfigurations';
        break;
      case NotificationKind.ADMIN_VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        entities = data.voucherConfigurations;
        values = data.settings.voucherConfigurationsBuying;
        property = 'voucherConfigurationsBuying';
        break;
      case NotificationKind.ADMIN_PAYMENT_AWAITING_AUTHORIZATION:
        entities = data.authorizablePayments;
        values = data.settings.authorizablePayments;
        property = 'authorizablePayments';
        break;
      case NotificationKind.ADMIN_PAYMENT_PERFORMED:
        entities = data.payments;
        values = data.settings.payments;
        property = 'payments';
        break;
      case NotificationKind.ADMIN_USER_REGISTRATION:
        entities = data.userGroups;
        values = data.settings.userGroups;
        property = 'userGroups';
        break;
      case NotificationKind.ADMIN_SYSTEM_ALERT:
        alerts = Object.values(SystemAlertTypeEnum) as SystemAlertTypeEnum[];
        values = data.settings.systemAlerts;
        property = 'systemAlert';
        break;
      case NotificationKind.ADMIN_USER_ALERT:
        alerts = Object.values(UserAlertTypeEnum) as UserAlertTypeEnum[];
        values = data.settings.userAlerts;
        property = 'userAlert';
        break;
    }

    let options: FieldOption[];
    if (entities) {
      options = entities.map(st => ({
        id: st.id,
        internalName: st.internalName,
        value: this.ApiHelper.internalNameOrId(st),
        text: st.name,
      }));
    } else if (alerts) {
      options = (alerts as []).map(st => ({
        value: st,
        text: this.resolveAlertLabel(st),
      }));
    }
    return [options, values, property];
  }

  /**
   * Returns an according label for user or system alert
   */
  private resolveAlertLabel(alert: SystemAlertTypeEnum | UserAlertTypeEnum) {
    switch (alert) {
      case SystemAlertTypeEnum.ACCOUNT_FEE_CHARGED_NO_FAILURES:
        return this.i18n.systemAlert.type.accountFeeChargedNoFailures;
      case SystemAlertTypeEnum.ACCOUNT_FEE_CHARGED_WITH_FAILURES:
        return this.i18n.systemAlert.type.accountFeeChargedWithFailures;
      case SystemAlertTypeEnum.APPLICATION_RESTARTED:
        return this.i18n.systemAlert.type.applicationRestarted;
      case SystemAlertTypeEnum.CUSTOM:
        return this.i18n.systemAlert.type.custom;
      case SystemAlertTypeEnum.MAX_GLOBAL_SMS_REACHED:
        return this.i18n.systemAlert.type.maxGlobalSmsReached;
      case SystemAlertTypeEnum.MAX_INCORRECT_LOGIN_ATTEMPTS:
        return this.i18n.systemAlert.type.maxIncorrectLoginAttempts;
      case UserAlertTypeEnum.CUSTOM:
        return this.i18n.userAlert.type.custom;
      case UserAlertTypeEnum.GIVEN_VERY_BAD_REFS:
        return this.i18n.userAlert.type.givenVeryBadRefs;
      case UserAlertTypeEnum.INSUFFICIENT_BALANCE_FOR_INITIAL_CREDIT:
        return this.i18n.userAlert.type.insufficientBalanceForInitialCredit;
      case UserAlertTypeEnum.MAX_DEVICE_ACTIVATION_ATTEMPTS_REACHED:
        return this.i18n.userAlert.type.maxDeviceActivationAttemptsReached;
      case UserAlertTypeEnum.MAX_DEVICE_CONFIRMATION_CHECK_ATTEMPTS_REACHED:
        return this.i18n.userAlert.type.maxDeviceConfirmationCheckAttemptsReached;
      case UserAlertTypeEnum.MAX_TOKEN_ACTIVATION_ATTEMPTS_REACHED:
        return this.i18n.userAlert.type.maxTokenActivationAttemptsReached;
      case UserAlertTypeEnum.MAX_USER_LOCALIZATION_ATTEMPTS_REACHED:
        return this.i18n.userAlert.type.maxUserLocalizationAttemptsReached;
      case UserAlertTypeEnum.MAX_VOUCHER_REDEEM_ATTEMPTS_REACHED:
        return this.i18n.userAlert.type.maxVoucherRedeemAttemptsReached;
      case UserAlertTypeEnum.MOVE_USER_AUTOMATICALLY_FAILED:
        return this.i18n.userAlert.type.moveUserAutomaticallyFailed;
      case UserAlertTypeEnum.PASSWORD_DISABLED_BY_TRIES:
        return this.i18n.userAlert.type.passwordDisabledByTries;
      case UserAlertTypeEnum.PASSWORD_TEMPORARILY_BLOCKED:
        return this.i18n.userAlert.type.passwordTemporarilyBlocked;
      case UserAlertTypeEnum.RECEIVED_VERY_BAD_REFS:
        return this.i18n.userAlert.type.receivedVeryBadRefs;
      case UserAlertTypeEnum.SCHEDULED_PAYMENT_FAILED:
        return this.i18n.userAlert.type.scheduledPaymentFailed;
    }
    return '';
  }
}
