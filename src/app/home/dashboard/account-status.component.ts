import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Account, AccountBalanceHistoryResult, AccountHistoryResult, Currency, TimeFieldEnum, TransferDirectionEnum } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { ISO_DATE } from 'app/core/format.service';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { ActiveMenu, Menu } from 'app/shared/menu';

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

    // The balance history is always fetched
    const observables: Observable<any>[] = [
      this.accountsService.getAccountBalanceHistory({
        fields: ['account.id', 'account.status.balance', 'account.currency', 'account.type', 'balances'],
        owner: ApiHelper.SELF,
        accountType: this.account.type.id,
        datePeriod: [this.dataForUiHolder.now().subtract(6, 'months').startOf('month').format(ISO_DATE)],
        intervalUnit: TimeFieldEnum.MONTHS
      })
    ];

    if (this.maxTransfers > 0) {
      // Also fetch some transfers
      observables.push(this.accountsService.searchAccountHistory({
        fields: [],
        owner: 'self',
        accountType: this.account.type.id,
        direction: TransferDirectionEnum.CREDIT,
        pageSize: this.maxTransfers,
        skipTotalCount: true
      }));
    }

    this.addSub(forkJoin(observables).subscribe(result => {
      // The first array element is always available
      const history = result[0] as AccountBalanceHistoryResult;
      this.history$.next(history);
      this.currency = history.account.currency;
      this.account = history.account;
      this.balance = history.account.status.balance;

      if (result.length > 1) {
        const lastPayments = result[1] as AccountHistoryResult[];
        this.lastPayments$.next(lastPayments);
      }
    }));
  }

  subjectName(row: AccountHistoryResult): string {
    return this.bankingHelper.subjectName(row);
  }

  viewTransfer(row: AccountHistoryResult, event: MouseEvent) {
    const tx = this.bankingHelper.transactionNumberOrId(row);
    this.menu.navigate({
      url: `/banking/transfer/${this.account.id}/${tx}`,
      menu: new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: this.account.type }),
      clear: false,
      event: event
    });
  }
}
