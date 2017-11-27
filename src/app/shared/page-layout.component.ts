import { Component, OnInit, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Menu } from 'app/shared/menu';
import { BaseComponent } from 'app/shared/base.component';
import { ObservableMedia } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

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
  menu: Menu;

  @Input()
  hasHeader = false;

  @Input()
  hasFilters = false;

  @Input()
  tightContent = false;

  @Input()
  loaded: Observable<any>;

  @Input()
  title: string;

  showLeft = new BehaviorSubject<Boolean>(false);

  ngOnInit() {
    super.ngOnInit();
    if (this.menu == null) {
      throw new Error('No menu given to this page');
    }
    this.layout.menu.next(this.menu);
    this.update();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.layout.menu.next(null);
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  private update() {
    this.showLeft.next(this.media.isActive('gt-sm'));
  }
}
