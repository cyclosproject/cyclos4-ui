import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { DataSource, CollectionViewer } from "@angular/cdk";
import { DataForAccountHistory, AccountHistoryResult, AccountKind } from "app/api/models";
import { AccountsService } from "app/api/services";

import 'rxjs/add/operator/switchMap';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { LayoutService } from "app/core/layout.service";
import { AccountMessages } from "app/messages/account-messages";
import { GeneralMessages } from "app/messages/general-messages";
import { FormatService } from "app/core/format.service";

/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'account-history',
  templateUrl: 'account-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountHistoryComponent implements OnInit {
  constructor(
    private accountsService: AccountsService,
    private formatService: FormatService,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    public layout: LayoutService,
    public generalMessages: GeneralMessages,
    public accountMessages: AccountMessages
  ) { }

  data: DataForAccountHistory;
  dataSource = new AccountHistoryDataSource();

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['avatar', 'aggregated', 'amount'];
    } else {
      return ['avatar', 'date', 'subject', 'amount'];
    }
  }

  ngOnInit() {
    // Get the account history data
    this.route.params.switchMap(
      (params: Params) => this.accountsService.getAccountHistoryDataByOwnerAndType({
        owner: 'self', accountType: params.type
      }))
      .subscribe(response => {
        this.data = response.data;
        this.changeDetector.markForCheck();

        // Fetch the account history
        let query: any = this.data.query;
        query.owner = 'self';
        query.accountType = this.data.account.type.id;
        this.accountsService.searchAccountHistory(query)
          .then(response => {
            this.dataSource.data.next(response.data);
            this.changeDetector.markForCheck();
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
        return this.formatService.negative(row.amount)
          ? row.type.to.name
          : row.type.from.name;
      } else {
        // Some older cyclos versions didn't send from / to
        return this.generalMessages.system();
      }
    }
  }
}

export class AccountHistoryDataSource extends DataSource<AccountHistoryResult> {
  data: BehaviorSubject<AccountHistoryResult[]> = new BehaviorSubject([]);

  connect(collectionViewer: CollectionViewer): Observable<AccountHistoryResult[]> {
    return this.data;
  }

  disconnect(collectionViewer: CollectionViewer): void {
  }
}