import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * A section that shows query filters for the current page
 */
@Component({
  selector: 'page-filters',
  templateUrl: 'page-filters.component.html',
  styleUrls: ['page-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageFiltersComponent {
}
