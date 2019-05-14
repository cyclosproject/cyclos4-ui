import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Account, AccountBalanceHistoryResult, AccountHistoryResult, Currency, TimeFieldEnum, TransferDirectionEnum } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { ISO_DATE } from 'app/core/format.service';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs';
import { BankingHelperService } from 'app/core/banking-helper.service';

/**
 * Displays the status of an account.
 * Shows information such as balance, available balance, etc.
 */
@Component({
  selector: 'account-status',
  templateUrl: 'account-status.component.html',
  styleUrls: ['account-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountStatusComponent extends BaseDashboardComponent implements OnInit {

  @Input() account: Account;
  @Input() maxTransfers: number;

  history$ = new BehaviorSubject<AccountBalanceHistoryResult>(null);
  lastPayments$ = new BehaviorSubject<AccountHistoryResult[]>(null);
  title: string;
  headingActions: HeadingAction[];
  currency: Currency;
  balance: string;

  constructor(injector: Injector,
    private bankingHelper: BankingHelperService,
    private accountsService: AccountsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // TODO once we implement management over user accounts, this won't work
    const singleAccount = this.bankingHelper.ownerAccountTypes().length === 1;
    if (singleAccount) {
      // Single account - use a generic title
      this.title = this.i18n.dashboard.accountStatus;
    } else {
      // Multiple accounts - use the account type name
      this.title = this.account.type.name;
    }

    // The heading actions
    this.headingActions = [
      new HeadingAction('search', this.i18n.general.view,
        event => this.menu.navigate({
          entry: this.menu.accountEntry(this.account.type),
          clear: false,
          event: event
        }),
        true)
    ];

    // Fetch the balance history
    this.addSub(this.accountsService.getAccountBalanceHistory({
      fields: ['account.id', 'account.status.balance', 'account.currency', 'account.type', 'balances'],
      owner: ApiHelper.SELF,
      accountType: this.account.type.id,
      datePeriod: [this.dataForUiHolder.now().subtract(6, 'months').startOf('month').format(ISO_DATE)],
      intervalUnit: TimeFieldEnum.MONTHS
    }).subscribe(history => {
      this.history$.next(history);
      this.currency = history.account.currency;
      this.account = history.account;
      this.balance = history.account.status.balance;
    }));

    // If we need to show the max transfers, fetch them
    if (this.maxTransfers > 0) {
      this.addSub(this.accountsService.searchAccountHistory({
        fields: [],
        owner: 'self',
        accountType: this.account.type.id,
        direction: TransferDirectionEnum.CREDIT,
        pageSize: 3
      }).subscribe(transfers => {
        this.lastPayments$.next(transfers);
      }));
    }
  }

  subjectName(row: AccountHistoryResult): string {
    return this.bankingHelper.subjectName(row);
  }

  viewTransfer(row: AccountHistoryResult, event: MouseEvent) {
    this.menu.setActiveAccountType(this.account.type);
    const tx = this.bankingHelper.transactionNumberOrId(row);
    this.menu.navigate({
      url: `/banking/transfer/${tx}`,
      clear: false,
      event: event
    });
  }
}
