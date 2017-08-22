import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Router } from "@angular/router";
import { AccountsService } from "app/api/services";
import { AccountWithStatus } from "app/api/models";
import { NotificationService } from "app/core/notification.service";
import { BankingMessages } from "app/messages/banking-messages";
import { Notification } from "app/shared/notification";
import { NotificationType } from "app/shared/notification-type";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { LayoutService } from "app/core/layout.service";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { TableDataSource } from "app/shared/table-datasource";
import { ModelHelper } from "app/shared/model-helper";

/**
 * Diplays all user accounts with their statuses, allowing to go to each account details
 */
@Component({
  selector: 'accounts-overview',
  templateUrl: 'accounts-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsOverviewComponent extends BaseBankingComponent {
  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private router: Router
  ) {
    super(injector);
  }

  noAccountsNotification: Notification;
  
  dataSource = new TableDataSource<AccountWithStatus>(this.changeDetector);

  get displayedColumns(): string[] {
    if (this.layout.xs) {
      return ['aggregated', 'balance'];
    } else {
      return ['type', 'number', 'balance'];
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.accountsService.listAccountsByOwner({owner: ModelHelper.SELF})
      .then(response => {
        let accounts = response.data || [];
        if (accounts.length == 1) {
          // Single account - redirect to the account history
          this.showHistory(accounts[0]);
        } else if (accounts.length > 0) {
          // Multiple accounts: show them all
          this.dataSource.data = accounts;
        } else {
          // No accounts to display
          this.noAccountsNotification = Notification.error(
            this.bankingMessages.accountsOverviewErrorNoAccounts());
          this.detectChanges();
        }
      });
  }

  showHistory(account: AccountWithStatus) {
    let type = account.type.internalName || account.type.id;
    this.router.navigate(['/banking/accounts', type]);
  }
}
