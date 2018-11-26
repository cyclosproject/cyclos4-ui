import { Injector } from '@angular/core';
import { User } from 'app/api/models';
import { Menu } from 'app/shared/menu';

/**
 * Parameters used to select which banners to show
 */
export interface BannerFilter {

  /** The last selected menu item  */
  menu: Menu;

  /** The logged user, or null for guests */
  user?: User;

  /** The Angular injector, used to access shared services */
  injector: Injector;

}
