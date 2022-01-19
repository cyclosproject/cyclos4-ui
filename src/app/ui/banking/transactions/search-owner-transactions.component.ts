import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Currency,
  ExternalPaymentStatusEnum,
  PaymentRequestStatusEnum, TransactionAuthorizationStatusEnum, TransactionDataForSearch,
  TransactionKind, TransactionQueryFilters, TransactionResult, TransferFilter
} from 'app/api/models';
import { TransactionsService } from 'app/api/services/transactions.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type TransactionSearchParams = TransactionQueryFilters & {
  owner: string;
};

/**
 * Search for transactions of a specific owner
 */
@Component({
  selector: 'search-owner-transactions',
  templateUrl: 'search-owner-transactions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOwnerTransactionsComponent
  extends BaseSearchPageComponent<TransactionDataForSearch, TransactionSearchParams, TransactionResult>
  implements OnInit {

  kind: 'authorized' | 'payment-request' | 'external-payment';
  param: string;
  self: boolean;
  heading: string;
  mobileHeading: string;
  transferFilters$ = new BehaviorSubject<TransferFilter[]>([]);
  currencies = new Map<string, Currency>();
  hasTransactionNumber: boolean;
  usePreselectedPeriods = false;
  transactionNumberPattern: string;

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService,
    public bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.kind = route.data.kind;
    this.param = route.params.owner;
    this.self = this.authHelper.isSelf(this.param);

    switch (this.kind) {
      case 'authorized':
        this.heading = this.i18n.transaction.title.authorizations;
        this.mobileHeading = this.i18n.transaction.mobileTitle.authorizations;
        this.usePreselectedPeriods = true;
        break;
      case 'payment-request':
        this.heading = this.i18n.transaction.title.paymentRequests;
        this.mobileHeading = this.i18n.transaction.mobileTitle.paymentRequests;
        break;
      case 'external-payment':
        this.heading = this.i18n.transaction.title.externalPayments;
        this.mobileHeading = this.i18n.transaction.mobileTitle.externalPayments;
        break;
    }

    // Get the transactions search data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsDataForSearch({
        owner: this.param,
        fields: ['user', 'userPermissions', 'accountTypes', 'visibleKinds', 'transferFilters',
          ...(this.usePreselectedPeriods ? ['preselectedPeriods'] : []), 'query'],
      }),
    ).subscribe(data => {
      this.bankingHelper.preProcessPreselectedPeriods(data, this.form);

      // Initialize the currencies Map to make lookups easier
      (data.accountTypes || []).forEach(at => {
        const currency = at.currency;
        this.currencies.set(currency.id, currency);
        if (!empty(currency.internalName)) {
          this.currencies.set(currency.internalName, currency);
        }
      });

      // Only initialize the data once the form is filled-in
      this.data = data;
    });

    // Whenever the account type changes, also update the transfer filters
    this.addSub(this.form.get('accountType').valueChanges.subscribe(at => {
      this.form.patchValue({ transferFilter: null }, { emitEvent: false });
      const filters = this.data.transferFilters.filter(tf => tf.accountType.id === at);
      this.transferFilters$.next(filters);
    }));
  }

  onDataInitialized(data: TransactionDataForSearch) {
    super.onDataInitialized(data);
    const transactionNumberPatterns = Array.from(this.currencies.values())
      .map(c => c.transactionNumberPattern)
      .filter(p => p)
      .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    const headingActions: HeadingAction[] = [];
    const bankingPermissions = this.dataForFrontendHolder.auth?.permissions?.banking || {};
    const userPermissions = data.userPermissions || {};

    if (this.isPaymentRequest()) {
      if (this.param === ApiHelper.SYSTEM) {
        // System payment requests
        if (bankingPermissions?.paymentRequests?.sendToUser) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestAsSelfToUser,
            () => this.sendPaymentRequest(ApiHelper.SYSTEM), true));
        }
      } else if (this.self) {
        // Own payment requests
        if (bankingPermissions?.paymentRequests?.sendToUser) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestAsSelfToUser,
            () => this.sendPaymentRequest(ApiHelper.SELF), true));
        }
        if (bankingPermissions?.paymentRequests?.sendToSystem) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestAsSelfToSystem,
            () => this.sendPaymentRequest(ApiHelper.SELF, ApiHelper.SYSTEM), true));
        }
      } else {
        // A manager viewing the payment requests of a user
        if (userPermissions?.paymentRequests?.sendFromSystem) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestFromSystemToUser,
            () => this.sendPaymentRequest(ApiHelper.SYSTEM, this.param), true));
        }
        if (userPermissions?.paymentRequests?.sendAsUserToUser) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestAsUserToUser,
            () => this.sendPaymentRequest(this.param), true));
        }
        if (userPermissions?.paymentRequests?.sendAsUserToSystem) {
          headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.transaction.sendPaymentRequestAsUserToSystem,
            () => this.sendPaymentRequest(this.param, ApiHelper.SYSTEM), true));
        }
      }
    } else if (this.isExternalPayment()) {
      // There's only a possible action for payment requests, either as self, system or user: pay an external user
      if (bankingPermissions?.externalPayments?.perform || userPermissions?.externalPayments.performAsSelf) {
        headingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowUpRight, this.i18n.transaction.payExternalUser,
          () => this.payExternalUser(), true));
      }
    }
    headingActions.push(...this.exportHelper.headingActions(data.exportFormats,
      f => this.transactionsService.exportTransactions$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      })));
    this.headingActions = headingActions;
  }

  isPaymentRequest(): boolean {
    return this.kind === 'payment-request';
  }

  isExternalPayment(): boolean {
    return this.kind === 'external-payment';
  }

  doSearch(value: TransactionSearchParams) {
    return this.transactionsService.searchTransactions$Response(value);
  }

  private sendPaymentRequest(from: string, to?: string) {
    const params = ['/banking', from, 'payment-request'];
    if (to) {
      params.push(to);
    }
    this.router.navigate(params);
  }

  private payExternalUser() {
    this.router.navigate(['/banking', this.param, 'external-payment']);
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'user', 'preselectedPeriod', 'periodBegin', 'periodEnd', 'direction',
      'transactionNumber'];
  }

  getInitialFormValue(data: TransactionDataForSearch) {
    const value = super.getInitialFormValue(data);
    switch (this.kind) {
      case 'authorized':
        value.status = TransactionAuthorizationStatusEnum.PENDING;
        break;
      case 'payment-request':
        value.status = PaymentRequestStatusEnum.OPEN;
        break;
      case 'external-payment':
        value.status = ExternalPaymentStatusEnum.PENDING;
        break;
    }
    return value;
  }

  get statusOptions(): FieldOption[] {
    switch (this.kind) {
      case 'authorized':
        return (Object.values(TransactionAuthorizationStatusEnum) as TransactionAuthorizationStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.authorizationStatus(st)
        }));
      case 'payment-request':
        return (Object.values(PaymentRequestStatusEnum) as PaymentRequestStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.paymentRequestStatus(st)
        }));
      case 'external-payment':
        return (Object.values(ExternalPaymentStatusEnum) as ExternalPaymentStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.externalPaymentStatus(st)
        }));
    }
  }

  protected toSearchParams(value: any): TransactionSearchParams {
    const params: TransactionSearchParams = value;
    params.owner = this.param;
    params.accountTypes = value.accountType ? [value.accountType] : null;
    params.transferFilters = value.transferFilter ? [value.transferFilter] : null;
    params.datePeriod = this.bankingHelper.resolveDatePeriod(value);

    switch (this.kind) {
      case 'authorized':
        params.authorizationStatuses = [value.status];
        params.authorized = true;
        break;
      case 'payment-request':
        params.paymentRequestStatuses = [value.status];
        params.kinds = [TransactionKind.PAYMENT_REQUEST];
        break;
      case 'external-payment':
        params.externalPaymentStatuses = [value.status];
        params.kinds = [TransactionKind.EXTERNAL_PAYMENT];
        break;
    }

    return params;
  }

  resolveMenu(data: TransactionDataForSearch) {
    let menu: Menu;
    switch (this.kind) {
      case 'authorized':
        menu = Menu.AUTHORIZED_PAYMENTS;
        break;
      case 'payment-request':
        menu = Menu.PAYMENT_REQUESTS;
        break;
      case 'external-payment':
        menu = Menu.EXTERNAL_PAYMENTS;
        break;
    }
    return this.menu.userMenu(data.user, menu);
  }

  get toLink() {
    return (row: TransactionResult) => this.bankingHelper.transactionPath(row);
  }
}
