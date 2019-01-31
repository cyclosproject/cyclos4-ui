import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

/**
 * Shows a spinner to indicate that some processing is taking place
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'spinner',
  templateUrl: 'spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {

  @HostBinding('class.spinner') classSpinner = true;

}
