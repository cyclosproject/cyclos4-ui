import { Directive, HostBinding } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Base class for dashboard items
 */
@Directive()
export abstract class BaseDashboardComponent extends BaseComponent {

  @HostBinding('class.dashboard-item') classItem = true;

  headingActions$ = new BehaviorSubject<HeadingAction[]>(null);
  get headingActions(): HeadingAction[] {
    return this.headingActions$.value;
  }
  set headingActions(headingActions: HeadingAction[]) {
    this.headingActions$.next(headingActions);
  }
}
