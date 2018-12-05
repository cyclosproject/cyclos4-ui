import { BaseComponent } from 'app/shared/base.component';
import { Injector, EventEmitter, Output } from '@angular/core';

/**
 * Base class for components which are dashboard items
 */
export class BaseDashboardComponent extends BaseComponent {

  @Output() ready = new EventEmitter<boolean>();

  constructor(injector: Injector) {
    super(injector);
  }

  notifyReady() {
    this.ready.next(true);
  }
}
