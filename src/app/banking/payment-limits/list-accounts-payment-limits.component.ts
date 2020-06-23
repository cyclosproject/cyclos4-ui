import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { EntityReference } from 'app/api/models';
import { UserAccountPaymentLimitsListData } from 'app/api/models/user-account-payment-limits-list-data';
import { PaymentLimitsService } from 'app/api/services/payment-limits.service';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * List the user accounts' payment limits
 */
@Component({
  selector: 'list-accounts-payment-limits',
  templateUrl: 'list-accounts-payment-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListAccountsPaymentLimitsComponent
  extends BasePageComponent<UserAccountPaymentLimitsListData>
  implements OnInit {

  user: string;

  constructor(
    injector: Injector,
    private paymentLimitsService: PaymentLimitsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.paymentLimitsService.getDataForUserPaymentLimits({ user: this.user }).subscribe(data => {
      if (data.accountLimits.length === 1) {
        this.router.navigate(this.path(data.accountLimits[0].account.type));
      }
      this.data = data;
    }
    ));
  }

  path(accountType: EntityReference) {
    return ['/banking', this.user, 'account-payment-limits', accountType.id];
  }

  resolveMenu() {
    return this.authHelper.searchUsersMenu();
  }
}
