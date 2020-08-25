import { ChangeDetectionStrategy, Component, Injector, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AccountHistoryStatus, AccountWithHistoryStatus, Currency } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

/** Information for an account status element shown on top */
export interface StatusIndicator {
  label: string;
  amount: string;
  alwaysNegative: boolean;
}

/**
 * Shows the account status
 */
@Component({
  selector: 'account-status-view',
  templateUrl: 'account-status-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusViewComponent extends BaseComponent implements OnInit, OnChanges {

  @Input() account: AccountWithHistoryStatus;
  @Input() mode: 'current' | 'period' = 'current';

  private _showAccount: boolean | string = false;
  @Input() get showAccount(): boolean | string {
    return this._showAccount;
  }
  set showAccount(show: boolean | string) {
    this._showAccount = truthyAttr(show);
  }

  private _showUser: boolean | string = false;
  @Input() get showUser(): boolean | string {
    return this._showUser;
  }
  set showUser(show: boolean | string) {
    this._showUser = truthyAttr(show);
  }

  private _showSeparator: boolean | string = false;
  @Input() get showSeparator(): boolean | string {
    return this._showSeparator;
  }
  set showSeparator(show: boolean | string) {
    this._showSeparator = truthyAttr(show);
  }

  indicators$ = new BehaviorSubject<StatusIndicator[]>(null);

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.updateIndicators();
  }

  get status(): AccountHistoryStatus {
    return this.account.status;
  }

  get currency(): Currency {
    return this.account.currency;
  }

  private updateIndicators() {
    const indicators: StatusIndicator[] = [];
    const status = this.status;
    const add = (amount: string, label: string, alwaysNegative: boolean = false) => {
      if (amount) {
        indicators.push({
          label,
          amount,
          alwaysNegative: this.format.isZero(amount) ? false : alwaysNegative,
        });
      }
    };
    if (this.mode === 'current') {
      add(status.balance, this.i18n.account.balance);
      if (status.availableBalance !== status.balance) {
        add(status.availableBalance, this.i18n.account.availableBalance);
      }
      if (status.reservedAmount && !this.format.isZero(status.reservedAmount)) {
        add(status.reservedAmount, this.i18n.account.reservedAmount, true);
      }
      if (status.creditLimit && !this.format.isZero(status.creditLimit)) {
        add(status.creditLimit, this.i18n.account.negativeLimit);
      }
      if (status.upperCreditLimit && !this.format.isZero(status.upperCreditLimit)) {
        add(status.upperCreditLimit, this.i18n.account.positiveLimit);
      }
    } else {
      if (this.layout.gtxxs && status.balanceAtBegin != null) {
        add(status.balanceAtBegin, this.i18n.account.balanceOn(this.format.formatAsDate(status.beginDate)));
      }
      if (this.layout.gtxxs && status.balanceAtEnd != null) {
        add(status.balanceAtEnd, this.i18n.account.balanceOn(this.format.formatAsDate(status.endDate)));
      }
      if (status.incoming != null && status.incoming.sum) {
        add(status.incoming.sum, this.i18n.account.totalIncome);
      }
      if (status.outgoing != null && status.outgoing.sum) {
        let outflow = status.outgoing.sum;
        if (!this.format.isZero(outflow)) {
          outflow = '-' + outflow;
        }
        add(outflow, this.i18n.account.totalOutflow);
      }
      if (status.netInflow != null) {
        add(status.netInflow, this.i18n.account.netInflow);
      }
    }
    this.indicators$.next(indicators);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode || changes.account || changes.showAccount) {
      this.updateIndicators();
    }
  }

}
