import { Component, OnInit, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Menu } from 'app/shared/menu';
import { BaseComponent } from 'app/shared/base.component';
import { ObservableMedia } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * A section that is displayed above the page in the layout
 */
@Component({
  selector: 'page-header',
  templateUrl: 'page-header.component.html',
  styleUrls: ['page-header.component.scss']
})
export class PageHeaderComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  title: string;
}
