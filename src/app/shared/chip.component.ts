import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { Image } from 'app/api/models';

/**
 * Shows a chip, which has an optional image / icon and an optional close icon
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'chip',
  templateUrl: 'chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  @HostBinding('class.mw-100') classMaxWidth = true;

  @Input() image: Image;
  @Input() icon: string;
  @HostBinding('class.closeable') @Input() closeable = true;
  @Output() close = new EventEmitter<void>();
}
