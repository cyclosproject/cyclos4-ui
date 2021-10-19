import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FrontendDashboardAccount } from 'app/api/models';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';

/**
 * Displays the combined status of multiple accounts.
 */
@Component({
  selector: 'combined-account-status',
  templateUrl: 'combined-account-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombinedAccountStatusComponent extends BaseDashboardComponent {

  @Input() accounts: FrontendDashboardAccount[];

  constructor(
    injector: Injector,
    public menu: MenuService) {
    super(injector);
  }

  private isFull(i: number): boolean {
    if (this.accounts.length < 3) {
      return true;
    } else if (this.accounts.length === 3) {
      // Only the first one is full
      return i === 0;
    } else {
      return false;
    }
  }

  cellClass(i: number): string {
    return this.isFull(i) ? 'col-12' : 'col-6';
  }
  chartWidth(i: number): number {
    return this.isFull(i) ? 600 : 320;
  }
  chartHeight(i: number): number {
    return this.isFull(i) ? 120 : 140;
  }
  lineBreak(i: number): boolean {
    switch (this.accounts.length) {
      case 2:
      case 3:
        return i == 1;
      case 4:
        return i == 2;
      default:
        return false;
    }
  }
}
