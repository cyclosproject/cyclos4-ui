import { HostBinding, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { BehaviorSubject } from 'rxjs';
import { Menu, ConditionalMenu } from 'app/shared/menu';
import { first } from 'rxjs/operators';

export type UpdateTitleFrom = 'menu' | 'content';

/**
 * Base class implemented by components which are actually 'pages', that is, are displayed in the `<router-outlet>`.
 * Pages generally fetch some data from the server in order to display its content.
 * @param D The data type
 */
export abstract class BasePageComponent<D> extends BaseComponent implements OnInit, OnDestroy {

  @HostBinding('style.display') styleDisplay = 'flex';
  @HostBinding('style.flex-direction') styleFlexDirection = 'column';
  @HostBinding('style.flex-grow') styleFlexGrow = '1';

  menuItem: Menu | ConditionalMenu;

  data$ = new BehaviorSubject<D>(null);
  get data(): D {
    return this.data$.value;
  }
  set data(data: D) {
    if (this.data == null && data != null) {
      this.onDataInitialized(data);
    }
    this.data$.next(data);
  }

  headingActions$ = new BehaviorSubject<HeadingAction[]>(null);
  get headingActions(): HeadingAction[] {
    return this.headingActions$.value;
  }
  set headingActions(headingActions: HeadingAction[]) {
    this.headingActions$.next(headingActions);
  }

  private _printAction: HeadingAction;
  protected get printAction(): HeadingAction {
    if (this._printAction) {
      return this._printAction;
    }
    this._printAction = new HeadingAction('print', this.messages.general.print, () => {
      self.print();
    }, true);
    return this._printAction;
  }

  /**
   * Reloads the current page
   */
  reload() {
    this.router.navigateByUrl(this.router.url);
  }

  /**
   * Callback invoked the first time the data is initialized
   * @param _data The data instance
   */
  protected onDataInitialized(_data: D) {
  }

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const snapshot = this.route.snapshot;
    this.menuItem = snapshot.data.menu;
    if (this.menuItem == null) {
      throw new Error(`No menu item defined for route ${snapshot.url}`);
    }
    this.layout.currentPage = this;
    this.layout.fullWidth = this.defaultFullWidthLayout();

    // Set the title menu according to the menu item
    if (this.updateTitleFrom() === 'menu') {
      this.menu.resolveMenu(this.menuItem).pipe(first()).subscribe(menu => {
        const entry = this.menu.menuEntry(menu);
        if (entry) {
          this.layout.setTitle(entry.label);
        }
      });
    }
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
  locateControl(_locator: FormControlLocator): AbstractControl {
    return null;
  }

  /**
   * May be overritten in order to determine whether the layout should be full width
   */
  protected defaultFullWidthLayout(): boolean {
    return false;
  }

  /**
   * Indicates whether the window title is updated from the menu or from a page content
   */
  updateTitleFrom(): UpdateTitleFrom {
    return 'content';
  }
}
