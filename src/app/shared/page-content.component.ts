import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { Action } from 'app/shared/action';
import { truthyAttr } from 'app/shared/helper';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Represents a box in the layout which contains an optional heading (title) and content.
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent {

  @HostBinding('style.flex-grow') get flexGrow(): string {
    return this.mode === 'fullHeight' ? '1' : '0';
  }

  @Input() heading: string;
  @Input() headingActions: Action[];
  @Input() layout: 'normal' | 'centered' = 'normal';
  @Input() mode: 'normal' | 'filters' | 'table' | 'tight' | 'transparent' | 'fullHeight' | 'fullHeightTight' = 'normal';

  constructor(
    public layoutService: LayoutService,
    public breadcrumb: BreadcrumbService
  ) { }
}
