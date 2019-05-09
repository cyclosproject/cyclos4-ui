import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { I18n } from 'app/i18n/i18n';
import { HeadingAction } from 'app/shared/action';
import { LayoutService } from 'app/shared/layout.service';
import { ActionsRight, Escape, ShortcutService } from 'app/shared/shortcut.service';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, Subscription } from 'rxjs';

const HeadingActionsMenu = 'heading-actions-menu';

/**
 * Shows either a button for a single action or a dropdown when multiple actions
 */
@Component({
  selector: 'heading-actions',
  templateUrl: 'heading-actions.component.html',
  styleUrls: ['heading-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadingActionsComponent implements OnInit, OnDestroy {

  @ViewChild('dropdown') dropdown: BsDropdownDirective;

  private _actions: HeadingAction[] = [];
  @Input() get headingActions(): HeadingAction[] {
    return this._actions;
  }
  set headingActions(actions: HeadingAction[]) {
    this._actions = (actions || []).filter(a => !a.breakpoint || this.layoutService.activeBreakpoints.has(a.breakpoint));

    const singleAction = (this.headingActions || []).length === 1 ? this.headingActions[0] : null;
    this.groupActions$.next(singleAction ? !singleAction.maybeRoot : true);
  }

  groupActions$ = new BehaviorSubject(false);
  globalShortcutSub: Subscription;
  shortcutsSub: Subscription;

  constructor(
    public layoutService: LayoutService,
    public breadcrumb: BreadcrumbService,
    public i18n: I18n,
    private shortcut: ShortcutService
  ) { }

  ngOnInit() {
    this.layoutService.headingActions = this.headingActions.filter(a => !a.topBarOnly);
    this.globalShortcutSub = this.shortcut.subscribe(ActionsRight, () => {
      if (this.layoutService.gtxs) {
        // Don't show the menu when not on mobile
        return;
      }
      const focusTrap = this.layoutService.focusTrap;
      if (focusTrap != null && focusTrap !== HeadingActionsMenu) {
        // Ignore when there's some element trapping focus that is not the menu itself
        return;
      }
      const actions = this.headingActions || [];
      if (actions.length === 1) {
        // Execute the action directly
        actions[0].onClick();
      } else if (actions.length > 1) {
        // Show the menu
        this.dropdown.toggle(true);
      }
    });
  }

  ngOnDestroy() {
    if (this.globalShortcutSub) {
      this.globalShortcutSub.unsubscribe();
    }
  }

  onShown(dropdown: BsDropdownDirective) {
    this.shortcutsSub = this.shortcut.subscribe(Escape, () => dropdown.hide());
    this.layoutService.setFocusTrap(HeadingActionsMenu);
  }

  onHidden() {
    if (this.shortcutsSub) {
      this.shortcutsSub.unsubscribe();
      this.shortcutsSub = null;
    }
    this.layoutService.setFocusTrap(null);
  }
}
