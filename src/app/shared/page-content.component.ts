import { Component, Input, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';

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
