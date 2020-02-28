import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, OnDestroy } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick, truthyAttr } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows heading actions in larger displays.
 * Needs to be explicitly added to pages.
 */
@Component({
  selector: 'actions-toolbar',
  templateUrl: 'actions-toolbar.component.html',
  styleUrls: ['actions-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionsToolbarComponent extends BaseComponent implements OnInit, OnDestroy {
  blurIfClick = blurIfClick;


  visibleActions$ = new BehaviorSubject<HeadingAction[]>([]);

  private _actions: HeadingAction[] = [];
  @Input() get headingActions(): HeadingAction[] {
    return this._actions;
  }
  set headingActions(actions: HeadingAction[]) {
    this._actions = actions;
    this.updateVisible();
  }

  private _bottomSeparator: boolean | string = false;
  @Input() get bottomSeparator(): boolean | string {
    return this._bottomSeparator;
  }
  set bottomSeparator(flag: boolean | string) {
    this._bottomSeparator = truthyAttr(flag);
  }

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Update the visible actions when conditions change
    const update = () => this.updateVisible();
    this.addSub(this.layout.breakpointChanges$.subscribe(update));
    update();
  }

  private updateVisible() {
    const activeBreakpoints = this.layout.activeBreakpoints;
    const actions = activeBreakpoints.has('lt-sm')
      ? []
      : (this.headingActions || []).filter(
        action => action.showOn(activeBreakpoints) && action.showOnToolbar);
    this.visibleActions$.next(actions);
    this.layout.hasActionsToolbar = actions.length > 0;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.layout.hasActionsToolbar = false;
  }
}
