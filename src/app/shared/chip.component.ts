import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Injector, Input, Output } from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { AbstractComponent } from 'app/shared/abstract.component';

/**
 * Shows a chip, which has an optional image / icon and an optional close icon
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'chip',
  templateUrl: 'chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipComponent extends AbstractComponent {
  @HostBinding('class.mw-100') classMaxWidth = true;

  @Input() image: Image;
  @Input() icon: SvgIcon | string;
  @HostBinding('class.closeable') @Input() closeable = true;
  @Output() close = new EventEmitter<void>();

  constructor(injector: Injector) {
    super(injector);
  }
}
