import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from "@angular/router";
import { AccountsService } from "app/api/services";
import { AccountWithStatus } from "app/api/models";
import { NotificationService } from "app/core/notification.service";
import { AccountMessages } from "app/messages/account-messages";
import { Notification } from "app/shared/notification";
import { NotificationType } from "app/shared/notification-type";
import { DataSource, CollectionViewer } from "@angular/cdk";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { LayoutService } from "app/core/layout.service";

/**
 * Diplays all user accounts with their statuses, allowing to go to each account details
 */
@Component({
  selector: 'accounts-overview',
  templateUrl: 'accounts-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsOverviewComponent implements OnInit {
  constructor(
    private accountsService: AccountsService,
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    public accountMessages: AccountMessages,
    public layout: LayoutService
  ) { }

  noAccountsNotification: Notification;
  
  dataSource = new AccountsOverviewDataSource();

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['aggregated', 'balance'];
    } else {
      return ['type', 'number', 'balance'];
    }
  }

  ngOnInit() {
    this.accountsService.listAccountsByOwner({owner: 'self'})
      .then(response => {
        let accounts = response.data || [];
        if (accounts.length == 1) {
          // Single account - redirect to the account history
          this.showHistory(accounts[0]);
        } else if (accounts.length > 0) {
          // Multiple accounts: show them all
          this.dataSource.data.next(accounts);
          this.changeDetector.markForCheck();
        } else {
          // No accounts to display
          this.noAccountsNotification = Notification.error(
            this.accountMessages.accountsOverviewErrorNoAccounts());
          this.changeDetector.markForCheck();
        }
      });
  }

  showHistory(account: AccountWithStatus) {
    let type = account.type.internalName || account.type.id;
    this.router.navigate(['/accounts/history', type]);
  }
}

export class AccountsOverviewDataSource extends DataSource<AccountWithStatus> {
  data: BehaviorSubject<AccountWithStatus[]> = new BehaviorSubject([]);
  
  connect(collectionViewer: CollectionViewer): Observable<AccountWithStatus[]> {
    return this.data;
  }

  disconnect(collectionViewer: CollectionViewer): void {
  }
}