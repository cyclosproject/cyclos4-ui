import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Currency, UsersWithBalanceSummary } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows the users balances summary
 */
@Component({
  selector: 'balances-summary',
  templateUrl: 'balances-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalancesSummaryComponent extends BaseComponent implements OnInit {
  @Input() summary$: BehaviorSubject<UsersWithBalanceSummary>;
  @Input() currency: Currency;

  hasYellowRange$ = new BehaviorSubject<boolean>(false);

  get summary(): UsersWithBalanceSummary {
    return this.summary$.value;
  }

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.summary$.subscribe(summary => this.hasYellowRange$.next(!!summary.low));
  }

  totalSum(totalSum: string | number): string {
    return this.i18n.account.userBalances.total + ': ' + totalSum;
  }
}
