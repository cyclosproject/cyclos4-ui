import { RootMenu, Menu } from 'app/shared/menu';
import { User } from 'app/api/models';
import { Injector } from '@angular/core';

/**
 * Parameters used to select which banners to show
 */
export interface BannerFilter {

  /** The last selected root */
  root: RootMenu;

  /** The last selected menu item  */
  menu?: Menu;

  /** The logged user, or null for guests */
  user?: User;

  /** The Angular injector, used to access shared services */
  injector: Injector;

}
