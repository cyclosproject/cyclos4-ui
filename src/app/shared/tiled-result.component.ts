import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Image } from 'app/api/models';

/**
 * A result when result type is tile.
 */
@Component({
  selector: 'tiled-result',
  templateUrl: 'tiled-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiledResultComponent {

  @Input() image: Image;
  @Input() icon: string;

  constructor() {
  }
}
