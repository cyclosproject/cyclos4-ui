import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { truthyAttr } from 'app/shared/helper';

/**
 * A result when result type is tile.
 */
@Component({
  selector: 'tiled-result',
  templateUrl: 'tiled-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiledResultComponent {

  @Input() image: Image;
  @Input() icon: SvgIcon | string;

  private _zoom: boolean | string = false;
  @Input() get zoom(): boolean | string {
    return this._zoom;
  }
  set zoom(zoom: boolean | string) {
    this._zoom = truthyAttr(zoom);
  }

  constructor() {
  }
}
