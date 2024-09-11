import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { EntityReference, UserAccountBalanceLimitsListData } from 'app/api/models';
import { BalanceLimitsService } from 'app/api/services/balance-limits.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

/**
 * List the user accounts' balance limits
 */
@Component({
  selector: 'list-accounts-balance-limits',
  templateUrl: 'list-accounts-balance-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListAccountsBalanceLimitsComponent
  extends BasePageComponent<UserAccountBalanceLimitsListData>
  implements OnInit
{
  user: string;

  constructor(injector: Injector, private balanceLimitsService: BalanceLimitsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(
      this.balanceLimitsService.getDataForUserBalanceLimits({ user: this.user }).subscribe(data => {
        if (data.accountLimits.length === 1) {
          this.router.navigate(this.path(data.accountLimits[0].account.type), {
            replaceUrl: true
          });
        } else {
          this.data = data;
        }
      })
    );
  }

  path(accountType: EntityReference) {
    return ['/banking', this.user, 'account-balance-limits', accountType.id];
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
