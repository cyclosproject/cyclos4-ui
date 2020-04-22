import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows heading actions in larger displays.
 * Needs to be explicitly added to pages.
 */
@Component({
  selector: 'actions-toolbar',
  templateUrl: 'actions-toolbar.component.html',
  styleUrls: ['actions-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsToolbarComponent extends BaseComponent implements OnInit {
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

  constructor(
    injector: Injector,
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
        action => action.showOn(activeBreakpoints));
    this.visibleActions$.next(actions);
  }
}
