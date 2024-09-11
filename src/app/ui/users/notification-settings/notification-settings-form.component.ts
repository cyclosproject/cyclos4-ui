import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  InternalNamedEntity,
  NotificationSettingsDataForEdit,
  NotificationTypeEnum,
  NotificationTypeMediums,
  RoleEnum,
  SystemAlertTypeEnum,
  UserAlertTypeEnum
} from 'app/api/models';
import { NotificationSettingsService } from 'app/api/services/notification-settings.service';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

@Component({
  selector: 'notification-settings-form',
  templateUrl: 'notification-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationSettingsFormComponent
  extends BasePageComponent<NotificationSettingsDataForEdit>
  implements OnInit
{
  user: string;
  adminSettings: boolean;
  singleAccount: boolean;
  form: FormGroup;
  notificationSections = new Map<string, NotificationTypeMediums[]>();
  typeControlsMap = new Map<NotificationTypeEnum, FormControl>();
  typeFieldOptionsMap = new Map<NotificationTypeEnum, FieldOption[]>();

  constructor(injector: Injector, private notificationSettingsService: NotificationSettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.user = this.route.snapshot.params.user;

    this.addSub(
      this.notificationSettingsService
        .getNotificationSettingsDataForEdit({ user: this.user })
        .subscribe(data => (this.data = data))
    );
  }

  onDataInitialized(data: NotificationSettingsDataForEdit) {
    this.adminSettings = data.role === RoleEnum.ADMINISTRATOR;
    this.form = this.formBuilder.group({
      version: data.settings.version
    });

    if (!data.smsAllowed) {
      data.settings.notifications = data.settings.notifications.filter(
        setting =>
          setting.type !== NotificationTypeEnum.SMS_PERFORMED_PAYMENT &&
          setting.type !== NotificationTypeEnum.MAX_SMS_PER_MONTH_REACHED
      );
    }

    if (this.adminSettings) {
      if (!this.hasSettings(data)) {
        // Display a notification when there aren't any admin settings to show
        this.notification.info(this.i18n.notificationSettings.notAvailableSettings);
        return;
      }

      // Add all notifications without section
      this.notificationSections.set('', data.settings.notifications);

      // Message categories
      this.form.addControl(
        'forwardMessageCategories',
        this.formBuilder.control(data.settings.forwardMessageCategories)
      );
    }

    // Forward to email
    if (data.forwardMessagesAllowed) {
      this.form.setControl('forwardMessages', this.formBuilder.control(data.settings.forwardMessages));
    }

    // Mailings
    if (data.emailMailingsAllowed) {
      this.form.setControl('emailMailings', this.formBuilder.control(data.settings.emailMailings));
    }
    if (data.appMailingsAllowed) {
      this.form.setControl('appMailings', this.formBuilder.control(data.settings.appMailings));
    }
    if (data.smsMailingsAllowed) {
      this.form.setControl('smsMailings', this.formBuilder.control(data.settings.smsMailings));
    }

    // Notifications
    const types = [];
    const notificationValues = this.formBuilder.array([]);
    for (const value of data.settings.notifications) {
      const typeForm = this.formBuilder.group({
        internal: value.internal,
        type: value.type,
        // Handle null (or undefined) to indicate which fields wont be added in the HTML component
        email: value.email === undefined ? null : value.email,
        sms: value.sms === undefined ? null : value.sms,
        app: value.app === undefined ? null : value.app
      });
      // Enable/disable email, sms and app controls based on internal field
      this.addSub(
        typeForm.controls.internal.valueChanges.subscribe(() => {
          this.updateControls(typeForm);
        })
      );
      this.updateControls(typeForm);
      notificationValues.push(typeForm);
      types.push(value.type);
      // Add user notifications grouped by sections
      if (!this.adminSettings) {
        const section = this.resolveSection(value.type);
        const values = this.notificationSections.get(section);
        if (values) {
          values.push(value);
        } else {
          this.notificationSections.set(section, [value]);
        }
      }
    }
    if (types.length > 0) {
      for (const type of types) {
        let options: FieldOption[];
        let values: string[];
        let property: string;
        [options, values, property] = this.resolveOptions(type, data);
        const control = this.formBuilder.control(values);
        this.typeControlsMap.set(type, control);
        this.form.setControl(property, control);
        this.typeFieldOptionsMap.set(type, options);
      }
    }
    this.form.setControl('notifications', notificationValues);

    // Payment
    if (!empty(data.userAccounts)) {
      this.singleAccount = data.userAccounts.length === 1;
      const accountControls: FormGroup = this.formBuilder.group({});
      for (const at of data.userAccounts) {
        const accountValue = data.settings.userAccounts[this.ApiHelper.internalNameOrId(at)] || {};
        const notificationAmount = accountValue.paymentAmount || {};
        accountControls.setControl(
          at.id,
          this.formBuilder.group({
            paymentAmount: this.formBuilder.group({
              min: notificationAmount.min,
              max: notificationAmount.max
            })
          })
        );
      }
      this.form.setControl('userAccounts', accountControls);
    }
  }

  /**
   * Update controls related to internal field (master) when is enabled/disabled
   */
  private updateControls(typeForm: FormGroup) {
    if (typeForm.controls.internal.value) {
      typeForm.controls.email?.enable();
      typeForm.controls.sms?.enable();
      typeForm.controls.app?.enable();
    } else {
      typeForm.controls.email?.disable();
      typeForm.controls.sms?.disable();
      typeForm.controls.app?.disable();
    }
  }

  save() {
    const value = this.form.value;
    const request: Observable<string | void> = this.notificationSettingsService.saveNotificationSettings({
      user: this.user,
      body: value
    });
    this.addSub(
      request.subscribe(() => {
        this.reload();
        this.notification.snackBar(this.i18n.notificationSettings.saved);
      })
    );
  }

  /**
   * Returns if there are any settings to edit (notifications / message categories)
   */
  protected hasSettings(data: NotificationSettingsDataForEdit) {
    return !empty(data.settings.notifications) && (this.adminSettings ? !empty(data.messageCategories) : true);
  }

  /**
   * Resolves a section name (e.g Personal/Accounts/Marketplace/etc) for a given type
   */
  protected resolveSection(type: NotificationTypeEnum) {
    switch (type) {
      case NotificationTypeEnum.ALL_NON_SMS_PERFORMED_PAYMENTS:
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_CANCELED:
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_DENIED:
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_EXPIRED:
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_SUCCEEDED:
      case NotificationTypeEnum.VOUCHER_ABOUT_TO_EXPIRE:
      case NotificationTypeEnum.VOUCHER_EXPIRATION_DATE_CHANGED:
      case NotificationTypeEnum.VOUCHER_EXPIRED:
      case NotificationTypeEnum.VOUCHER_PIN_BLOCKED:
      case NotificationTypeEnum.VOUCHER_TOP_UP:
      case NotificationTypeEnum.VOUCHER_REDEEM:
      case NotificationTypeEnum.VOUCHER_ASSIGNED:
      case NotificationTypeEnum.EXTERNAL_PAYMENT_EXPIRED:
      case NotificationTypeEnum.EXTERNAL_PAYMENT_PERFORMED_FAILED:
      case NotificationTypeEnum.EXTERNAL_PAYMENT_RECEIVED_FAILED:
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_CANCELED:
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_FAILED:
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_RECEIVED:
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_CANCELED:
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_FAILED:
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_RECEIVED:
      case NotificationTypeEnum.LIMIT_CHANGE:
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_APPROVED_STILL_PENDING:
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_CANCELED:
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_DENIED:
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_EXPIRED:
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_SUCCEEDED:
      case NotificationTypeEnum.OPERATOR_PAYMENT_AWAITING_AUTHORIZATION:
      case NotificationTypeEnum.PAYMENT_AWAITING_AUTHORIZATION:
      case NotificationTypeEnum.PAYMENT_PERFORMED_CHARGED_BACK:
      case NotificationTypeEnum.PAYMENT_RECEIVED_CHARGED_BACK:
      case NotificationTypeEnum.PAYMENT_RECEIVED:
      case NotificationTypeEnum.PAYMENT_REQUEST_CANCELED:
      case NotificationTypeEnum.PAYMENT_REQUEST_DENIED:
      case NotificationTypeEnum.PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
      case NotificationTypeEnum.PAYMENT_REQUEST_EXPIRED:
      case NotificationTypeEnum.PAYMENT_REQUEST_PROCESSED:
      case NotificationTypeEnum.PAYMENT_REQUEST_RECEIVED:
      case NotificationTypeEnum.RECURRING_PAYMENT_FAILED:
      case NotificationTypeEnum.RECURRING_PAYMENT_OCCURRENCE_PROCESSED:
      case NotificationTypeEnum.SCHEDULED_PAYMENT_FAILED:
      case NotificationTypeEnum.SCHEDULED_PAYMENT_INSTALLMENT_PROCESSED:
      case NotificationTypeEnum.SCHEDULED_PAYMENT_REQUEST_FAILED:
      case NotificationTypeEnum.SENT_PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
      case NotificationTypeEnum.SMS_PERFORMED_PAYMENT:
      case NotificationTypeEnum.TICKET_WEBHOOK_FAILED:
        return this.i18n.notificationSettings.accounts;
      case NotificationTypeEnum.AD_INTEREST_NOTIFICATION:
      case NotificationTypeEnum.AD_QUESTION_ANSWERED:
      case NotificationTypeEnum.ORDER_CANCELED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_CANCELED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_DENIED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_EXPIRED_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_AUTHORIZATION_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_DELIVERY_DATA_BUYER:
      case NotificationTypeEnum.ORDER_REALIZED_SELLER:
      case NotificationTypeEnum.ORDER_REJECTED_BY_SELLER:
      case NotificationTypeEnum.SALE_PENDING_BUYER:
      case NotificationTypeEnum.SALE_REJECTED_SELLER:
        return this.i18n.notificationSettings.marketplaceAsBuyer;
      case NotificationTypeEnum.BROKER_ASSIGNED:
      case NotificationTypeEnum.BROKER_UNASSIGNED:
      case NotificationTypeEnum.MAX_SMS_PER_MONTH_REACHED:
      case NotificationTypeEnum.NEW_TOKEN:
      case NotificationTypeEnum.NEW_TOKEN_PENDING_ACTIVATION:
      case NotificationTypeEnum.PASSWORD_STATUS_CHANGED:
      case NotificationTypeEnum.TOKEN_STATUS_CHANGED:
      case NotificationTypeEnum.USER_STATUS_CHANGED:
        return this.i18n.notificationSettings.personal;
      case NotificationTypeEnum.FEEDBACK_CHANGED:
      case NotificationTypeEnum.FEEDBACK_CREATED:
      case NotificationTypeEnum.FEEDBACK_EXPIRATION_REMINDER:
      case NotificationTypeEnum.FEEDBACK_OPTIONAL:
      case NotificationTypeEnum.FEEDBACK_REPLY_CREATED:
      case NotificationTypeEnum.FEEDBACK_REQUIRED:
      case NotificationTypeEnum.REFERENCE_CHANGED:
      case NotificationTypeEnum.REFERENCE_CREATED:
        return this.i18n.notificationSettings.feedbackAndReferences;
      case NotificationTypeEnum.AD_AUTHORIZED:
      case NotificationTypeEnum.AD_EXPIRED:
      case NotificationTypeEnum.LOW_STOCK_QUANTITY:
      case NotificationTypeEnum.ARTICLE_OUT_OF_STOCK:
      case NotificationTypeEnum.AD_QUESTION_CREATED:
      case NotificationTypeEnum.AD_REJECTED:
      case NotificationTypeEnum.ORDER_CANCELED_SELLER:
      case NotificationTypeEnum.ORDER_CREATED:
      case NotificationTypeEnum.ORDER_PAYMENT_CANCELED_SELLER:
      case NotificationTypeEnum.ORDER_PAYMENT_DENIED_SELLER:
      case NotificationTypeEnum.ORDER_PAYMENT_EXPIRED_SELLER:
      case NotificationTypeEnum.ORDER_PENDING_AUTHORIZATION_SELLER:
      case NotificationTypeEnum.ORDER_PENDING_DELIVERY_DATA_SELLER:
      case NotificationTypeEnum.ORDER_REALIZED_BUYER:
      case NotificationTypeEnum.ORDER_REJECTED_BY_BUYER:
      case NotificationTypeEnum.SALE_REALIZED_BUYER:
        return this.i18n.notificationSettings.marketplaceAsSeller;
      case NotificationTypeEnum.AD_PENDING_AUTHORIZATION:
      case NotificationTypeEnum.MEMBER_ASSIGNED:
      case NotificationTypeEnum.MEMBER_UNASSIGNED:
        return this.i18n.notificationSettings.brokering;
      case NotificationTypeEnum.AD_PENDING_BY_ADMIN_AUTHORIZATION:
      case NotificationTypeEnum.APPLICATION_ERROR:
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_EXPIRED:
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_PERFORMED_FAILED:
      case NotificationTypeEnum.GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
      case NotificationTypeEnum.GENERATED_VOUCHERS_EXPIRED:
      case NotificationTypeEnum.NETWORK_CREATED:
      case NotificationTypeEnum.PAYMENT_AWAITING_ADMIN_AUTHORIZATION:
      case NotificationTypeEnum.PAYMENT_PERFORMED:
      case NotificationTypeEnum.SYSTEM_ALERT:
      case NotificationTypeEnum.USER_ALERT:
      case NotificationTypeEnum.USER_IMPORT:
      case NotificationTypeEnum.USER_REGISTRATION:
      case NotificationTypeEnum.VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        return '';
    }

    return '';
  }

  resolveMenu() {
    return this.adminSettings || this.user === this.ApiHelper.SELF ? Menu.NOTIFICATIONS : this.menu.searchUsersMenu();
  }

  /**
   * Resolves the according control in the form for the given type
   */
  resolveControl(type: NotificationTypeEnum): FormGroup {
    const controls = (this.form.controls.notifications as FormArray).controls;
    for (const control of controls) {
      const typeForm = control as FormGroup;
      if (typeForm.controls.type.value === type) {
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
      const typeForm = this.resolveControl(medium.type);
      typeForm.controls.internal.setValue(enable);
    }
  }

  /**
   * Returns an according label for every notification type (admin / broker / user)
   */
  resolveNotificationLabel(notification: NotificationTypeMediums) {
    switch (notification.type) {
      case NotificationTypeEnum.AD_PENDING_BY_ADMIN_AUTHORIZATION:
        return this.i18n.notification.admin.adPendingAuthorization;
      case NotificationTypeEnum.APPLICATION_ERROR:
        return this.i18n.notification.admin.applicationErrors;
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_EXPIRED:
        return this.i18n.notification.admin.externalPaymentExpired;
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_PERFORMED_FAILED:
        return this.i18n.notification.admin.externalPaymentPerformedFailed;
      case NotificationTypeEnum.GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
        return this.i18n.notification.admin.generatedVouchersAboutToExpire;
      case NotificationTypeEnum.GENERATED_VOUCHERS_EXPIRED:
        return this.i18n.notification.admin.generatedVouchersExpired;
      case NotificationTypeEnum.NETWORK_CREATED:
        return this.i18n.notification.admin.networkCreated;
      case NotificationTypeEnum.PAYMENT_AWAITING_ADMIN_AUTHORIZATION:
        return this.i18n.notification.admin.paymentAwaitingAuthorization;
      case NotificationTypeEnum.PAYMENT_PERFORMED:
        return this.i18n.notification.admin.paymentPerformed;
      case NotificationTypeEnum.SYSTEM_ALERT:
        return this.i18n.notification.admin.systemAlert;
      case NotificationTypeEnum.USER_ALERT:
        return this.i18n.notification.admin.userAlert;
      case NotificationTypeEnum.USER_IMPORT:
        return ''; // Not used
      case NotificationTypeEnum.USER_REGISTRATION:
        return this.i18n.notification.admin.userRegistration;
      case NotificationTypeEnum.VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        return this.i18n.notification.admin.voucherBuyingAboutToExpire;
      case NotificationTypeEnum.ALL_NON_SMS_PERFORMED_PAYMENTS:
        return this.i18n.notification.user.account.allNonSmsPerformedPayments;
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.authorizedPaymentCanceled;
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_DENIED:
        return this.i18n.notification.user.account.authorizedPaymentDenied;
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.authorizedPaymentExpired;
      case NotificationTypeEnum.AUTHORIZED_PAYMENT_SUCCEEDED:
        return this.i18n.notification.user.account.authorizedPaymentSucceeded;
      case NotificationTypeEnum.VOUCHER_ABOUT_TO_EXPIRE:
        return this.i18n.notification.user.account.voucherAboutToExpire;
      case NotificationTypeEnum.VOUCHER_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.voucherExpirationDateChanged;
      case NotificationTypeEnum.VOUCHER_EXPIRED:
        return this.i18n.notification.user.account.voucherExpired;
      case NotificationTypeEnum.VOUCHER_PIN_BLOCKED:
        return this.i18n.notification.user.account.voucherPinBlocked;
      case NotificationTypeEnum.VOUCHER_TOP_UP:
        return this.i18n.notification.user.account.voucherTopUp;
      case NotificationTypeEnum.VOUCHER_REDEEM:
        return this.i18n.notification.user.account.voucherRedeem;
      case NotificationTypeEnum.EXTERNAL_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.externalPaymentExpired;
      case NotificationTypeEnum.EXTERNAL_PAYMENT_PERFORMED_FAILED:
        return this.i18n.notification.user.account.externalPaymentPerformedFailed;
      case NotificationTypeEnum.EXTERNAL_PAYMENT_RECEIVED_FAILED:
        return this.i18n.notification.user.account.externalPaymentReceivedFailed;
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.incomingRecurringPaymentCanceled;
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_FAILED:
        return this.i18n.notification.user.account.incomingRecurringPaymentFailed;
      case NotificationTypeEnum.INCOMING_RECURRING_PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.incomingRecurringPaymentReceived;
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.incomingScheduledPaymentCanceled;
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_FAILED:
        return this.i18n.notification.user.account.incomingScheduledPaymentFailed;
      case NotificationTypeEnum.INCOMING_SCHEDULED_PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.incomingScheduledPaymentReceived;
      case NotificationTypeEnum.LIMIT_CHANGE:
        return this.i18n.notification.user.account.limitChange;
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_APPROVED_STILL_PENDING:
        return this.i18n.notification.user.account.operator.authorizedPaymentApprovedStillPending;
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_CANCELED:
        return this.i18n.notification.user.account.operator.authorizedPaymentCanceled;
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_DENIED:
        return this.i18n.notification.user.account.operator.authorizedPaymentDenied;
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_EXPIRED:
        return this.i18n.notification.user.account.operator.authorizedPaymentExpired;
      case NotificationTypeEnum.OPERATOR_AUTHORIZED_PAYMENT_SUCCEEDED:
        return this.i18n.notification.user.account.operator.authorizedPaymentSucceeded;
      case NotificationTypeEnum.OPERATOR_PAYMENT_AWAITING_AUTHORIZATION:
        return this.i18n.notification.user.account.operator.paymentAwaitingAuthorization;
      case NotificationTypeEnum.PAYMENT_AWAITING_AUTHORIZATION:
        return this.i18n.notification.user.account.paymentAwaitingAuthorization;
      case NotificationTypeEnum.PAYMENT_PERFORMED_CHARGED_BACK:
        return this.i18n.notification.user.account.paymentPerformedChargedBack;
      case NotificationTypeEnum.PAYMENT_RECEIVED_CHARGED_BACK:
        return this.i18n.notification.user.account.paymentReceivedChargedBack;
      case NotificationTypeEnum.PAYMENT_RECEIVED:
        return this.i18n.notification.user.account.paymentReceived;
      case NotificationTypeEnum.PAYMENT_REQUEST_CANCELED:
        return this.i18n.notification.user.account.paymentRequestCanceled;
      case NotificationTypeEnum.PAYMENT_REQUEST_DENIED:
        return this.i18n.notification.user.account.paymentRequestDenied;
      case NotificationTypeEnum.PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.paymentRequestExpirationDateChanged;
      case NotificationTypeEnum.PAYMENT_REQUEST_EXPIRED:
        return this.i18n.notification.user.account.paymentRequestExpired;
      case NotificationTypeEnum.PAYMENT_REQUEST_PROCESSED:
        return this.i18n.notification.user.account.paymentRequestProcessed;
      case NotificationTypeEnum.PAYMENT_REQUEST_RECEIVED:
        return this.i18n.notification.user.account.paymentRequestReceived;
      case NotificationTypeEnum.RECURRING_PAYMENT_FAILED:
        return this.i18n.notification.user.account.recurringPaymentFailed;
      case NotificationTypeEnum.RECURRING_PAYMENT_OCCURRENCE_PROCESSED:
        return this.i18n.notification.user.account.recurringPaymentOcurrenceProcessed;
      case NotificationTypeEnum.SCHEDULED_PAYMENT_FAILED:
        return this.i18n.notification.user.account.scheduledPaymentFailed;
      case NotificationTypeEnum.SCHEDULED_PAYMENT_INSTALLMENT_PROCESSED:
        return this.i18n.notification.user.account.scheduledPaymentInstallmentProcessed;
      case NotificationTypeEnum.SCHEDULED_PAYMENT_REQUEST_FAILED:
        return this.i18n.notification.user.account.scheduledPaymentRequestFailed;
      case NotificationTypeEnum.SENT_PAYMENT_REQUEST_EXPIRATION_DATE_CHANGED:
        return this.i18n.notification.user.account.sentPaymentRequestExpirationDateChanged;
      case NotificationTypeEnum.SMS_PERFORMED_PAYMENT:
        return this.i18n.notification.user.account.smsPerformedPayment;
      case NotificationTypeEnum.TICKET_WEBHOOK_FAILED:
        return this.i18n.notification.user.account.ticketWebhookFailed;
      case NotificationTypeEnum.AD_PENDING_AUTHORIZATION:
        return this.i18n.notification.user.brokering.adPendingAuthorization;
      case NotificationTypeEnum.MEMBER_ASSIGNED:
        return this.i18n.notification.user.brokering.memberAssigned;
      case NotificationTypeEnum.MEMBER_UNASSIGNED:
        return this.i18n.notification.user.brokering.memberUnassigned;
      case NotificationTypeEnum.AD_INTEREST_NOTIFICATION:
        return this.i18n.notification.user.buyer.adInterestNotification;
      case NotificationTypeEnum.AD_QUESTION_ANSWERED:
        return this.i18n.notification.user.buyer.adQuestionAnswered;
      case NotificationTypeEnum.ORDER_CANCELED_BUYER:
        return this.i18n.notification.user.buyer.orderCanceled;
      case NotificationTypeEnum.ORDER_PAYMENT_CANCELED_BUYER:
        return this.i18n.notification.user.buyer.orderPaymentCanceled;
      case NotificationTypeEnum.ORDER_PAYMENT_DENIED_BUYER:
        return this.i18n.notification.user.buyer.orderPaymentDenied;
      case NotificationTypeEnum.ORDER_PAYMENT_EXPIRED_BUYER:
        return this.i18n.notification.user.buyer.orderPaymentExpired;
      case NotificationTypeEnum.ORDER_PENDING_BUYER:
        return this.i18n.notification.user.buyer.orderPending;
      case NotificationTypeEnum.ORDER_PENDING_AUTHORIZATION_BUYER:
        return this.i18n.notification.user.buyer.orderPendingAuthorization;
      case NotificationTypeEnum.ORDER_PENDING_DELIVERY_DATA_BUYER:
        return this.i18n.notification.user.buyer.orderPendingDeliveryData;
      case NotificationTypeEnum.ORDER_REALIZED_SELLER:
        return this.i18n.notification.user.buyer.orderProcessedBySeller;
      case NotificationTypeEnum.ORDER_REJECTED_BY_SELLER:
        return this.i18n.notification.user.buyer.orderRejectedBySeller;
      case NotificationTypeEnum.SALE_PENDING_BUYER:
        return this.i18n.notification.user.buyer.buyerSalePending;
      case NotificationTypeEnum.SALE_REJECTED_SELLER:
        return this.i18n.notification.user.buyer.buyerSaleRejectedBySeller;
      case NotificationTypeEnum.FEEDBACK_CHANGED:
        return this.i18n.notification.user.feedback.changed;
      case NotificationTypeEnum.FEEDBACK_CREATED:
        return this.i18n.notification.user.feedback.created;
      case NotificationTypeEnum.FEEDBACK_EXPIRATION_REMINDER:
        return this.i18n.notification.user.feedback.expirationReminder;
      case NotificationTypeEnum.FEEDBACK_OPTIONAL:
        return this.i18n.notification.user.feedback.optional;
      case NotificationTypeEnum.FEEDBACK_REPLY_CREATED:
        return this.i18n.notification.user.feedback.replyCreated;
      case NotificationTypeEnum.FEEDBACK_REQUIRED:
        return this.i18n.notification.user.feedback.required;
      case NotificationTypeEnum.BROKER_ASSIGNED:
        return this.i18n.notification.user.personal.brokerAssigned;
      case NotificationTypeEnum.BROKER_UNASSIGNED:
        return this.i18n.notification.user.personal.brokerUnassigned;
      case NotificationTypeEnum.MAX_SMS_PER_MONTH_REACHED:
        return this.i18n.notification.user.personal.maxSmsPerMonthReached;
      case NotificationTypeEnum.NEW_TOKEN:
        return this.i18n.notification.user.personal.newToken;
      case NotificationTypeEnum.NEW_TOKEN_PENDING_ACTIVATION:
        return this.i18n.notification.user.personal.newTokenPendingActivation;
      case NotificationTypeEnum.PASSWORD_STATUS_CHANGED:
        return this.i18n.notification.user.personal.passwordStatusChanged;
      case NotificationTypeEnum.TOKEN_STATUS_CHANGED:
        return this.i18n.notification.user.personal.tokenStatusChanged;
      case NotificationTypeEnum.USER_STATUS_CHANGED:
        return this.i18n.notification.user.personal.userStatusChanged;
      case NotificationTypeEnum.REFERENCE_CHANGED:
        return this.i18n.notification.user.reference.changed;
      case NotificationTypeEnum.REFERENCE_CREATED:
        return this.i18n.notification.user.reference.created;
      case NotificationTypeEnum.AD_AUTHORIZED:
        return this.i18n.notification.user.seller.adAuthorized;
      case NotificationTypeEnum.AD_EXPIRED:
        return this.i18n.notification.user.seller.adExpired;
      case NotificationTypeEnum.LOW_STOCK_QUANTITY:
        return this.i18n.notification.user.seller.adLowStock;
      case NotificationTypeEnum.ARTICLE_OUT_OF_STOCK:
        return this.i18n.notification.user.seller.adOutOfStock;
      case NotificationTypeEnum.AD_QUESTION_CREATED:
        return this.i18n.notification.user.seller.adQuestionCreated;
      case NotificationTypeEnum.AD_REJECTED:
        return this.i18n.notification.user.seller.adRejected;
      case NotificationTypeEnum.ORDER_CANCELED_SELLER:
        return this.i18n.notification.user.seller.orderCanceled;
      case NotificationTypeEnum.ORDER_CREATED:
        return this.i18n.notification.user.seller.orderCreated;
      case NotificationTypeEnum.ORDER_PAYMENT_CANCELED_SELLER:
        return this.i18n.notification.user.seller.orderPaymentCanceled;
      case NotificationTypeEnum.ORDER_PAYMENT_DENIED_SELLER:
        return this.i18n.notification.user.seller.orderPaymentDenied;
      case NotificationTypeEnum.ORDER_PAYMENT_EXPIRED_SELLER:
        return this.i18n.notification.user.seller.orderPaymentExpired;
      case NotificationTypeEnum.ORDER_PENDING_AUTHORIZATION_SELLER:
        return this.i18n.notification.user.seller.orderPendingAuthorization;
      case NotificationTypeEnum.ORDER_PENDING_DELIVERY_DATA_SELLER:
        return this.i18n.notification.user.seller.orderPendingDeliveryData;
      case NotificationTypeEnum.ORDER_REALIZED_BUYER:
        return this.i18n.notification.user.seller.orderProcessedByBuyer;
      case NotificationTypeEnum.ORDER_REJECTED_BY_BUYER:
        return this.i18n.notification.user.seller.orderRejectedByBuyer;
      case NotificationTypeEnum.SALE_REALIZED_BUYER:
        return this.i18n.notification.user.seller.saleProcessedByBuyer;
    }
    return '';
  }

  /**
   * Returns the list of field options, the values already set and the model property for the given type.
   */
  resolveOptions(type: NotificationTypeEnum, data: NotificationSettingsDataForEdit): [FieldOption[], string[], string] {
    let entities: InternalNamedEntity[];
    let values: string[];
    let alerts: SystemAlertTypeEnum[] | UserAlertTypeEnum[];
    let property: string;
    switch (type) {
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_EXPIRED:
        entities = data.externalPayments;
        values = data.settings.externalPaymentsExpired;
        property = 'externalPaymentsExpired';
        break;
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_PERFORMED_FAILED:
        entities = data.externalPayments;
        values = data.settings.externalPaymentsFailed;
        property = 'externalPaymentsFailed';
        break;
      case NotificationTypeEnum.GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
      case NotificationTypeEnum.GENERATED_VOUCHERS_EXPIRED:
        entities = data.voucherConfigurations;
        values = data.settings.voucherConfigurations;
        property = 'voucherConfigurations';
        break;
      case NotificationTypeEnum.VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        entities = data.voucherConfigurations;
        values = data.settings.voucherConfigurationsBuying;
        property = 'voucherConfigurationsBuying';
        break;
      case NotificationTypeEnum.PAYMENT_AWAITING_ADMIN_AUTHORIZATION:
        entities = data.authorizablePayments;
        values = data.settings.authorizablePayments;
        property = 'authorizablePayments';
        break;
      case NotificationTypeEnum.PAYMENT_PERFORMED:
        entities = data.payments;
        values = data.settings.payments;
        property = 'payments';
        break;
      case NotificationTypeEnum.USER_REGISTRATION:
        entities = data.userGroups;
        values = data.settings.userGroups;
        property = 'userGroups';
        break;
      case NotificationTypeEnum.SYSTEM_ALERT:
        alerts = Object.values(SystemAlertTypeEnum) as SystemAlertTypeEnum[];
        values = data.settings.systemAlerts;
        property = 'systemAlert';
        break;
      case NotificationTypeEnum.USER_ALERT:
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
        text: st.name
      }));
    } else if (alerts) {
      options = (alerts as []).map(st => ({
        value: st,
        text: this.resolveAlertLabel(st)
      }));
    }
    return [options, values, property];
  }

  /**
   * Returns an according label for user or system alert
   */
  private resolveAlertLabel(alert: SystemAlertTypeEnum | UserAlertTypeEnum) {
    switch (alert) {
      case SystemAlertTypeEnum.ACCOUNT_BALANCE_FIXED:
        return this.i18n.systemAlert.type.accountBalanceFixed;
      case SystemAlertTypeEnum.ACCOUNT_FEE_CHARGED_NO_FAILURES:
        return this.i18n.systemAlert.type.accountFeeChargedNoFailures;
      case SystemAlertTypeEnum.ACCOUNT_FEE_CHARGED_WITH_FAILURES:
        return this.i18n.systemAlert.type.accountFeeChargedWithFailures;
      case SystemAlertTypeEnum.APPLICATION_RESTARTED:
        return this.i18n.systemAlert.type.applicationRestarted;
      case SystemAlertTypeEnum.CUSTOM:
        return this.i18n.systemAlert.type.custom;
      case SystemAlertTypeEnum.CUSTOM_TRANSLATIONS_INVALIDATED:
        return this.i18n.systemAlert.type.customTranslationsInvalidated;
      case SystemAlertTypeEnum.EMAIL_SENDING_FAILED:
        return this.i18n.systemAlert.type.emailSendingFailed;
      case SystemAlertTypeEnum.INCONSISTENT_DB_SCHEMA:
        return this.i18n.systemAlert.type.inconsistentDbSchema;
      case SystemAlertTypeEnum.MAX_BLOCKED_USERS_REACHED:
        return this.i18n.systemAlert.type.maxBlockedUsersReached;
      case SystemAlertTypeEnum.MAX_GLOBAL_SMS_REACHED:
        return this.i18n.systemAlert.type.maxGlobalSmsReached;
      case SystemAlertTypeEnum.MAX_INCORRECT_LOGIN_ATTEMPTS:
        return this.i18n.systemAlert.type.maxIncorrectLoginAttempts;
      case SystemAlertTypeEnum.SMS_SENDING_FAILED:
        return this.i18n.systemAlert.type.smsSendingFailed;

      case UserAlertTypeEnum.CUSTOM:
        return this.i18n.userAlert.type.custom;
      case UserAlertTypeEnum.GIVEN_VERY_BAD_REFS:
        return this.i18n.userAlert.type.givenVeryBadRefs;
      case UserAlertTypeEnum.INCONSISTENT_BALANCE_BELOW_LIMIT:
        return this.i18n.userAlert.type.inconsistentBalanceBelowLimit;
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

      case UserAlertTypeEnum.SCHEDULED_PAYMENT_FAILED:
        return this.i18n.userAlert.type.scheduledPaymentFailed;
    }
    return '';
  }
}
