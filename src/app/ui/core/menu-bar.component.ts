import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Breakpoint } from 'app/core/layout.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { LoginService } from 'app/ui/core/login.service';
import { MenuDensity } from 'app/ui/core/menu-density';
import { MenuService } from 'app/ui/core/menu.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { ActiveMenu, MenuType, RootMenuEntry } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

const MenuThesholdLarge = 5;
const MenuThesholdExtraLarge = 6;

/**
 * A bar displayed on large layouts with the root menu items
 */
@Component({
  selector: 'menu-bar',
  templateUrl: 'menu-bar.component.html',
  styleUrls: ['menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent extends AbstractComponent implements OnInit {

  // Export to the template
  MenuType = MenuType;

  roots$: Observable<RootMenuEntry[]>;

  constructor(
    injector: Injector,
    public uiLayout: UiLayoutService,
    public login: LoginService,
    private menu: MenuService) {
    super(injector);
  }

  @Input() activeMenu: ActiveMenu;

  ngOnInit() {
    super.ngOnInit();
    this.roots$ = this.menu.menu(MenuType.BAR);
  }

  density(roots: RootMenuEntry[], breakpoints: Set<Breakpoint>): MenuDensity {
    const threshold = breakpoints.has('xl') ? MenuThesholdExtraLarge : MenuThesholdLarge;
    return roots.length > threshold ? MenuDensity.Dense : MenuDensity.Medium;
  }

}
