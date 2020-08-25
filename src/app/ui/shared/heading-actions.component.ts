import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick } from 'app/shared/helper';
import { ActionsRight, Escape } from 'app/core/shortcut.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { HeadingSubActionsComponent } from 'app/ui/shared/heading-sub-actions.component';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Subscription } from 'rxjs';

const HeadingActionsMenu = 'heading-actions-menu';

/**
 * Shows either a button for a single action or a dropdown when multiple actions
 */
@Component({
  selector: 'heading-actions',
  templateUrl: 'heading-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingActionsComponent extends BaseComponent implements OnInit {
  blurIfClick = blurIfClick;

  @ViewChild('dropdown') dropdown: BsDropdownDirective;

  visibleActions$ = new BehaviorSubject<HeadingAction[]>([]);

  private _actions: HeadingAction[] = [];
  @Input() get headingActions(): HeadingAction[] {
    return this._actions;
  }
  set headingActions(actions: HeadingAction[]) {
    this._actions = actions;
    this.updateVisible();
  }

  groupActions$ = new BehaviorSubject(false);
  shortcutsSub: Subscription;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private uiLayout: UiLayoutService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.uiLayout.headingActions = this.headingActions;

    this.addSub(this.shortcut.subscribe(ActionsRight, () => {
      if (this.layout.gtxs) {
        // Don't show the menu when not on mobile
        return;
      }
      const focusTrap = this.layout.focusTrap;
      if (focusTrap != null && focusTrap !== HeadingActionsMenu) {
        // Ignore when there's some element trapping focus that is not the menu itself
        return;
      }
      const actions = this.visibleActions$.value || [];
      if (actions.length === 1) {
        // Execute the action directly
        actions[0].onClick();
      } else if (actions.length > 1 && this.dropdown) {
        // Show the menu
        this.dropdown.toggle(true);
      }
    }));

    // Update the visible actions when conditions change
    const update = () => this.updateVisible();
    this.addSub(this.layout.breakpointChanges$.subscribe(update));
    update();
  }

  private updateVisible() {
    const activeBreakpoints = this.layout.activeBreakpoints;
    const actions = (this.headingActions || [])
      .filter(action => action.showOn(activeBreakpoints));
    this.visibleActions$.next(actions);

    // Only group actions on mobile
    const groupActions = activeBreakpoints.has('lt-sm') && actions.length > 0 && actions.findIndex(a => !a.maybeRoot) >= 0;
    this.groupActions$.next(groupActions);
  }

  onShown(dropdown: BsDropdownDirective) {
    this.shortcutsSub = this.shortcut.subscribe(Escape, () => dropdown.hide());
    this.layout.setFocusTrap(HeadingActionsMenu);
  }

  onHidden() {
    if (this.shortcutsSub) {
      this.shortcutsSub.unsubscribe();
      this.shortcutsSub = null;
    }
    this.layout.setFocusTrap(null);
  }

  clickAction(action: HeadingAction, param: any) {
    if (action.subActions?.length > 0) {
      this.modal.show(HeadingSubActionsComponent, {
        class: 'modal-form modal-form-small',
        initialState: { action }
      });
    } else {
      action.onClick(param);
    }
  }
}
