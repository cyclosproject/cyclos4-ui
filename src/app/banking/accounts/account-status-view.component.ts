import { ChangeDetectionStrategy, Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { AccountHistoryStatus, AccountWithHistoryStatus, Currency } from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { BehaviorSubject } from 'rxjs';


/** Information for an account status element shown on top */
export interface StatusIndicator {
  label: string;
  amount: string;
  alwaysNegative: boolean;
  mode: 'current' | 'period';
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
export class AccountStatusViewComponent implements OnInit, OnChanges {

  @Input() account: AccountWithHistoryStatus;
  @Input() mode: 'current' | 'period' = 'current';

  status: AccountHistoryStatus;
  currency: Currency;
  indicators$ = new BehaviorSubject<StatusIndicator[]>(null);

  private allIndicators: StatusIndicator[] = [];

  constructor(
    private i18n: I18n,
    private format: FormatService) {
  }

  ngOnInit() {
    const status = this.account.status;
    this.status = status;
    this.currency = this.account.currency;

    const add = (mode: 'current' | 'period', amount: string, label: string, alwaysNegative: boolean = false) => {
      if (amount) {
        this.allIndicators.push({
          mode: mode,
          amount: amount,
          label: label,
          alwaysNegative: alwaysNegative
        });
      }
    };
    add('current', status.balance, this.i18n('Balance'));
    if (status.availableBalance !== status.balance) {
      add('current', status.availableBalance, this.i18n('Available balance'));
    }
    if (status.reservedAmount && !this.format.isZero(status.reservedAmount)) {
      add('current', status.reservedAmount, this.i18n('Reserved amount'), true);
    }
    if (status.creditLimit && !this.format.isZero(status.creditLimit)) {
      add('current', status.creditLimit, this.i18n('Negative limit'));
    }
    if (status.upperCreditLimit && !this.format.isZero(status.upperCreditLimit)) {
      add('current', status.upperCreditLimit, this.i18n('Positive limit'));
    }
    if (status.balanceAtBegin != null) {
      add('period', status.balanceAtBegin, this.i18n('Balance on {{date}}', {
        date: this.format.formatAsDate(status.beginDate)
      }));
    }
    if (status.balanceAtEnd != null) {
      add('period', status.balanceAtEnd, this.i18n('Balance on {{date}}', {
        date: this.format.formatAsDate(status.endDate)
      }));
    }
    if (status.incoming != null && status.incoming.sum) {
      add('period', status.incoming.sum, this.i18n('Total income'));
    }
    if (status.outgoing != null && status.outgoing.sum) {
      add('period', status.outgoing.sum, this.i18n('Total outflow'));
    }
    if (status.netInflow != null) {
      add('period', status.netInflow, this.i18n('Net inflow'));
    }
    this.updateIndicators();
  }

  private updateIndicators() {
    this.indicators$.next(this.allIndicators.filter(i => i.mode === this.mode));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const mode = changes.mode;
    if (mode.currentValue !== mode.previousValue) {
      this.updateIndicators();
    }
  }

}
