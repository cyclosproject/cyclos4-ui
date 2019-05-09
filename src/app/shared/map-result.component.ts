import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Image, Address } from 'app/api/models';

/**
 * A result when result type is map.
 */
@Component({
  selector: 'map-result',
  templateUrl: 'map-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapResultComponent {

  @Input() image: Image;
  @Input() address: Address;

  constructor() {
  }
}
