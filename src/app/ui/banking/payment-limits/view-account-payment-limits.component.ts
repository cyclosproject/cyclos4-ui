import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AccountBalanceLimitsData, AccountPaymentLimitsData } from 'app/api/models';
import { PaymentLimitsService } from 'app/api/services/payment-limits.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { BehaviorSubject } from 'rxjs';

export type PaymentLimitsStep = 'details' | 'history';

/**
 * View the payment limits of an account
 */
@Component({
  selector: 'view-account-payment-limits',
  templateUrl: 'view-account-payment-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAccountPaymentLimitsComponent
  extends BasePageComponent<AccountPaymentLimitsData>
  implements OnInit {

  user: string;
  accountType: string;
  detailsHeadingActions: HeadingAction[];
  historyHeadingActions: HeadingAction[];
  step$ = new BehaviorSubject<PaymentLimitsStep>('details');

  constructor(
    injector: Injector,
    private paymentLimitsService: PaymentLimitsService) {
    super(injector);
  }

  get step(): PaymentLimitsStep {
    return this.step$.value;
  }
  set step(step: PaymentLimitsStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.accountType = this.route.snapshot.params.accountType;
    this.addSub(this.paymentLimitsService.getAccountPaymentLimits({ user: this.user, accountType: this.accountType })
      .subscribe(data => this.data = data));
  }

  onDataInitialized(data: AccountBalanceLimitsData) {
    super.onDataInitialized(data);
    this.detailsHeadingActions = [];
    if (data.editable) {
      this.detailsHeadingActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => this.navigateToEdit()));
    }
    this.detailsHeadingActions.push(new HeadingAction(SvgIcon.Clock, this.i18n.general.viewHistory, () => this.showHistory()));
    this.headingActions = this.detailsHeadingActions;

    this.historyHeadingActions = [];
    if (data.editable) {
      this.historyHeadingActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => this.navigateToEdit()));
    }
    this.historyHeadingActions.push(new HeadingAction(SvgIcon.ArrowLeft, this.i18n.general.details, () => this.showView()));
  }

  limitMode(custom: boolean): string {
    return custom ? this.i18n.account.limits.personalized : this.i18n.account.limits.productDefault;
  }

  showHistory() {
    this.headingActions = this.historyHeadingActions;
    this.step = 'history';
  }

  showView() {
    this.headingActions = this.detailsHeadingActions;
    this.step = 'details';
  }

  navigateToEdit() {
    this.router.navigate(['/banking', this.user, 'account-payment-limits', this.accountType, 'edit']);
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
