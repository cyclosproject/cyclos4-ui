import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { AccountHistoryStatus, AccountWithHistoryStatus, Currency } from 'app/api/models';
import { FormatService } from 'app/core/format.service';


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
export class AccountStatusViewComponent implements OnInit {

  @Input() account: AccountWithHistoryStatus;

  indicators: StatusIndicator[];
  status: AccountHistoryStatus;
  currency: Currency;

  constructor(
    private i18n: I18n,
    private format: FormatService) {
  }

  ngOnInit() {
    const status = this.account.status;
    this.status = status;
    this.currency = this.account.currency;

    this.indicators = [];
    const add = (amount: string, label: string, alwaysNegative: boolean = false) => {
      if (amount) {
        this.indicators.push({ amount: amount, label: label, alwaysNegative: alwaysNegative });
      }
    };
    add(status.balance, this.i18n('Balance'));
    if (status.availableBalance !== status.balance) {
      add(status.availableBalance, this.i18n('Available balance'));
    }
    if (status.reservedAmount && !this.format.isZero(status.reservedAmount)) {
      add(status.reservedAmount, this.i18n('Reserved amount'), true);
    }
    if (status.creditLimit && !this.format.isZero(status.creditLimit)) {
      add(status.creditLimit, this.i18n('Negative limit'));
    }
    if (status.upperCreditLimit && !this.format.isZero(status.upperCreditLimit)) {
      add(status.upperCreditLimit, this.i18n('Positive limit'));
    }
    if (status.balanceAtBegin != null) {
      add(status.balanceAtBegin, this.i18n('Balance on {{date}}', {
        date: this.format.formatAsDate(status.beginDate)
      }));
    }
    if (status.balanceAtEnd != null) {
      add(status.balanceAtEnd, this.i18n('Balance on {{date}}', {
        date: this.format.formatAsDate(status.endDate)
      }));
    }
    if (status.netInflow != null) {
      add(status.netInflow, this.i18n('Net inflow'));
    }
  }
}
