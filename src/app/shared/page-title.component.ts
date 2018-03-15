import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Messages } from 'app/messages/messages';
import { PageLayoutComponent } from './page-layout.component';
import { LayoutService } from 'app/core/layout.service';

/**
 * The title, with breadcrumb and show filters button
 */
@Component({
  selector: 'page-title',
  templateUrl: 'page-title.component.html',
  styleUrls: ['page-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageTitleComponent {

  constructor(
    public messages: Messages,
    public layout: LayoutService) {
  }

  @Input() title: string;

  @Input() pageLayout: PageLayoutComponent;

  showFilters() {
    this.pageLayout.showFilters();
  }
}
