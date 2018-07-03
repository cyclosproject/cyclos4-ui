import { Component, Input, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { Messages } from 'app/messages/messages';
import { PageLayoutComponent } from './page-layout.component';
import { LayoutService } from 'app/core/layout.service';
import { Action } from 'app/shared/action';
import { BreadcrumbService } from 'app/core/breadcrumb.service';

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
    public layout: LayoutService,
    public breadcrumb: BreadcrumbService) {
  }

  @Input() title: string;

  @Input() showFiltersVisible = true;

  @Input() pageLayout: PageLayoutComponent;

  @Input() noBottomMargin: boolean;

  @Input() actions: Action[];

  @ViewChild('root') rootElement: ElementRef;

  toggleFilters() {
    this.pageLayout.toggleFilters();
  }
}
