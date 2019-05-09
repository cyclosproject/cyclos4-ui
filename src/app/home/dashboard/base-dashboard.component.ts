import { Injector, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Base class for components which are dashboard items
 */
export class BaseDashboardComponent extends BaseComponent {

  @Input() minHeight: string;
  @Input() last: boolean;

  minHeight$ = new BehaviorSubject<string>(null);

  constructor(injector: Injector) {
    super(injector);
  }
}
