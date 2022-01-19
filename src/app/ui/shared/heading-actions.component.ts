import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick, truthyAttr } from 'app/shared/helper';
import { ActionsRight, Escape } from 'app/core/shortcut.service';
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

  private _root: boolean | string = false;
  @Input() get root(): boolean | string {
    return this._root;
  }
  set root(flag: boolean | string) {
    this._root = truthyAttr(flag);
  }

  private _actions: HeadingAction[] = [];
  @Input() get headingActions(): HeadingAction[] {
    return this._actions;
  }
  set headingActions(actions: HeadingAction[]) {
    this._actions = actions;
    this.updateVisible();
  }

  @Output() visibleActions = new EventEmitter<HeadingAction[]>();

  groupActions$ = new BehaviorSubject(false);
  shortcutsSub: Subscription;

  constructor(
    injector: Injector,
    private modal: BsModalService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

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
    this.addSub(this.layout.breakpointChanges$.subscribe(() => this.updateVisible()));
    this.updateVisible();
  }

  private updateVisible() {
    const activeBreakpoints = this.layout.activeBreakpoints;
    let actions = (this.headingActions || [])
      .filter(action => action.showOn(activeBreakpoints));
    const hasRoot = actions.findIndex(a => a.maybeRoot) >= 0;
    if (activeBreakpoints.has('gt-xs')) {
      if (this.root) {
        // This is the root heading actions
        if (hasRoot) {
          // There are root actions: show only those that can actually be root
          actions = actions.filter(a => a.maybeRoot);
        } else {
          // No root actions. Still, if less than 3, they will be shown in the title
          if (actions.length >= 3) {
            actions = [];
          }
        }
      } else {
        // This is the heading actions in a toolbar
        if (hasRoot) {
          // There is at least one root action: show in the toolbar only the non-root
          actions = actions.filter(a => !a.maybeRoot);
        } else {
          // No root actions. Still, if less than 3, they will be shown in the root
          if (actions.length <= 3) {
            actions = [];
          }
        }
      }
    }
    this.visibleActions$.next(actions);

    // Emit the output property change
    this.visibleActions.emit(actions);

    // Only group actions on mobile
    const groupActions = activeBreakpoints.has('lt-sm') && actions.length > 0;
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
