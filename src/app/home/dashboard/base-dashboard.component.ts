import { Directive, Injector, Input } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Base class for components which are dashboard items
 */
@Directive()
export class BaseDashboardComponent extends BaseComponent {

  @Input() minHeight: string;
  @Input() last: boolean;

  headingActions: HeadingAction[];

  minHeight$ = new BehaviorSubject<string>(null);

  constructor(injector: Injector) {
    super(injector);
  }
}
