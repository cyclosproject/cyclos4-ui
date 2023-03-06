import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { DataForFrontendHome } from 'app/api/models';
import { Breakpoint } from 'app/core/layout.service';
import { Arrows } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { blurIfClick, handleKeyboardFocus } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { MenuService, NavigateParams } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/dashboard/base-dashboard.component';
import { QuickAccessAction } from 'app/ui/dashboard/quick-access-action';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the quick access, which are links to common actions
 */
@Component({
  selector: 'quick-access',
  templateUrl: 'quick-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAccessComponent extends BaseDashboardComponent implements OnInit {
  /** Export to template */
  blurIfClick = blurIfClick;

  @Input() data: DataForFrontendHome;
  @Input() actions: QuickAccessAction[];
  itemClass$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private menu: MenuService,
    private breadcrumb: BreadcrumbService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Quick access
    const dataForFrontend = this.dataForFrontendHolder.dataForFrontend;
    if (this.layout.gtsm && dataForFrontend.canManageQuickAccess) {
      this.headingActions = [
        new HeadingAction(SvgIcon.Gear, this.i18n.dashboard.customizeQuickAccess,
          event => this.menu.navigate({
            menu: new ActiveMenu(Menu.QUICK_ACCESS_SETTINGS),
            clear: false,
            event
          }), true)
      ];
    }


    // Handle keyboard shortcuts: arrows to navigate correctly on the grid
    this.addShortcut(Arrows, event => {
      handleKeyboardFocus(this.layout, this.element, event, {
        horizontalOffset: 1, verticalOffset: 2,
      });
    });

    // Also add a shortcut on each action by number
    for (let i = 0; i < 9 && i < this.actions.length; i++) {
      const action = this.actions[i];
      this.addShortcut(String(i + 1), e => {
        if (this.layout.gtxs) {
          // Ignore if not on mobile
          return false;
        }
        this.navigate(action, e);
      });
    }

    this.updateItemClass(this.layout.activeBreakpoints);
    this.addSub(this.layout.breakpointChanges$.subscribe(b => this.updateItemClass(b)));
    this.fullWidth = this.actions.length > 6;
  }

  private updateItemClass(breakpoints: Set<Breakpoint>) {
    // Maximum number of items for the current resolution
    const max = breakpoints.has('lt-sm') ? 2
      : breakpoints.has('sm') ? 3
        : breakpoints.has('md') ? 5
          : breakpoints.has('lg') ? 6
            : 8;

    const len = this.actions.length;
    // With up to 6 items, we will show them in a box with the same height as others.
    // With more than 6 items, the dashboard will take up full width and up to 8 items fit.
    let size: number;
    if (len <= 6) {
      size = Math.min(max, 3);
    } else {
      const lines = Math.ceil(len * 1.0 / max);
      size = Math.ceil(len / lines);
    }
    this.itemClass$.next(`quick-access-item-container-${size}`);
  }

  navigate(action: QuickAccessAction, event?: Event) {
    if (action.onClick) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      action.onClick();
    } else {
      this.breadcrumb.clear();
      this.breadcrumb.breadcrumb$.next(['/']);
      let params: NavigateParams = { clear: false, event };
      if (action.url) {
        params.url = action.url;
        params.menu = action.entry.activeMenu;
      } else {
        params.entry = action.entry;
      }
      this.menu.navigate(params);
    }
  }

  shortcutKey(action: QuickAccessAction): string {
    if (this.layout.xxs) {
      const index = this.actions.indexOf(action);
      if (index >= 0 && index < 9) {
        return String(index + 1);
      }
    }
  }
}
