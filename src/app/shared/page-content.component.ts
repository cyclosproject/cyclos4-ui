import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BreadcrumbService } from '../core/breadcrumb.service';

/**
 * The main content in a page layout
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  private _title: string;

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

}
