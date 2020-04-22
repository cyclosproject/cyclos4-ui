import { Directive, Injector, OnInit } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Base class for components which are a view-only page
 */
@Directive()
export abstract class BaseViewPageComponent<D> extends BasePageComponent<D> implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.emulateKeyboardScroll();
  }
}
