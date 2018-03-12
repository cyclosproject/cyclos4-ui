import { Component, ChangeDetectionStrategy } from '@angular/core';

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
