import { Component, OnInit, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Menu } from 'app/shared/menu';
import { BaseComponent } from 'app/shared/base.component';
import { ObservableMedia } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * A section that shows query filters for the current page
 */
@Component({
  selector: 'page-filters',
  templateUrl: 'page-filters.component.html',
  styleUrls: ['page-filters.component.scss']
})
export class PageFiltersComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }
}
