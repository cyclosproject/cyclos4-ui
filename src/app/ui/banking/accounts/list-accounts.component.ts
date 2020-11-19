import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AccountWithStatus, EntityReference } from 'app/api/models';
import { OwnerAccountsListData } from 'app/api/models/owner-accounts-list-data';
import { AccountsService } from 'app/api/services/accounts.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * List accounts
 */
@Component({
  selector: 'list-accounts',
  templateUrl: 'list-accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListAccountsComponent
  extends BasePageComponent<OwnerAccountsListData>
  implements OnInit {

  self: boolean;
  owner: string;

  constructor(
    injector: Injector,
    private accountsService: AccountsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.owner = this.route.snapshot.params.owner;
    this.addSub(this.accountsService.getOwnerAccountsListData({ owner: this.owner }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: OwnerAccountsListData) {
    this.self = this.authHelper.isSelfOrOwner(data.user);
  }

  path(accountType: EntityReference) {
    return ['/banking', this.owner, 'account', accountType.id];
  }

  get toLink() {
    return (row: AccountWithStatus) => this.path(row.type);
  }

  resolveMenu() {
    return ApiHelper.SYSTEM === this.owner || ApiHelper.SELF === this.owner ? Menu.ACCOUNTS_SUMMARY : this.menu.searchUsersMenu();
  }
}
