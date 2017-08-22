import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { DataForAccountHistory, AccountHistoryResult, AccountKind } from "app/api/models";
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
import { ModelHelper } from "app/shared/model-helper";

/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'account-history',
  templateUrl: 'account-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountHistoryComponent extends BaseBankingComponent {
  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private route: ActivatedRoute
  ) {
    super(injector);
  }

  data: DataForAccountHistory;
  dataSource = new TableDataSource<AccountHistoryResult>(this.changeDetector);

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['avatar', 'aggregated', 'amount'];
    } else {
      return ['avatar', 'date', 'subject', 'amount'];
    }
  }

  ngOnInit() {
    super.ngOnInit();
    // Get the account history data
    this.route.params.switchMap(
      (params: Params) => this.accountsService.getAccountHistoryDataByOwnerAndType({
        owner: ModelHelper.SELF, accountType: params.type
      }))
      .subscribe(response => {
        this.data = response.data;

        // Fetch the account history
        let query: any = this.data.query;
        query.owner = ModelHelper.SELF;
        query.accountType = this.data.account.type.id;
        this.accountsService.searchAccountHistory(query)
          .then(response => {
            this.dataSource.data = response.data;
            this.detectChanges();
          });
      });
  }

  subjectName(row: AccountHistoryResult): string {
    if (row.relatedAccount.kind == AccountKind.USER) {
      // Show the user display
      return row.relatedAccount.user.display;
    } else {
      if (row.type && row.type.from) {
        // Show the system account type name
        return this.format.negative(row.amount)
          ? row.type.to.name
          : row.type.from.name;
      } else {
        // Some older cyclos versions didn't send from / to
        return this.generalMessages.system();
      }
    }
  }
}