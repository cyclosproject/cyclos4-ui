import { Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { AccountPermissions, DataForTransaction, IdentificationMethodEnum, PrincipalTypeKind, TransactionTypeData, TransferTypeWithCurrency, PerformPayment, PaymentPreview, TransactionView, PaymentError, PaymentErrorCode, ForbiddenError, ForbiddenErrorCode } from "app/api/models";
import { PaymentKind } from "app/banking/payments/payment-kind";
import { PaymentStep } from "app/banking/payments/payment-step";
import { IdMethod } from "app/banking/payments/id-method";
import { PaymentsService } from "app/api/services";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { ApiHelper } from "app/shared/api-helper";
import { ErrorStatus } from 'app/core/error-handler.service';
import { Menu } from 'app/shared/menu';


/**
 * Component used to choose which kind of payment will be performed
 */
@Component({
  selector: 'perform-payment',
  templateUrl: 'perform-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformPaymentComponent extends BaseBankingComponent {

  menu = Menu.PERFORM_PAYMENT;

  private _step: PaymentStep = PaymentStep.KIND;
  get step(): PaymentStep {
    return this._step;
  }
  set step(step: PaymentStep) {
    this._step = step;
    this.onStepChange();
  }

  // Data fetched initially
  initialData: BehaviorSubject<DataForTransaction> = new BehaviorSubject(null);  

  // Data for payment kind step
  kind: PaymentKind;
  allowedKinds: PaymentKind[];

  // Data for user identification method step
  idMethod: IdMethod;
  searchIdMethod: IdMethod;
  contactsIdMethod: IdMethod;
  allowedIdMethods: IdMethod[];

  // Data for user selection step
  user: string;

  // Data fetched when the payment destination is known
  paymentData = new BehaviorSubject<DataForTransaction>(null);  

  // Data for payment type step
  paymentType: TransferTypeWithCurrency;
  
  // Data for payment fields step
  payment: PerformPayment;
  paymentTypeData = new BehaviorSubject<TransactionTypeData>(null);
  
  // Data for preview
  preview = new BehaviorSubject<PaymentPreview>(null);
  confirmationPassword: string;

  // Data for done
  performed = new BehaviorSubject<TransactionView>(null);

  constructor(
    injector: Injector,
    private paymentsService: PaymentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.searchIdMethod = {
      internalName: IdentificationMethodEnum.AUTOCOMPLETE,
      name: this.bankingMessages.paymentIdMethodAutocomplete()
    };
    this.contactsIdMethod = {
      internalName: IdentificationMethodEnum.CONTACTS,
      name: this.bankingMessages.paymentIdMethodContact()
    }

    // Get data for perform payment
    this.paymentsService.dataForPerformPayment({ owner: ApiHelper.SELF })
      .then(response => {
        this.allowedIdMethods = [];
        let dp = response.data;
        if (dp.allowAutocomplete) {
          this.allowedIdMethods.push(this.searchIdMethod);
        }
        if (dp.allowContacts) {
          this.allowedIdMethods.push(this.contactsIdMethod);
        }
        var defaultPrincipalType = null;
        dp.principalTypes.forEach(pt => {
          if (pt.kind != PrincipalTypeKind.TOKEN || pt.allowManualInput) {
            // Only tokens with manual input are supported (no NFC tag / barcode scanning / etc)
            this.allowedIdMethods.push(pt);
            if (dp.defaultPrincipalType == pt.internalName) {
              defaultPrincipalType = pt;
            }
          }
        });

        // Set the default identification method
        switch (dp.defaultIdMethod) {
          case IdentificationMethodEnum.AUTOCOMPLETE:
            this.idMethod = this.searchIdMethod;
            break;
          case IdentificationMethodEnum.CONTACTS:
            this.idMethod = this.contactsIdMethod;
            break;
          case IdentificationMethodEnum.PRINCIPAL_TYPE:
            this.idMethod = defaultPrincipalType;
            break;
        }

        this.initialData.next(dp);

        this.initAllowedKinds();
        this.kind = this.allowedKinds[0];   
      });
  }

  private initAllowedKinds() {
    let payments = this.login.auth.permissions.banking.payments;

    this.allowedKinds = [];
    if (payments.user && (this.initialData.value.paymentTypes || []).length > 0) {
      this.allowedKinds.push('user');
    }
    if (payments.self) {
      this.allowedKinds.push('self');
    }
    if (payments.system) {
      this.allowedKinds.push('system');
    }
  }

  /**
   * Advances to the next step
   */
  next() {
    let allSteps = this.allSteps();
    let index = allSteps.indexOf(this.step);
    if (index < allSteps.length - 1) {
      this.step = allSteps[index + 1];
    }
  }

  /**
   * Indicates whether the button for the next step is enabled
   */
  get nextEnabled(): boolean {
    switch (this.step) {
      case PaymentStep.KIND:
        return this.kind != null;
      case PaymentStep.ID_METHOD:
        return this.idMethod != null;
      case PaymentStep.USER:
        return this.user != null && this.user.length > 0;
      case PaymentStep.FIELDS:
        // Check the amount is present
        if (!this.payment) return false;
        if (this.payment.amount == null) return false;
        let data = this.paymentTypeData.value;
        if (data) {
          // If description is required, check it is present
          if (data.requiresDescription && (this.payment.description || '').length == 0) {
            return false;
          }
          // Check that all required custom fields are present
          let customValues = this.payment.customValues || {};
          for (let cf of data.customFields) {
            if (cf.required && (customValues[cf.internalName] || '').length == 0) {
              return false;
            }
          }
        }
        return true;
    }
    return ![PaymentStep.PREVIEW, PaymentStep.DONE].includes(this.step);
  }

  /**
   * Go back to the previous step
   */
  previous() {
    let allSteps = this.allSteps();
    let index = allSteps.indexOf(this.step);
    if (index > 0) {
      this.step = allSteps[index - 1];
    }
  }

  /**
   * Resets the page to the first step
   */
  reset() {
    this.step = this.allSteps()[0];
  }

  /**
   * Performs the payment itself
   */
  performPayment() {
    this.paymentsService.performPayment({
      owner:ApiHelper.SELF,
      payment: this.payment,
      confirmationPassword: this.confirmationPassword,
      fields: ['id', 'authorizationStatus']
    })
    .then(response => {
      this.next();
      this.performed.next(response.data);
      this.detectChanges();
    })
    .catch(response => {
      if (response.status == ErrorStatus.FORBIDDEN) {
        this.confirmationPassword = null;
      }
    });
  }

  /**
   * Returns a list with all available steps
   */
  private allSteps(): PaymentStep[] {
    let allSteps = PaymentStep.values();
    if (this.kind != PaymentKind.USER) {
      // When not paying to a user, remove the id-method and user selection steps
      allSteps.splice(allSteps.indexOf(PaymentStep.ID_METHOD), 1);
      allSteps.splice(allSteps.indexOf(PaymentStep.USER), 1);
    }
    let paymentData = (this.paymentData.value || {});
    if ((paymentData.paymentTypes || []).length == 1) {
      // When there is a single possible payment type, skip this step
      allSteps.splice(allSteps.indexOf(PaymentStep.TYPE), 1);
    }
    return allSteps;
  }

  private fetchPaymentData(): Promise<DataForTransaction> {
    return this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.to
    })
    .then(response => {
      let result = response.data
      this.paymentData.next(result);
      return result;
    });
  }

  private get to(): string {
    switch (this.kind) {
      case PaymentKind.USER:
        return this.user;
      case PaymentKind.SYSTEM:
        return ApiHelper.SYSTEM;
      case PaymentKind.SELF:
        return ApiHelper.SELF;
    }
    return null;
  }

  private onStepChange() {
    switch (this._step) {
      case PaymentStep.ID_METHOD:
      case PaymentStep.USER:
        // When choosing again either the id method or user, clear the user and later data
        this.user = null;
        this.paymentData.next(null);
        break;
      case PaymentStep.TYPE:
        // Before choosing the payment type, fetch the payment data
        this.fetchPaymentData()
          .then(dataForPayment => {
            let length = (dataForPayment.paymentTypes || []).length;
            if (length == 0) {
              // No possible payment type: go to the previous step and show an error
              this.previous();
              this.notification.error(this.bankingMessages.paymentErrorNoPaymentType());
            } else if (length == 1) {
              // Single payment type: store it and advance to the next step
              this.paymentType = dataForPayment.paymentTypes[0];
              this.paymentTypeData.next(dataForPayment.paymentTypeData);
              this._step = PaymentStep.FIELDS;
              this.onStepChange();
            }
            this.paymentType = length == 0 ? null : dataForPayment.paymentTypes[0];
          });
        break;
      case PaymentStep.FIELDS:
        // Before showing the fields, make sure the paymentTypeData we have corresponds
        // to the selected payment type
        this.payment = {
          subject: this.to,
          type: this.paymentType.id,
          customValues: {}};
        if (this.paymentTypeData.value == null
          || this.paymentTypeData.value.id != this.paymentType.id) {
          // Either we don't have a paymentTypeData or it corresponds to another payment type
          if (this.paymentData.value.paymentTypeData.id == this.paymentType.id) {
            // The chosen payment type is the same one as we already have the data.
            // No need to fecth again.
            this.paymentTypeData.next(this.paymentData.value.paymentTypeData);
          } else {
            // We need to fetch the corresponding payment type data
            this.paymentsService.dataForPerformPayment({
              owner: ApiHelper.SELF, to: this.to, type: this.paymentType.id
            })
              .then(response => {
                this.paymentTypeData.next(response.data.paymentTypeData);
              });
          }
        }
        break;
      case PaymentStep.PREVIEW:
        this.paymentsService.previewPayment({
          owner:ApiHelper.SELF,
          payment: this.payment})
          .then(response => {
            this.preview.next(response.data);
          })
        break;
    }
  }
}
