import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BreadcrumbService } from '../core/breadcrumb.service';

/**
 * A section that is displayed above the page in the layout
 */
@Component({
  selector: 'page-header',
  templateUrl: 'page-header.component.html',
  styleUrls: ['page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent extends BaseComponent {
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
