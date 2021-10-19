import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AccountHistoryResult, FrontendDashboardAccount } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';
import { ChartData } from 'app/ui/shared/chart-data';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';

/**
 * Displays the status of an account, with a graph of balance history and last incoming transfers.
 */
@Component({
  selector: 'account-status',
  templateUrl: 'account-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusComponent extends BaseDashboardComponent implements OnInit {

  @Input() account: FrontendDashboardAccount;

  title: string;
  chartData: ChartData[];

  get type() {
    return this.account.account.type;
  }

  get currency() {
    return this.account.account.currency;
  }

  get balance() {
    return (this.account.account.status || {}).balance;
  }

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService,
    private menu: MenuService) {
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
      this.title = this.type.name;
    }

    // Prepare the balances data
    if (this.account.balances?.length > 0) {
      const formatter = (value: number) => this.format.formatAsCurrency(this.account.account.currency, value);
      this.chartData = this.account.balances.map(b => ({
        label: this.format.formatAsDate(b.date),
        value: parseFloat(b.amount),
        formatter
      }));
    }

    // The heading actions
    this.headingActions = [
      new HeadingAction(SvgIcon.Search, this.i18n.general.view,
        event => this.menu.navigate({
          entry: this.menu.accountEntry(this.type),
          clear: false,
          event,
        }),
        true),
    ];
  }

  subjectName(row: AccountHistoryResult): string {
    return row.relatedName || this.bankingHelper.subjectName(row.relatedAccount);
  }

  viewTransfer(row: AccountHistoryResult, event: MouseEvent) {
    const tx = this.bankingHelper.transactionNumberOrId(row);
    this.menu.navigate({
      url: `/banking/transfer/${this.account.id}/${tx}`,
      menu: new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: this.type }),
      clear: false,
      event,
    });
  }
}
