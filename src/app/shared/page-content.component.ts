import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BreadcrumbService } from '../core/breadcrumb.service';

/**
 * The main content in a page layout
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent {
}
