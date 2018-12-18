import { BaseComponent } from 'app/shared/base.component';
import { Injector, EventEmitter, Output, HostBinding } from '@angular/core';

/**
 * Base class for components which are dashboard items
 */
export class BaseDashboardComponent extends BaseComponent {

  @HostBinding('class.d-flex') classFlex = true;
  @HostBinding('class.flex-grow-1') classFlexGrow = true;

  @Output() ready = new EventEmitter<boolean>();

  constructor(injector: Injector) {
    super(injector);
  }

  notifyReady() {
    this.ready.next(true);
  }
}
