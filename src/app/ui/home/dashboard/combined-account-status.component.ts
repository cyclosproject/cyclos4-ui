import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Account, AccountBalanceHistoryResult, TimeFieldEnum } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { ISO_DATE } from 'app/core/format.service';
import { ApiHelper } from 'app/shared/api-helper';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the combined status of multiple accounts.
 */
@Component({
  selector: 'combined-account-status',
  templateUrl: 'combined-account-status.component.html',
  styleUrls: ['combined-account-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombinedAccountStatusComponent extends BaseDashboardComponent implements OnInit {

  @Input() accounts: Account[];
  cellClass: string;
  chartWidth: number;
  chartHeight: number;

  histories: BehaviorSubject<AccountBalanceHistoryResult>[] = [];

  constructor(
    injector: Injector,
    public menu: MenuService,
    private accountsService: AccountsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const two = this.accounts.length === 2;
    this.cellClass = two ? 'col-12' : 'col-6';
    this.chartWidth = two ? 600 : 320;
    this.chartHeight = two ? 120 : 140;

    // Initialize the subjects for balance histories if up to 2 accounts
    for (const account of this.accounts) {
      const balanceHistory$ = new BehaviorSubject<AccountBalanceHistoryResult>(null);
      this.histories.push(balanceHistory$);
      this.addSub(this.accountsService.getAccountBalanceHistory({
        fields: ['account.id', 'account.status.balance', 'account.currency', 'account.type', 'balances'],
        owner: ApiHelper.SELF,
        accountType: account.type.id,
        datePeriod: [this.dataForUiHolder.now().subtract(6, 'months').startOf('month').format(ISO_DATE)],
        intervalUnit: TimeFieldEnum.MONTHS,
      }).subscribe(result => {
        balanceHistory$.next(result);
      }));
    }
  }
}
