import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * The main content in a page layout
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent {
}
