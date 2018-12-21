import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AccountWithStatus, Currency, DataForTransaction, NotFoundError, TransactionTypeData, TransferType, User } from 'app/api/models';
import { PaymentsService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { blank, empty } from 'app/shared/helper';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


const IGNORED_STATUSES = [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED, ErrorStatus.NOT_FOUND];

/**
 * Payment step: the main payment form
 */
@Component({
  selector: 'payment-step-form',
  templateUrl: 'payment-step-form.component.html',
  styleUrls: ['payment-step-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStepFormComponent extends BaseComponent implements OnInit {

  @Input() data: DataForTransaction;
  @Input() form: FormGroup;
  @Input() currency: Currency;

  @Output() paymentTypeData = new EventEmitter<TransactionTypeData>();
  @Output() availablePaymentTypes = new EventEmitter<TransferType[]>();

  @ViewChild('amount') amountField: DecimalFieldComponent;
  @ViewChild('toUser') userField: UserFieldComponent;

  accountBalanceLabel$ = new BehaviorSubject<string>(null);
  fixedDestination = false;
  fixedUser: User;

  private dataCache = new Map<string, TransactionTypeData>();
  fetchedPaymentTypes: TransferType[];
  paymentTypes$ = new BehaviorSubject<TransferType[]>(null);
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);

  constructor(
    injector: Injector,
    private paymentsService: PaymentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.fixedDestination = this.data.toKind != null;
    this.fixedUser = this.data.toUser;

    if (this.fixedDestination) {
      // When there's a fixed destination, the payment types are already present in the initial data
      this.setFetchedPaymentTypes(this.data);
    }

    // Whenever the account changes, filter out the available types
    this.addSub(this.form.get('account').valueChanges
      .pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
      .subscribe(() => this.adjustPaymentTypes())
    );
    // Whenever the subject, adjust the payemnt types
    this.addSub(this.form.get('subject').valueChanges
      .pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
      .subscribe(() => this.fetchPaymentTypes())
    );
    // Whenever the type changes, fetch the payment type data
    this.addSub(this.form.get('type').valueChanges
      .subscribe(type => this.fetchPaymentTypeData(type)));

    this.addSub(this.layout.xxs$.subscribe(() => this.updateAccountBalanceLabel()));
    this.updateAccountBalanceLabel();
  }

  private updateAccountBalanceLabel() {
    if (this.layout.xxs) {
      this.accountBalanceLabel$.next(this.i18n('My account balance'));
    } else {
      this.accountBalanceLabel$.next(this.i18n('Account balance'));
    }
  }

  private fetchPaymentTypes() {
    // Clear the cached data when the destination user changes
    this.dataCache.clear();
    this.fetchedPaymentTypes = null;

    // Also update the form, rendering it invalid until the new data is fetched
    this.form.patchValue({ type: null });

    // Get the payment subject
    const value = this.form.value;
    const subject = (value.subject || '').trim();
    if (subject.length === 0) {
      return;
    }

    // Fetch the payment types to that user
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      this.addSub(this.paymentsService.dataForPerformPayment({
        owner: ApiHelper.SELF,
        to: subject,
        fields: ['toUser', 'paymentTypes', 'paymentTypeData']
      }).subscribe(data => {
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
      }));
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
      this.notification.error(this.i18n('There are no possible payment types'));
    }
    // Filter the payment types from the selected account type
    const paymentTypes = allPaymentTypes.filter(tt => tt.from.id === value.account);
    let type: string = null;
    let error: any = null;
    if (empty(paymentTypes)) {
      const msg = this.i18n('There are no possible payment types from this account to the selected user');
      error = { message: msg };
    } else {
      this.paymentTypes$.next(paymentTypes);
      type = paymentTypes[0].id;
      this.form.get('account').setErrors(null);
    }
    this.form.patchValue({ type: type });
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
      this.userField.user = data.toUser;
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
    if (empty(value.subject)) {
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
      this.addSub(this.paymentsService.dataForPerformPayment({
        owner: ApiHelper.SELF,
        to: value.subject,
        type: type,
        fields: ['paymentTypeData']
      }).subscribe(data => {
        const typeData = data.paymentTypeData;
        this.setPaymentTypeData(typeData);
      }, (err: HttpErrorResponse) => {
        if (!IGNORED_STATUSES.includes(err.status)) {
          defaultHandling(err);
        }
      }));
    });
  }

  setPaymentTypeData(typeData: TransactionTypeData) {
    const oldId = (this.paymentTypeData$.value || {}).id || null;
    const newId = (typeData || {}).id || null;
    if (oldId === newId) {
      return;
    }
    this.paymentTypeData.emit(typeData);
    this.paymentTypeData$.next(typeData);
    if (typeData) {
      this.dataCache.set(typeData.id, typeData);
      this.amountField.focus();
    }
  }

  get fixedUsersList(): boolean {
    return !empty(this.data.allowedUsers);
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
