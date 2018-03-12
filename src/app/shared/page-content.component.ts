import { Component, ChangeDetectionStrategy } from '@angular/core';

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
