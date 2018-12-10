import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Account, AccountBalanceHistoryResult, TimeFieldEnum, AccountHistoryResult } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { ISO_DATE } from 'app/core/format.service';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';

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

  @Input() accounts: Account[];

  histories$ = new BehaviorSubject<AccountBalanceHistoryResult[]>(null);
  lastPayments: { [key: string]: BehaviorSubject<AccountHistoryResult[]> } = {};

  constructor(injector: Injector,
    private accountsService: AccountsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const observables: Observable<AccountBalanceHistoryResult>[] = [];
    for (const account of this.accounts) {
      observables.push(this.accountsService.getAccountBalanceHistory({
        fields: ['account.id', 'account.status.balance', 'account.currency', 'account.type', 'balances'],
        owner: ApiHelper.SELF,
        accountType: account.type.id,
        datePeriod: [this.dataForUiHolder.now().subtract(6, 'months').startOf('month').format(ISO_DATE)],
        intervalUnit: TimeFieldEnum.MONTHS
      }));
      this.lastPayments[account.id] = new BehaviorSubject(null);
    }
    this.addSub(forkJoin(observables).subscribe(h => {
      this.histories$.next(h);
      this.notifyReady();
    }));
    for (const account of this.accounts) {
      this.addSub(this.accountsService.searchAccountHistory({
        fields: [],
        owner: 'self',
        accountType: account.type.id,
        direction: 'credit',
        pageSize: 3
      }).subscribe(transfers => {
        this.lastPayments[account.id].next(transfers);
      }));
    }
  }

  title(history: AccountBalanceHistoryResult) {
    if (this.accounts.length === 1) {
      // Single account, use a generic 'Account status' title
      return this.i18n('Account status');
    } else {
      // Multiple accounts: use the account type name as title
      return history.account.type.name;
    }
  }

  accountPath(history: AccountBalanceHistoryResult): string[] {
    const type = history.account.type;
    return ['/banking', 'account', ApiHelper.internalNameOrId(type)];
  }

  headingActions(history: AccountBalanceHistoryResult): HeadingAction[] {
    return [{
      icon: 'search',
      label: this.i18n('View'),
      maybeRoot: true,
      onClick: () => this.router.navigate(this.accountPath(history))
    }];
  }

  subjectName(row: AccountHistoryResult): string {
    return ApiHelper.subjectName(row, this.format);
  }

  transferPath(row: AccountHistoryResult): string[] {
    return ['/banking', 'transfer', ApiHelper.transactionNumberOrId(row)];
  }
}
