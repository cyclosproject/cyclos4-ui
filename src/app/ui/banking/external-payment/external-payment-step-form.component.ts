import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AccountWithStatus,
  Currency,
  CustomFieldDetailed,
  DataForTransaction,
  PrincipalTypeInput,
  TransactionTypeData,
  TransferType,
  User
} from 'app/api/models';
import { ExternalPaymentsService } from 'app/api/services/external-payments.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { ErrorStatus } from 'app/core/error-status';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { empty, focus } from 'app/shared/helper';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const IGNORED_STATUSES = [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED, ErrorStatus.NOT_FOUND];

/**
 * External payment step: the form
 */
@Component({
  selector: 'external-payment-step-form',
  templateUrl: 'external-payment-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalPaymentStepFormComponent extends BaseComponent implements OnInit {
  @Input() data: DataForTransaction;
  @Input() form: FormGroup;
  @Input() currency: Currency;
  @Input() paymentTypeData$: BehaviorSubject<TransactionTypeData>;
  @Input() toSystem: boolean;

  @Output() availablePaymentTypes = new EventEmitter<TransferType[]>();

  @ViewChild('toUser') userField: UserFieldComponent;
  @ViewChild('amount', { static: true }) amountField: DecimalFieldComponent;

  accountBalanceLabel$ = new BehaviorSubject<string>(null);
  ownerParam: string;
  fromUser: User;
  fromSelf: boolean;
  toUser: User;

  toPrincipalType$ = new BehaviorSubject<PrincipalTypeInput>(null);

  fetchedPaymentTypes: TransferType[];
  firstPaymentTypeUpdate = true;
  paymentTypes$ = new BehaviorSubject<TransferType[]>(null);
  private dataCache: Map<string, TransactionTypeData>;

  @Input() customValuesControlGetter: (cf: CustomFieldDetailed) => FormControl;

  constructor(
    injector: Injector,
    public bankingHelper: BankingHelperService,
    private externalPaymentsService: ExternalPaymentsService,
    private authHelper: AuthHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const route = this.route.snapshot;
    this.ownerParam = route.params.owner;
    this.dataCache = this.stateManager.get('dataCache', () => new Map());

    this.fromUser = this.data.fromUser;
    this.fromSelf = this.authHelper.isSelf(this.fromUser);
    this.toUser = this.data.toUser;

    this.setFetchedPaymentTypes(this.data);

    this.toPrincipalType$.next(this.data.principalTypes[0]);
    // Whenever the account changes, filter out the available types
    this.addSub(
      this.form
        .get('account')
        .valueChanges.pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
        .subscribe(() => this.adjustPaymentTypes())
    );

    // Whenever the payment type changes, fetch the payment type data for it
    this.addSub(
      this.form
        .get('type')
        .valueChanges.pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
        .subscribe(type => this.fetchPaymentTypeData(type))
    );

    // Whenever the principal type changes, update the principal type reference
    this.addSub(
      this.form
        .get('toPrincipalType')
        .valueChanges.pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
        .subscribe(id => this.toPrincipalType$.next(this.data?.principalTypes.find(pt => pt.id === id)))
    );

    this.addSub(this.layout.xxs$.subscribe(() => this.updateAccountBalanceLabel()));

    this.updateAccountBalanceLabel();
  }

  private updateAccountBalanceLabel() {
    if (this.layout.xxs) {
      this.accountBalanceLabel$.next(this.i18n.account.balance);
    } else {
      this.accountBalanceLabel$.next(this.i18n.transaction.accountBalance);
    }
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
      this.addSub(
        this.externalPaymentsService
          .dataForPerformExternalPayment({
            owner: this.ownerParam,
            type,
            fields: ['paymentTypeData']
          })
          .subscribe(
            data => {
              const typeData = data.paymentTypeData;
              this.setPaymentTypeData(typeData);
            },
            (err: HttpErrorResponse) => {
              if (!IGNORED_STATUSES.includes(err.status)) {
                defaultHandling(err);
              }
            }
          )
      );
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
      if (typeData.fixedAmount) {
        this.form.patchValue({ amount: typeData.fixedAmount });
      }
      if (this.firstPaymentTypeUpdate) {
        this.firstPaymentTypeUpdate = false;
      } else {
        focus(this.amountField);
      }
    }
    this.paymentTypeData$.next(typeData);
  }

  get singleAccount(): AccountWithStatus {
    const accounts = this.data.accounts || [];
    return accounts.length === 1 ? accounts[0] : null;
  }
}
