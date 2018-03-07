import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BreadcrumbService } from '../core/breadcrumb.service';

/**
 * A section that is displayed above the page in the layout
 */
@Component({
  selector: 'page-header',
  templateUrl: 'page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
}
