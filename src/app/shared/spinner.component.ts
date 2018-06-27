import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Renders a spinner to be shown while background data is being loaded
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'spinner',
  templateUrl: 'spinner.component.html',
  styleUrls: ['spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
}
