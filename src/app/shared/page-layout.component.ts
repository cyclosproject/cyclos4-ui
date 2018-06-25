import { Component, Input, ChangeDetectionStrategy, Injector, ViewChild, ElementRef, AfterViewInit, AfterViewChecked } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { Action } from 'app/shared/action';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
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
export class PageLayoutComponent extends BaseComponent implements AfterViewInit, AfterViewChecked {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input() extraMargin = false;

  @Input() hasMenu = true;

  @Input() hasHeader = false;

  @Input() filtersForm: FormGroup;

  private initialFormState: any;

  @Input() tightContent = false;

  @Input() invisibleContent = false;

  @Input() contentSize: ContentSize = 'full';

  @Input() loaded: Observable<any>;

  @Input() title: string;

  @Input() titleActions: Action[];

  @ViewChild('tabGroup') tabGroup: MatTabGroup;

  @ViewChild('pageTitle') pageTitle: any;
  @ViewChild('headerWrapper') headerWrapper: ElementRef;
  @ViewChild('header') header: ElementRef;

  filtersShown = new BehaviorSubject(false);

  private creationTime = new Date();

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
        this.layout.nextLoadedPage(this);
      } else {
        // There's a loaded notification: clone the form state right after finishing loading
        this.subscriptions.push(this.loaded.subscribe(done => {
          if (done && this.initialFormState == null) {
            this.initialFormState = cloneDeep(this.filtersForm.value);
          }
          this.layout.nextLoadedPage(this);
        }));
      }
    }
  }

  ngAfterViewChecked(): void {
    this.updateHeader();
  }

  ngAfterViewInit(): void {
    this.updateHeader();
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
    this.updateHeader();
  }

  // The spinner is only shown a few milliseconds after the component creation
  showSpinner() {
    const now = new Date();
    return (now.getTime() - this.creationTime.getTime()) > 300;
  }

  updateHeader() {
    if (this.header != null && this.pageTitle != null && this.headerWrapper != null) {
      const header = this.header.nativeElement;
      const pageTitle = this.pageTitle.rootElement.nativeElement;
      const headerWrapper = this.headerWrapper.nativeElement;
      header.style.flex = '0 0 ' + (pageTitle.getBoundingClientRect().height + headerWrapper.getBoundingClientRect().height) + 'px';
    }
  }
}
