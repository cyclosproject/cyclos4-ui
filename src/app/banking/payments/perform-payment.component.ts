import { Component, Injector, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import {
  DataForTransaction, IdentificationMethodEnum, PrincipalTypeKind, TransactionTypeData,
  TransferTypeWithCurrency, PaymentPreview, TransactionView, UserDataForSearch, User
} from 'app/api/models';
import { PaymentKind } from 'app/banking/payments/payment-kind';
import { IdMethod } from 'app/banking/payments/id-method';
import { PaymentsService, UsersService, ContactsService } from 'app/api/services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiHelper } from 'app/shared/api-helper';
import { ErrorStatus } from 'app/core/error-handler.service';
import { LinearStepperControlComponent } from 'app/shared/linear-stepper-control.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentKindAndIdMethod } from 'app/banking/payments/payment-kind-and-id-method';
import { TdStepComponent } from '@covalent/core';
import { cloneDeep } from 'lodash';
import { ApiInterceptor } from 'app/core/api.interceptor';

/**
 * Component used to choose which kind of payment will be performed
 */
@Component({
  selector: 'perform-payment',
  templateUrl: 'perform-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformPaymentComponent extends BaseBankingComponent {

  // Data fetched initially
  initialData = new BehaviorSubject<DataForTransaction>(null);

  // Data fetched when the payment destination is known
  paymentData = new BehaviorSubject<DataForTransaction>(null);

  @ViewChild('stepperControl')
  stepperControl: LinearStepperControlComponent;

  // Kind step
  @ViewChild('kindStep') kindStep: TdStepComponent;
  kindForm: FormGroup;
  searchIdMethod: IdMethod;
  contactsIdMethod: IdMethod;
  allowedKindAndIdMethods: PaymentKindAndIdMethod[];
  kindAndIdMethod = new BehaviorSubject<PaymentKindAndIdMethod>(null);

  // User step
  @ViewChild('userStep') userStep: TdStepComponent;
  userForm: FormGroup;
  userDataForSearch = new BehaviorSubject<UserDataForSearch>(null);
  contacts = new BehaviorSubject<User[]>([]);
  user = new BehaviorSubject<string>(null);
  toUser = new BehaviorSubject<User>(null);

  // Fields step
  @ViewChild('fieldsStep') fieldsStep: TdStepComponent;
  fieldsForm: FormGroup;
  preparingFieldsForm: boolean;
  paymentTypes = new BehaviorSubject<TransferTypeWithCurrency[]>([]);
  paymentTypeData = new BehaviorSubject<TransactionTypeData>(null);

  // Preview step
  @ViewChild('previewStep') previewStep: TdStepComponent;
  previewForm: FormGroup;
  preview = new BehaviorSubject<PaymentPreview>(null);

  // Done step
  @ViewChild('doneStep') doneStep: TdStepComponent;
  performed = new BehaviorSubject<TransactionView>(null);

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private paymentsService: PaymentsService,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private apiInterceptor: ApiInterceptor) {
    super(injector);

    // Form for payment kind
    this.kindForm = formBuilder.group({
      kindAndIdMethod: [null, Validators.required]
    });
    this.kindForm.valueChanges.subscribe(
      value => this.kindAndIdMethod.next(value.kindAndIdMethod));

    // Form for user
    this.userForm = formBuilder.group({
      user: [null, Validators.required]
    });
    this.userForm.valueChanges.subscribe(value => this.user.next(value.user));

    // Form for field (others are set on prepareFieldsForm())
    this.fieldsForm = formBuilder.group({
      type: [null, Validators.required],
      amount: [null, Validators.required]
    });
    // Changing the payment type should also fetch the payment type data
    this.fieldsForm.valueChanges.subscribe(values => {
      // Setting the form controls also triggers this,
      // and we don't want to re-fetch the data in this case
      if (this.preparingFieldsForm) {
        return;
      }

      if (values.type == null) {
        this.paymentTypeData.next(null);
      } else if (this.paymentTypeData.value == null
        || this.paymentTypeData.value == null
        || this.paymentTypeData.value.id !== values.type) {
        // The type has changed
        this.fetchPaymentTypeData();
      }
    });

    // Form for preview (dynamically set: confirmation password is optional)
    this.previewForm = formBuilder.group({});
  }

  ngOnInit() {
    super.ngOnInit();

    this.searchIdMethod = {
      internalName: IdentificationMethodEnum.AUTOCOMPLETE
    };
    this.contactsIdMethod = {
      internalName: IdentificationMethodEnum.CONTACTS
    };

    // Get data for perform payment
    this.paymentsService.dataForPerformPayment({ owner: ApiHelper.SELF })
      .subscribe(data => {
        this.initAllowedKinds(data);
        this.initialData.next(data);
        this.stepperControl.activate(this.kindStep);
      });
  }

  private initAllowedKinds(data: DataForTransaction) {
    const payments = this.login.auth.permissions.banking.payments;

    this.allowedKindAndIdMethods = [];
    let defaultKindAndIdMethod: PaymentKindAndIdMethod = null;

    // To user
    if (payments.user && (data.paymentTypes || []).length > 0) {
      // Search
      if (data.allowAutocomplete) {
        const kid = new PaymentKindAndIdMethod(
          this.bankingMessages.paymentKindAutocomplete(),
          PaymentKind.USER, this.searchIdMethod);
        this.allowedKindAndIdMethods.push(kid);
        if (data.defaultIdMethod === IdentificationMethodEnum.AUTOCOMPLETE) {
          defaultKindAndIdMethod = kid;
        }
      }
      // Contacts
      if (data.allowContacts) {
        const kid = new PaymentKindAndIdMethod(
          this.bankingMessages.paymentKindContact(),
          PaymentKind.USER, this.contactsIdMethod);
        this.allowedKindAndIdMethods.push(kid);
        if (data.defaultIdMethod === IdentificationMethodEnum.CONTACTS) {
          defaultKindAndIdMethod = kid;
        }
      }
      // Principal types
      data.principalTypes.forEach(pt => {
        if (pt.kind !== PrincipalTypeKind.TOKEN || pt.allowManualInput) {
          // Only tokens with manual input are supported (no NFC tag / barcode scanning / etc)
          const kid = new PaymentKindAndIdMethod(
            this.bankingMessages.paymentKindPrincipal((pt.name || '').toLowerCase()),
            PaymentKind.USER, pt);
          this.allowedKindAndIdMethods.push(kid);
          if (data.defaultPrincipalType === pt.internalName) {
            defaultKindAndIdMethod = kid;
          }
        }
      });
    }
    // Self payments
    if (payments.self) {
      const kid = new PaymentKindAndIdMethod(
        this.bankingMessages.paymentKindSelf(), PaymentKind.SELF);
      this.allowedKindAndIdMethods.push(kid);
      if (defaultKindAndIdMethod == null) {
        defaultKindAndIdMethod = kid;
      }
    }
    // System payments
    if (payments.system) {
      const kid = new PaymentKindAndIdMethod(
        this.bankingMessages.paymentKindSystem(), PaymentKind.SYSTEM);
      this.allowedKindAndIdMethods.push(kid);
      if (defaultKindAndIdMethod == null) {
        defaultKindAndIdMethod = kid;
      }
    }
    // Set the default identification method
    this.kindForm.patchValue({
      kindAndIdMethod: defaultKindAndIdMethod
    });
  }

  /** Fetch either the data for search of search the contact list */
  nextFromKind() {
    const kid = this.kindAndIdMethod.value;
    if (kid.kind === PaymentKind.USER) {
      // Still needs to select the user
      this.stepperControl.enable(this.userStep);
      this.fetchUserData();
    } else {
      // We can get the payment data directly
      this.stepperControl.disable(this.userStep);
      this.fetchPaymentData();
    }
  }

  previousFromUser() {
    this.stepperControl.activate(this.kindStep);
  }

  nextFromUser() {
    this.fetchPaymentData();
  }

  private fetchUserData() {
    const proceed = () => {
      this.stepperControl.activate(this.userStep);
    };
    const kid = this.kindAndIdMethod.value;
    const internalName = (kid.idMethod || {}).internalName;
    switch (internalName) {
      case IdentificationMethodEnum.AUTOCOMPLETE:
        if (this.userDataForSearch.value) {
          // Data was already fetched
          proceed();
        } else {
          // Fetch data for searching users
          this.usersService.getUserDataForSearch()
            .subscribe(data => {
              this.userDataForSearch.next(data);
              proceed();
            });
        }
        break;
      case IdentificationMethodEnum.CONTACTS:
        if (this.contacts.value.length > 0) {
          // Contacts were already fetched
          proceed();
        } else {
          // Retrieve the contact list
          this.contactsService.searchContacts({
            user: ApiHelper.SELF,
            pageSize: 9999,
            ignoreProfileFieldsInList: true
          })
            .subscribe(contacts => {
              this.contacts.next(contacts);
              if (contacts.length === 0) {
                this.notification.error(this.bankingMessages.paymentErrorNoContacts());
              } else {
                proceed();
              }
            });
        }
        break;
      default:
        // Nothing to pre-fetch. Just proceed
        proceed();
    }
  }

  private fetchPaymentData() {
    this.apiInterceptor.ignoreNextError();
    this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.to,
      type: this.paymentType
    })
      .subscribe(data => {
        this.paymentData.next(data);
        this.toUser.next(data.toUser);

        // If there is a single payment type, disable the type step
        const noPaymentTypes = data.paymentTypes.length === 0;
        this.paymentTypes.next(data.paymentTypes);

        if (noPaymentTypes) {
          this.notification.error(this.bankingMessages.paymentErrorNoPaymentType());
        } else {
          // Preselect the first payment type and activate the fields step
          this.fieldsForm.patchValue({ type: data.paymentTypes[0].id });
          this.prepareFieldsForm(data.paymentTypeData);
          this.stepperControl.activate(this.fieldsStep);
        }
      }, response => {
        const kid = this.kindAndIdMethod.value;
        const kind = kid.kind;
        if (kind === PaymentKind.USER && response.status === ErrorStatus.NOT_FOUND) {
          this.notification.error(this.bankingMessages.paymentErrorInvalidUser());
        } else {
          this.errorHandler.handleHttpError(response);
        }
      });
  }

  get to(): string {
    const kid = this.kindAndIdMethod.value;
    const kind = kid.kind;
    switch (kind) {
      case PaymentKind.USER:
        return this.user.value;
      case PaymentKind.SYSTEM:
        return ApiHelper.SYSTEM;
      case PaymentKind.SELF:
        return ApiHelper.SELF;
    }
    return null;
  }

  get paymentType(): string {
    return this.fieldsForm.value.type;
  }

  private fetchPaymentTypeData() {
    return this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.to,
      type: this.paymentType,
      fields: ['paymentTypeData']
    })
      .subscribe(data => {
        this.prepareFieldsForm(data.paymentTypeData);
      });
  }

  private prepareFieldsForm(data: TransactionTypeData) {
    this.preparingFieldsForm = true;
    this.fieldsForm.setControl('description',
      this.formBuilder.control(null, data.requiresDescription ? Validators.required : null));
    this.fieldsForm.setControl('customValues',
      ApiHelper.customValuesFormGroup(this.formBuilder, data.customFields));
    this.fieldsForm.patchValue({ type: data.id });
    if (data.fixedAmount) {
      this.fieldsForm.patchValue({ amount: data.fixedAmount });
      this.fieldsForm.controls.amount.disable();
    } else {
      this.fieldsForm.controls.amount.enable();
    }
    this.preparingFieldsForm = false;
    this.paymentTypeData.next(data);
  }

  previousFromFields() {
    if (this.kindAndIdMethod.value.kind === PaymentKind.USER) {
      // No type selection, but has to select the user
      this.stepperControl.activate(this.userStep);
    } else {
      // No type selection and no user - back to kind
      this.stepperControl.activate(this.kindStep);
    }
  }

  nextFromFields() {
    this.previewPayment();
  }

  private previewPayment() {
    // This includes all fields.
    const payment = cloneDeep(this.fieldsForm.value);
    payment.subject = this.to;
    payment.type = this.paymentType;

    // Preview the payment
    this.paymentsService.previewPayment({
      owner: ApiHelper.SELF,
      payment: payment
    })
      .subscribe(preview => {
        if (preview.confirmationPasswordInput) {
          // Require the confirmation password
          this.previewForm.setControl('confirmationPassword',
            this.formBuilder.control(null, Validators.required));
        } else if (this.previewForm.contains('confirmationPassword')) {
          // The confirmation password is no longer needed
          this.previewForm.removeControl('confirmationPassword');
        }
        this.preview.next(preview);
        this.stepperControl.activate(this.previewStep);
      });
  }

  previousFromPreview() {
    this.stepperControl.activate(this.fieldsStep);
  }

  nextFromPreview() {
    this.performPayment();
  }

  /**
   * Performs the payment itself
   */
  performPayment() {
    return this.paymentsService.performPayment({
      owner: ApiHelper.SELF,
      payment: this.preview.value.payment,
      confirmationPassword: this.previewForm.value.confirmationPassword,
      fields: ['id', 'authorizationStatus']
    })
      .subscribe(performed => {
        this.performed.next(performed);
        this.stepperControl.complete();
      }, error => {
        if (error.status === ErrorStatus.FORBIDDEN
          && this.preview.value.confirmationPasswordInput) {
          this.previewForm.setValue({
            confirmationPassword: null
          });
        }
      });
  }

  /** Returns the path components for the currently performed transaction details */
  get viewPerformedPath(): string[] {
    return ['/banking', 'transaction', ApiHelper.transactionNumberOrId(this.performed.value)];
  }

  newPayment() {
    // The kind is not cleared

    // Clear the user data
    this.userForm.reset();
    this.user.next(null);
    this.toUser.next(null);

    // Clear the fields data
    this.paymentTypes.next([]);
    this.paymentTypeData.next(null);
    this.fieldsForm.reset();

    // Clear the preview data
    this.previewForm.reset();
    this.preview.next(null);

    // Clear the done data
    this.performed.next(null);

    // Back to kind
    this.stepperControl.activate(this.kindStep);
  }
}
