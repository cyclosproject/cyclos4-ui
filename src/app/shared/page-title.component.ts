import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { GeneralMessages } from 'app/messages/general-messages';
import { PageLayoutComponent } from './page-layout.component';

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

  constructor(public generalMessages: GeneralMessages) {
  }

  @Input() title: string;

  @Input() hasFilters: boolean;

  @Input() pageLayout: PageLayoutComponent;

  showFilters() {
    this.pageLayout.showFilters();
  }
}
