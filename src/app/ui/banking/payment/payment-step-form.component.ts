import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AccountWithStatus, Currency, CustomFieldDetailed, DataForTransaction,
  NotFoundError, TransactionTypeData, TransferType, User
} from 'app/api/models';
import { PaymentsService } from 'app/api/services/payments.service';
import { PosService } from 'app/api/services/pos.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { ErrorStatus } from 'app/core/error-status';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { blank, empty, focus } from 'app/shared/helper';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, first } from 'rxjs/operators';

const IGNORED_STATUSES = [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED, ErrorStatus.NOT_FOUND];

/**
 * Payment step: the main payment form
 */
@Component({
  selector: 'payment-step-form',
  templateUrl: 'payment-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStepFormComponent extends BaseComponent implements OnInit {

  setFocus = focus;

  @Input() data: DataForTransaction;
  @Input() pos: boolean;
  @Input() form: FormGroup;
  @Input() currency: Currency;
  @Input() paymentTypeData$: BehaviorSubject<TransactionTypeData>;

  @Output() availablePaymentTypes = new EventEmitter<TransferType[]>();

  @ViewChild('toUser') userField: UserFieldComponent;
  @ViewChild('amount', { static: true }) amountField: DecimalFieldComponent;

  accountBalanceLabel$ = new BehaviorSubject<string>(null);
  fixedDestination = false;
  fromParam: string;
  fromUser: User;
  fromSelf: boolean;
  toParam: string;
  toUser: User;

  accountChangeSubscription: Subscription;
  typeChangeSubscription: Subscription;
  subjectChangeSubscription: Subscription;

  fetchedPaymentTypes: TransferType[];
  paymentTypes$ = new BehaviorSubject<TransferType[]>(null);
  private dataCache: Map<string, TransactionTypeData>;

  @Input() customValuesControlGetter: (cf: CustomFieldDetailed) => FormControl;

  constructor(
    injector: Injector,
    public bankingHelper: BankingHelperService,
    private paymentsService: PaymentsService,
    private posService: PosService,
    private authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const route = this.route.snapshot;
    this.fromParam = route.params.from;
    this.dataCache = this.stateManager.get('dataCache', () => new Map());

    this.fixedDestination = this.data.toKind != null;
    this.fromUser = this.data.fromUser;
    this.fromSelf = this.authHelper.isSelf(this.fromUser);
    this.toUser = this.data.toUser;

    if (this.fixedDestination) {
      // When there's a fixed destination, the payment types are already present in the initial data
      this.setFetchedPaymentTypes(this.data);
    }

    this.createSubscriptions();

    this.addSub(this.layout.xxs$.subscribe(() => this.updateAccountBalanceLabel()));
    this.updateAccountBalanceLabel();
  }

  public createSubscriptions() {
    if (!this.fixedDestination) {
      // Whenever the subject changes, fetch the payment types, if needed
      this.subjectChangeSubscription = this.form.get('subject').valueChanges
        .pipe(debounceTime(ApiHelper.DEBOUNCE_TIME), distinctUntilChanged((l1, l2) => ApiHelper.locatorEquals(l1, l2)))
        .subscribe(() => this.fetchPaymentTypes());
    }

    // Whenever the account changes, filter out the available types
    this.accountChangeSubscription = this.form.get('account').valueChanges
      .pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
      .subscribe(() => this.adjustPaymentTypes());
    // Whenever the payment type changes, fetch the payment type data for it
    this.typeChangeSubscription = this.form.get('type').valueChanges
      .pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
      .subscribe(type => this.fetchPaymentTypeData(type));
  }

  public removeSubscriptions() {
    if (this.subjectChangeSubscription) {
      this.subjectChangeSubscription.unsubscribe();
    }
    this.accountChangeSubscription.unsubscribe();
    this.typeChangeSubscription.unsubscribe();
  }

  private updateAccountBalanceLabel() {
    if (this.layout.xxs) {
      this.accountBalanceLabel$.next(this.i18n.account.balance);
    } else {
      this.accountBalanceLabel$.next(this.i18n.transaction.accountBalance);
    }
  }

  private fetchPaymentTypes() {
    // Clear the cached data when the destination user changes
    this.dataCache.clear();
    this.fetchedPaymentTypes = null;

    // Get the payment subject
    const value = this.form.value;
    const subject = ApiHelper.escapeNumeric(value.subject);
    if (subject === '') {
      return;
    }

    // Fetch the payment types to that user
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      let request: Observable<DataForTransaction>;
      if (this.pos) {
        request = this.posService.dataForReceivePayment({
          from: subject,
          fields: ['fromUser', 'paymentTypes', 'paymentTypeData'],
        });
      } else {
        request = this.paymentsService.dataForPerformPayment({
          owner: this.fromParam,
          to: subject,
          fields: ['toUser', 'paymentTypes', 'paymentTypeData'],
        });
      }
      request.pipe(first()).subscribe(data => {
        this.setFetchedPaymentTypes(data);
      }, (err: HttpErrorResponse) => {
        if (this.allowPrincipal && this.userField && err.status === ErrorStatus.NOT_FOUND) {
          // The typed value for the user may be a principal
          let error = err.error;
          if (typeof error === 'string') {
            try {
              error = JSON.parse(error);
            } catch (e) {
              error = {};
            }
          }
          const entityType = (error as NotFoundError).entityType;
          if (!blank(entityType) && entityType.endsWith('User')) {
            // The user couldn't be located. Perform the search in the user field
            this.userField.search();
            return;
          }
        }
        if (!IGNORED_STATUSES.includes(err.status)) {
          defaultHandling(err);
        }
      });
    });
  }

  private adjustPaymentTypes() {
    const value = this.form.value;
    const subject = (value.subject || '').trim();
    if (subject.length === 0) {
      return;
    }

    const allPaymentTypes = this.fetchedPaymentTypes || [];
    if (empty(allPaymentTypes)) {
      this.notification.error(this.i18n.transaction.noTypes);
    }
    // Filter the payment types from the selected account type
    const paymentTypes = allPaymentTypes.filter(tt => tt.from.id === value.account);
    let type: string = this.form.value.type;
    let error: any = null;
    if (empty(paymentTypes)) {
      const msg = this.i18n.transaction.noTypesSelection;
      error = { message: msg };
    } else {
      this.paymentTypes$.next(paymentTypes);
      if (!paymentTypes.find(t => t.id === type)) {
        // The previously selected payment type is either null or invalid. Select the first one.
        type = paymentTypes[0].id;
      }
      this.form.get('account').setErrors(null);
    }
    this.form.patchValue({ type });
    this.form.get('account').setErrors(error);
    this.form.get('account').markAsTouched();
    // Immediately fetch the payment type data
    if (!empty(type)) {
      this.fetchPaymentTypeData(type);
    }
    this.availablePaymentTypes.emit(paymentTypes);
  }

  private setFetchedPaymentTypes(data: DataForTransaction) {
    if (this.userField) {
      this.userField.user = this.pos ? data.fromUser : data.toUser;
    }
    this.fetchedPaymentTypes = data.paymentTypes;
    const typeData = data.paymentTypeData;
    if (typeData) {
      // When a payment type data is returned, cache it already. May prevent an extra request.
      this.dataCache.set(typeData.id, typeData);
    }
    this.adjustPaymentTypes();
  }

  private fetchPaymentTypeData(type: string) {
    const value = this.form.value;
    if (empty(value.subject) || empty(type)) {
      return;
    }
    const cached = this.dataCache.get(type);
    if (cached) {
      // The data for this type was already cached
      this.setPaymentTypeData(cached);
      return;
    }

    // Need to set the type data to null while it's being fetched
    this.setPaymentTypeData(null);

    // Finally, fetch the data
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      let request: Observable<DataForTransaction>;
      if (this.pos) {
        request = this.posService.dataForReceivePayment({
          from: value.subject,
          type,
          fields: ['paymentTypeData'],
        });
      } else {
        request = this.paymentsService.dataForPerformPayment({
          owner: this.fromParam,
          to: value.subject,
          type,
          fields: ['paymentTypeData'],
        });
      }
      request.pipe(first()).subscribe(data => {
        const typeData = data.paymentTypeData;
        this.setPaymentTypeData(typeData);
      }, (err: HttpErrorResponse) => {
        if (!IGNORED_STATUSES.includes(err.status)) {
          defaultHandling(err);
        }
      });
    });
  }

  setPaymentTypeData(typeData: TransactionTypeData) {
    const oldId = (this.paymentTypeData$.value || {}).id || null;
    const newId = (typeData || {}).id || null;
    if (oldId === newId) {
      return;
    }
    if (typeData) {
      this.dataCache.set(typeData.id, typeData);
      focus(this.amountField);
      if (typeData.fixedAmount) {
        this.form.patchValue({ amount: typeData.fixedAmount });
      }
    }
    this.paymentTypeData$.next(typeData);
  }

  get fixedUsersList(): boolean {
    return !empty(this.data.allowedUsers);
  }
  get allowQrCode(): boolean {
    return this.allowPrincipal && this.data.allowScanQrCode;
  }
  get allowPrincipal(): boolean {
    return !empty(this.data.principalTypes);
  }
  get allowSearch(): boolean {
    return this.data.allowAutocomplete;
  }
  get allowContacts(): boolean {
    return this.data.allowContacts;
  }
  get singleAccount(): AccountWithStatus {
    const accounts = this.data.accounts || [];
    return accounts.length === 1 ? accounts[0] : null;
  }

}
