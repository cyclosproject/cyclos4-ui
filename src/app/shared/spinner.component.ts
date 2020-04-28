import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

/**
 * Shows a spinner to indicate that some processing is taking place
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'spinner',
  templateUrl: 'spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {

  @HostBinding('class.spinner') classSpinner = true;

  @Input() size: string;

}
