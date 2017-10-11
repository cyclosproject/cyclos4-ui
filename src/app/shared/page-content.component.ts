import { Component, OnInit, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Menu } from 'app/shared/menu';
import { BaseComponent } from 'app/shared/base.component';
import { ObservableMedia } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * The main content in a page layout
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss']
})
export class PageContentComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  title: string;

}
