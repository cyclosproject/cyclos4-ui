import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Account, AccountWithStatus } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs';
import { HeadingAction } from 'app/shared/action';

/**
 * Displays the status of an account.
 * Shows information such as balance, available balance, etc.
 */
@Component({
  selector: 'account-status',
  templateUrl: 'account-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountStatusComponent extends BaseDashboardComponent implements OnInit {

  @Input() accounts: Account[];

  accounts$ = new BehaviorSubject<AccountWithStatus[]>(null);

  constructor(injector: Injector,
    private accountsService: AccountsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // const now = this.dataForUiHolder.now();
    // this.addSub(this.accountsService.searchAccountHistory({
    //   owner: ApiHelper.SELF,
    //   accountType: this.accountType,
    //   orderBy: 'dateDesc',
    //   pageSize: 50,
    //   datePeriod: [now.subtract(6, 'months').startOf('month').toISOString()],
    //   fields: ['date', 'amount']
    // }).subscribe(transfers => {

    // }));

    this.addSub(this.accountsService.listAccountsByOwner({
      owner: ApiHelper.SELF
    }).subscribe(accounts => {
      this.accounts$.next(accounts);
      this.notifyReady();
    }));
  }

  title(account: Account) {
    if (this.accounts.length === 1) {
      // Single account, use a generic 'Account status' title
      return this.i18n('Account status');
    } else {
      // Multiple accounts: use the account type name as title
      return account.type.name;
    }

  }


  headingActions(account: Account): HeadingAction[] {
    return [{
      icon: 'search',
      label: this.i18n('View'),
      maybeRoot: true,
      onClick: () => this.router.navigate(['/banking', 'account', ApiHelper.internalNameOrId(account.type)])
    }];
  }


}
