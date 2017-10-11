import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DataForAccountHistory, Currency, EntityReference, AccountHistoryResult, AccountKind, AccountHistoryStatus } from "app/api/models";
import { AccountsService } from "app/api/services";

import 'rxjs/add/operator/switchMap';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { LayoutService } from "app/core/layout.service";
import { BankingMessages } from "app/messages/banking-messages";
import { GeneralMessages } from "app/messages/general-messages";
import { FormatService } from "app/core/format.service";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { TableDataSource } from "app/shared/table-datasource";
import { ApiHelper } from "app/shared/api-helper";
import { Menu } from 'app/shared/menu';

/** Information for an account status element shown on top */
export type StatusIndicator = {
  label: string,
  amount: string
}

/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'account-history',
  templateUrl: 'account-history.component.html',
  styleUrls: ['account-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountHistoryComponent extends BaseBankingComponent {
  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(injector);
  }

  menu = Menu.ACCOUNT;

  data: DataForAccountHistory;
  query: any;
  dataSource = new TableDataSource<AccountHistoryResult>(this.changeDetector);
  status = new BehaviorSubject<StatusIndicator[]>([]);

  get type(): EntityReference {
    return this.data ? this.data.account.type : null;
  }

  get currency(): Currency {
    return this.data ? this.data.account.currency : null;
  }

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['avatar', 'aggregated', 'amount'];
    } else {
      return ['avatar', 'date', 'subject', 'amount'];
    }
  }

  ngOnInit() {
    super.ngOnInit();

    // Resolve the account type
    let type = this.route.snapshot.params.type;
    if (type == null) {
      // No account type given - get the first one
      let firstType = this.firstAccountType;
      if (firstType == null) {
        this.notification.error(this.bankingMessages.accountErrorNoAccounts());
      } else {
        this.router.navigateByUrl('/banking/account/' + this.firstAccountType)
      }
    }

    // Get the account status
    this.accountsService.getAccountStatusByOwnerAndType({
      owner: ApiHelper.SELF, accountType: type, fields: ['status']
    })
      .then(response => {
        this.status.next(this.toIndicators(response.data.status));
      });

    // Get the account history data
    this.accountsService.getAccountHistoryDataByOwnerAndType({
      owner: ApiHelper.SELF, accountType: type
    })
      .then(response => {
        this.data = response.data;

        // Fetch the account history
        this.query = this.data.query;
        this.query.owner = ApiHelper.SELF;
        this.query.accountType = this.data.account.type.id;
        this.update();
      });
  }

  update() {
    this.accountsService.searchAccountHistory(this.query)
      .then(response => {
        this.dataSource.data = response.data;
      });
  }

  private toIndicators(status: AccountHistoryStatus): StatusIndicator[] {
    let result: StatusIndicator[] = [];
    let add = (amount: string, label: string) => {
      if (amount) {
        result.push({amount: amount, label: label});
      }
    }
    if (status.availableBalance != status.balance) {
      add(status.availableBalance, this.bankingMessages.accountAvailableBalance());
    }
    add(status.balance, this.bankingMessages.accountBalance());
    if (status.reservedAmount && !this.format.isZero(status.reservedAmount)) {
      add(status.reservedAmount, this.bankingMessages.accountReservedAmount());
    }
    if (status.creditLimit && !this.format.isZero(status.creditLimit)) {
      add(status.creditLimit, this.bankingMessages.accountCreditLimit());
    }
    if (status.upperCreditLimit && !this.format.isZero(status.upperCreditLimit)) {
      add(status.upperCreditLimit, this.bankingMessages.accountUpperCreditLimit());
    }
    return result;
  }

  private get firstAccountType(): string {
    let accounts = ((this.login.auth || {}).permissions || {}).accounts;
    if (accounts && accounts.length > 0) {
      return ApiHelper.internalNameOrId(accounts[0].account.type);
    } else {
      return null;
    }
  }

  subjectName(row: AccountHistoryResult): string {
    if (row.relatedAccount.kind == AccountKind.USER) {
      // Show the user display
      return row.relatedAccount.user.display;
    } else {
      if (row.type && row.type.from) {
        // Show the system account type name
        return this.format.isNegative(row.amount)
          ? row.type.to.name
          : row.type.from.name;
      } else {
        // Some older cyclos versions didn't send from / to
        return this.generalMessages.system();
      }
    }
  }
}