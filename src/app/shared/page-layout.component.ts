import { Component, Input, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { MatTabGroup } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { cloneDeep } from 'lodash';

/**
 * Possible sizes for the main content
 */
export type ContentSize = 'small' | 'medium' | 'full';

/**
 * Defines a page layout, which has a left menu, optional filters,
 * optional header and a content
 */
@Component({
  selector: 'page-layout',
  templateUrl: 'page-layout.component.html',
  styleUrls: ['page-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageLayoutComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  hasMenu = true;

  @Input()
  hasHeader = false;

  @Input()
  filtersForm: FormGroup;

  private initialFormState: any;

  @Input()
  tightContent = false;

  @Input()
  contentSize: ContentSize = 'full';

  @Input()
  loaded: Observable<any>;

  @ViewChild('tabGroup')
  tabGroup: MatTabGroup;

  filtersShown = new BehaviorSubject(false);

  private _title: string;

  private creationTime = new Date();

  @Input()
  set title(title: string) {
    this._title = title;
    if (title != null && title.length > 0 && this.breadcrumb.title == null) {
      this.breadcrumb.title = title;
    }
  }
  get title(): string {
    return this._title;
  }

  get hasFilters(): boolean {
    return this.filtersForm != null;
  }

  showLeft = new BehaviorSubject<Boolean>(false);

  ngOnInit() {
    super.ngOnInit();
    if (this.filtersForm != null) {
      if (this.loaded == null) {
        // No loaded notification: clone the form value right away
        this.initialFormState = cloneDeep(this.filtersForm.value);
      } else {
        // There's a loaded notification: clone the form state right after finishing loading
        this.subscriptions.push(this.loaded.subscribe(done => {
          if (done && this.initialFormState == null) {
            this.initialFormState = cloneDeep(this.filtersForm.value);
          }
        }));
      }
    }
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  toggleFilters() {
    if (this.filtersShown.value) {
      this.hideFilters();
    } else {
      this.showFilters();
    }
  }

  showFilters() {
    this.filtersShown.next(true);
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 1;
    }
  }

  hideFilters() {
    this.filtersShown.next(false);
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 0;
    }
  }

  clearFilters() {
    if (this.filtersForm) {
      this.filtersForm.reset(this.initialFormState);
    }
  }

  private update() {
    this.showLeft.next(this.media.isActive('gt-sm'));
  }

  // The spinner is only shown a few milliseconds after the component creation
  showSpinner() {
    const now = new Date();
    return (now.getTime() - this.creationTime.getTime()) > 300;
  }
}
