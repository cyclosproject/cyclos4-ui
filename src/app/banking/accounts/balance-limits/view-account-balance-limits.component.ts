import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AccountBalanceLimitsData } from 'app/api/models';
import { BalanceLimitsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/shared/base-page.component';
import { BehaviorSubject } from 'rxjs';

export type BalanceLimitsStep = 'details' | 'history';

/**
 * View the balance limits of an account
 */
@Component({
  selector: 'view-account-balance-limits',
  templateUrl: 'view-account-balance-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAccountBalanceLimitsComponent
  extends BasePageComponent<AccountBalanceLimitsData>
  implements OnInit {

  user: string;
  accountType: string;
  detailsHeadingActions: HeadingAction[];
  historyHeadingActions: HeadingAction[];
  step$ = new BehaviorSubject<BalanceLimitsStep>('details');

  constructor(
    injector: Injector,
    private balanceLimitsService: BalanceLimitsService) {
    super(injector);
  }

  get step(): BalanceLimitsStep {
    return this.step$.value;
  }
  set step(step: BalanceLimitsStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.accountType = this.route.snapshot.params.accountType;
    this.addSub(this.balanceLimitsService.getAccountBalanceLimits({ user: this.user, accountType: this.accountType })
      .subscribe(data => this.data = data));
  }

  onDataInitialized(data: AccountBalanceLimitsData) {
    super.onDataInitialized(data);
    this.detailsHeadingActions =
      data.editable ? [new HeadingAction('edit', this.i18n.general.edit, () => this.navigateToEdit(), true)] : [];
    this.detailsHeadingActions.push(new HeadingAction('history', this.i18n.general.viewHistory, () => this.showHistory(), true));
    this.headingActions = this.detailsHeadingActions;

    this.historyHeadingActions =
      data.editable ? [new HeadingAction('edit', this.i18n.general.edit, () => this.navigateToEdit(), true)] : [];
    this.historyHeadingActions.push(new HeadingAction('arrow_back', this.i18n.general.details, () => this.showView(), true));
  }

  upperCreditLimitMode(): string {
    if (this.data.upperCreditLimit) {
      return this.data.customUpperCreditLimit ?
        this.i18n.account.balanceLimits.personalized : this.i18n.account.balanceLimits.productDefault;
    } else {
      return this.data.customUpperCreditLimit ? this.i18n.account.balanceLimits.unlimited : this.i18n.account.balanceLimits.productDefault;
    }
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
    this.router.navigate(['/banking', this.user, 'account-balance-limits', this.accountType, 'edit']);
  }

  resolveMenu() {
    return this.authHelper.searchUsersMenu();
  }
}
