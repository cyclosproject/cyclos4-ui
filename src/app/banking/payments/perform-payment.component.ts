import { Component, Injector, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { AccountPermissions, DataForTransaction, IdentificationMethodEnum, PrincipalTypeKind, TransactionTypeData, TransferTypeWithCurrency, PerformPayment, PaymentPreview, TransactionView, PaymentError, PaymentErrorCode, ForbiddenError, ForbiddenErrorCode, UserDataForSearch, User } from "app/api/models";
import { PaymentKind } from "app/banking/payments/payment-kind";
import { IdMethod } from "app/banking/payments/id-method";
import { PaymentsService, UsersService, ContactsService } from "app/api/services";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { ApiHelper } from "app/shared/api-helper";
import { ErrorStatus } from 'app/core/error-handler.service';
import { LinearStepperControlComponent } from 'app/shared/linear-stepper-control.component';
import { Menu } from 'app/shared/menu';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentKindAndIdMethod } from 'app/banking/payments/payment-kind-and-id-method';
import { Observable } from 'rxjs/Observable';
import { TdStepComponent } from '@covalent/core';
import { cloneDeep } from "lodash";

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

  // Data fetched initially
  initialData: BehaviorSubject<DataForTransaction> = new BehaviorSubject(null);

  // Data fetched when the payment destination is known
  paymentData = new BehaviorSubject<DataForTransaction>(null);

  @ViewChild("stepperControl")
  stepperControl: LinearStepperControlComponent;

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private paymentsService: PaymentsService,
    private usersService: UsersService,
    private contactsService: ContactsService) {
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

    // Form for field (description + custom values set on prepareFieldsForm())
    this.fieldsForm = formBuilder.group({
      type: [null, Validators.required],
      amount: [null, Validators.required]
    });
    // Changing the payment type should also fetch the payment type data
    this.fieldsForm.valueChanges.subscribe(values => {
      // Setting the form controls also triggers this,
      // and we don't want to re-fetch the data in this case
      if (this.preparingFieldsForm) return;

      if (values.type == null) {
        this.paymentTypeData.next(null);
      } else if (this.paymentTypeData.value == null
        || this.paymentTypeData.value == null
        || this.paymentTypeData.value.id != values.type) {
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
      .then(response => {
        this.initAllowedKinds(response.data);
        this.initialData.next(response.data);
        this.stepperControl.activate(this.kindStep);
      });
  }


  ////////////////////////////////////////////////////
  // Kind step
  ////////////////////////////////////////////////////
  @ViewChild("kindStep") kindStep: TdStepComponent;
  kindForm: FormGroup;
  searchIdMethod: IdMethod;
  contactsIdMethod: IdMethod;
  allowedKindAndIdMethods: PaymentKindAndIdMethod[];
  kindAndIdMethod = new BehaviorSubject<PaymentKindAndIdMethod>(null);

  private initAllowedKinds(data: DataForTransaction) {
    let payments = this.login.auth.permissions.banking.payments;

    this.allowedKindAndIdMethods = [];
    let defaultKindAndIdMethod: PaymentKindAndIdMethod = null;

    // To user
    if (payments.user && (data.paymentTypes || []).length > 0) {
      // Search
      if (data.allowAutocomplete) {
        let kid = new PaymentKindAndIdMethod(
          this.bankingMessages.paymentKindAutocomplete(),
          PaymentKind.USER, this.searchIdMethod);
        this.allowedKindAndIdMethods.push(kid);
        if (data.defaultIdMethod == IdentificationMethodEnum.AUTOCOMPLETE) {
          defaultKindAndIdMethod = kid;
        }
      }
      // Contacts
      if (data.allowContacts) {
        let kid = new PaymentKindAndIdMethod(
          this.bankingMessages.paymentKindContact(),
          PaymentKind.USER, this.contactsIdMethod);
        this.allowedKindAndIdMethods.push(kid);
        if (data.defaultIdMethod == IdentificationMethodEnum.CONTACTS) {
          defaultKindAndIdMethod = kid;
        }
      }
      // Principal types
      data.principalTypes.forEach(pt => {
        if (pt.kind != PrincipalTypeKind.TOKEN || pt.allowManualInput) {
          // Only tokens with manual input are supported (no NFC tag / barcode scanning / etc)
          let kid = new PaymentKindAndIdMethod(
            this.bankingMessages.paymentKindPrincipal((pt.name || '').toLowerCase()),
            PaymentKind.USER, pt);
          this.allowedKindAndIdMethods.push(kid);
          if (data.defaultPrincipalType == pt.internalName) {
            defaultKindAndIdMethod = kid;
          }
        }
      });
    }
    // Self payments
    if (payments.self) {
      let kid = new PaymentKindAndIdMethod(
        this.bankingMessages.paymentKindSelf(), PaymentKind.SELF);
      this.allowedKindAndIdMethods.push(kid);
      if (defaultKindAndIdMethod == null) {
        defaultKindAndIdMethod = kid;
      }
    }
    // System payments
    if (payments.system) {
      let kid = new PaymentKindAndIdMethod(
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
    let kid = this.kindAndIdMethod.value;
    let isUser = kid.kind == PaymentKind.USER;
    if (kid.kind == PaymentKind.USER) {
      // Still needs to select the user
      this.stepperControl.enable(this.userStep);
      this.fetchUserData();
    } else {
      // We can get the payment data directly
      this.stepperControl.disable(this.userStep);
      this.fetchPaymentData();
    }
  }

  ////////////////////////////////////////////////////
  // User step
  ////////////////////////////////////////////////////
  @ViewChild("userStep") userStep: TdStepComponent;
  userForm: FormGroup;
  userDataForSearch = new BehaviorSubject<UserDataForSearch>(null);
  contacts = new BehaviorSubject<User[]>([]);
  user = new BehaviorSubject<string>(null);
  toUser = new BehaviorSubject<User>(null);

  previousFromUser() {
    this.stepperControl.activate(this.kindStep);
  }

  nextFromUser() {
    this.fetchPaymentData();
  }

  private fetchUserData() {
    let proceed = () => {
      this.stepperControl.activate(this.userStep);
    };
    let kid = this.kindAndIdMethod.value;
    let internalName = (kid.idMethod || {}).internalName;
    switch (internalName) {
      case IdentificationMethodEnum.AUTOCOMPLETE:
        if (this.userDataForSearch.value) {
          // Data was already fetched
          proceed();
        } else {
          // Fetch data for searching users
          this.usersService.getUserDataForSearch()
            .then(response => {
              this.userDataForSearch.next(response.data);
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
            pageSize: 9999
          })
            .then(response => {
              this.contacts.next(response.data);
              if (response.data.length == 0) {
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

  ////////////////////////////////////////////////////
  // Fields step
  ////////////////////////////////////////////////////
  @ViewChild("fieldsStep") fieldsStep: TdStepComponent;
  fieldsForm: FormGroup;
  preparingFieldsForm: boolean;
  paymentTypes = new BehaviorSubject<TransferTypeWithCurrency[]>([]);
  paymentTypeData = new BehaviorSubject<TransactionTypeData>(null);

  private fetchPaymentData(): Promise<DataForTransaction> {
    return this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.to,
      type: this.paymentType
    })
      .then(response => {
        let result = response.data;
        this.paymentData.next(result);
        this.toUser.next(result.toUser);

        // If there is a single payment type, disable the type step
        let noPaymentTypes = result.paymentTypes.length == 0;
        this.paymentTypes.next(result.paymentTypes);

        if (noPaymentTypes) {
          this.notification.error(this.bankingMessages.paymentErrorNoPaymentType());
        } else {
          // Preselect the first payment type and activate the fields step
          this.fieldsForm.patchValue({ type: result.paymentTypes[0].id })
          this.prepareFieldsForm(result.paymentTypeData);
          this.stepperControl.activate(this.fieldsStep);
        }
        return result;
      });
  }

  get to(): string {
    let kid = this.kindAndIdMethod.value;
    let kind = kid.kind;
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

  private fetchPaymentTypeData(): Promise<TransactionTypeData> {
    return this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.to,
      type: this.paymentType,
      fields: ['paymentTypeData']
    })
      .then(response => {
        let result = response.data;
        this.prepareFieldsForm(result.paymentTypeData);
        return result.paymentTypeData;
      });
  }

  private prepareFieldsForm(data: TransactionTypeData) {
    this.preparingFieldsForm = true;
    this.fieldsForm.setControl('description',
      this.formBuilder.control(null, data.requiresDescription ? Validators.required : null));
    this.fieldsForm.setControl('customValues',
      ApiHelper.customValuesFormGroup(this.formBuilder, data.customFields));
    this.fieldsForm.patchValue({type: data.id});
    this.preparingFieldsForm = false;
    this.paymentTypeData.next(data);
  }

  previousFromFields() {
    if (this.kindAndIdMethod.value.kind == PaymentKind.USER) {
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
    let payment = cloneDeep(this.fieldsForm.value);
    payment.subject = this.to;
    payment.type = this.paymentType;

    // Preview the payment
    return this.paymentsService.previewPayment({
      owner: ApiHelper.SELF,
      payment: payment
    })
      .then(response => {
        let preview = response.data;
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


  ////////////////////////////////////////////////////
  // Preview step
  ////////////////////////////////////////////////////
  @ViewChild('previewStep') previewStep: TdStepComponent;
  previewForm: FormGroup;
  preview = new BehaviorSubject<PaymentPreview>(null);

  previousFromPreview() {
    this.stepperControl.activate(this.fieldsStep);
  }

  nextFromPreview() {
    this.performPayment()
      .then(() => this.stepperControl.activate(this.doneStep));
  }

  ////////////////////////////////////////////////////
  // Done step
  ////////////////////////////////////////////////////
  @ViewChild('doneStep') doneStep: TdStepComponent;
  performed = new BehaviorSubject<TransactionView>(null);
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
      .then(response => {
        this.performed.next(response.data);
      })
      .catch(response => {
        if (response.status == ErrorStatus.FORBIDDEN) {
          this.previewForm.setValue({
            confirmationPassword: null
          });
        }
      });
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
