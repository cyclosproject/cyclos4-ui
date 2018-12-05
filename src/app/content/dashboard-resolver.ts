import { Injector } from '@angular/core';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { Observable } from 'rxjs';

/**
 * Interface used to resolve the dashboard items for a given user
 */
export interface DashboardResolver {

  /**
   * Returns each of the dashboard items that should be shown on the dashboard page
   * @param injector The Angular injector, used to access shared services
   * @returns Either the dashboard items or an observable of the dashboard items
   */
  resolveItems(injector: Injector): DashboardItemConfig[] | Observable<DashboardItemConfig[]>;

}
