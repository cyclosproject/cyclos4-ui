import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Configuration } from 'app/configuration';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { MenuService } from 'app/core/menu.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { blurIfClick } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, BaseMenuEntry, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
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
  styleUrls: ['menus.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenusComponent extends AbstractComponent implements OnInit {

  /** Export to template */
  menuAnchorId = menuAnchorId;

  @Input() roots: RootMenuEntry[];
  @Input() userName: string;
  @Input() activeMenu: ActiveMenu;
  @Input() menuType: MenuType;
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

  @ViewChild('dropdown') dropdown: BsDropdownDirective;

  ngOnInit() {
    super.ngOnInit();
    this.onTop = !Configuration.menuBar;
  }

  onClick(event: MouseEvent, element: HTMLElement, base: BaseMenuEntry) {
    event.stopPropagation();
    event.preventDefault();

    blurIfClick(element, event);

    if (base instanceof RootMenuEntry) {
      if (base.dropdown) {
        this.dropdown.show();
        return;
      }
    }

    // Hide the dropdown, if any
    if (this.dropdown) {
      this.dropdown.hide();
    }

    let entry: MenuEntry = null;
    if (base instanceof MenuEntry) {
      entry = base;
    } else if (base instanceof RootMenuEntry) {
      entry = base.entries[0];
    }
    this.menu.navigate({
      entry: entry,
      event: event
    });
  }
}
