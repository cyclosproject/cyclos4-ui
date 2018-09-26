import { OnInit, OnDestroy, Injector, HostBinding } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { AbstractControl } from '@angular/forms';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { BehaviorSubject } from 'rxjs';

/**
 * Base class implemented by components which are actually 'pages', that is, are displayed in the `<router-outlet>`.
 * Pages generally fetch some data from the server in order to display its content.
 * @param D The data type
 */
export abstract class BasePageComponent<D> extends BaseComponent implements OnInit, OnDestroy {

  @HostBinding('style.display') styleDisplay = 'flex';
  @HostBinding('style.flex-direction') styleFlexDirection = 'column';
  @HostBinding('style.flex-grow') styleFlexGrow = '1';

  dataAlreadyInitialized = false;
  data$ = new BehaviorSubject<D>(null);

  get data(): D {
    return this.data$.value;
  }
  set data(data: D) {
    if (!this.dataAlreadyInitialized) {
      this.dataAlreadyInitialized = true;
      this.onDataInitialized(data);
    }
    this.data$.next(data);
    if (data != null) {
      this.onAfterSetData(data);
    }
  }

  /**
   * Reloads the current page
   */
  protected reload() {
    this.data = null;
    this.dataAlreadyInitialized = false;
    this.unsubscribe();
    this.ngOnInit();
  }

  /**
   * Callback invoked every time the data is set
   * @param data The data instance
   */
  protected onAfterSetData(data: D) {
  }

  /**
   * Callback invoked the first time the data is initialized
   * @param data The data instance
   */
  protected onDataInitialized(data: D) {
  }

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.layout.currentPage = this;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.layout.currentPage === this) {
      this.layout.currentPage = null;
    }
  }

  /**
   * Should be implemented by pages to correctly locate a form control.
   * Is important, for example, to match validation errors to fields.
   */
  locateControl(locator: FormControlLocator): AbstractControl {
    return null;
  }
}
