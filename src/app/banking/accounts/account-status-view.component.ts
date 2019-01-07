import { ChangeDetectionStrategy, Component, Injector, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AccountHistoryStatus, AccountWithHistoryStatus, Currency } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
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
  styleUrls: ['account-status-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountStatusViewComponent extends BaseComponent implements OnInit, OnChanges {

  @Input() account: AccountWithHistoryStatus;
  @Input() mode: 'current' | 'period' = 'current';

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
          amount: amount,
          label: label,
          alwaysNegative: alwaysNegative
        });
      }
    };
    if (this.mode === 'current') {
      add(status.balance, this.messages.account.balance);
      if (status.availableBalance !== status.balance) {
        add(status.availableBalance, this.messages.account.availableBalance);
      }
      if (status.reservedAmount && !this.format.isZero(status.reservedAmount)) {
        add(status.reservedAmount, this.messages.account.reservedAmount, true);
      }
      if (status.creditLimit && !this.format.isZero(status.creditLimit)) {
        add(status.creditLimit, this.messages.account.negativeLimit);
      }
      if (status.upperCreditLimit && !this.format.isZero(status.upperCreditLimit)) {
        add(status.upperCreditLimit, this.messages.account.positiveLimit);
      }
    } else {
      if (status.balanceAtBegin != null) {
        add(status.balanceAtBegin, this.messages.account.balanceOn(this.format.formatAsDate(status.beginDate)));
      }
      if (status.balanceAtEnd != null) {
        add(status.balanceAtEnd, this.messages.account.balanceOn(this.format.formatAsDate(status.endDate)));
      }
      if (status.incoming != null && status.incoming.sum) {
        add(status.incoming.sum, this.messages.account.totalIncome);
      }
      if (status.outgoing != null && status.outgoing.sum) {
        add(status.outgoing.sum, this.messages.account.totalOutflow);
      }
      if (status.netInflow != null) {
        add(status.netInflow, this.messages.account.netInflow);
      }
    }
    this.indicators$.next(indicators);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode || changes.account) {
      this.updateIndicators();
    }
  }

}
