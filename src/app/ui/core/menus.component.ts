import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { LayoutService } from 'app/core/layout.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { blurIfClick } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { MenuDensity } from 'app/ui/core/menu-density';
import { MenuService } from 'app/ui/core/menu.service';
import { ActiveMenu, BaseMenuEntry, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/ui/shared/menu';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';

/**
 * Returns the anchor id for the given menu entry
 * @param entry The menu entry
 */
export function menuAnchorId(entry: BaseMenuEntry) {
  if (entry instanceof RootMenuEntry) {
    return `menu_${entry.rootMenu}`;
  } else if (entry instanceof MenuEntry) {
    return `menu_${entry.menu.root}_${entry.menu.name}`;
  }
}

/**
 * Renders menus in a bar, either the top bar or a dedicated menu bar
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'menus',
  templateUrl: 'menus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenusComponent extends AbstractComponent implements OnInit {

  /** Export to template */
  menuAnchorId = menuAnchorId;

  @Input() roots: RootMenuEntry[];
  @Input() userName: string;
  @Input() activeMenu: ActiveMenu;
  @Input() menuType: MenuType;
  @Input() density: MenuDensity;
  @Input() tooltipForNonActive: boolean;
  @Output() dropdownShown = new EventEmitter<RootMenuEntry>();
  @Output() dropdownHidden = new EventEmitter<RootMenuEntry>();

  onTop: boolean;

  constructor(
    injector: Injector,
    private menu: MenuService,
    public layout: LayoutService,
    public breadcrumb: BreadcrumbService) {
    super(injector);
  }

  get activeRoot(): RootMenu {
    return this.activeMenu == null ? null : this.activeMenu.menu.root;
  }

  ngOnInit() {
    super.ngOnInit();
    this.onTop = !this.dataForFrontendHolder.dataForFrontend.menuBar;
  }

  ngClass(root: RootMenuEntry): string[] {
    const res: string[] = ['nav-item', 'menu-item'];
    if (this.density) {
      res.push(`density-${this.density}`);
    }
    if (this.activeRoot === root.rootMenu) {
      res.push('active');
    }
    return res;
  }

  onClick(event: MouseEvent, element: HTMLElement, base: BaseMenuEntry, dropdown?: BsDropdownDirective) {
    event.stopPropagation();
    event.preventDefault();

    blurIfClick(element, event);

    if (base instanceof RootMenuEntry && dropdown) {
      dropdown.show();
      return;
    }

    // Hide the dropdown, if any
    if (dropdown) {
      dropdown.hide();
    }

    let entry: MenuEntry = null;
    if (base instanceof MenuEntry) {
      entry = base;
    } else if (base instanceof RootMenuEntry) {
      entry = base.entries[0];
    }
    this.menu.navigate({
      entry,
      event,
    });
  }
}
