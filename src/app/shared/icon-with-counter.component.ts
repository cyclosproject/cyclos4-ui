import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Shows an icon and a counter
 */
@Component({
  selector: 'icon-with-counter',
  templateUrl: 'icon-with-counter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconWithCounterComponent {
  @Input() icon: SvgIcon | string;
  private _count: string | number = 0;
  @Input() get count(): string | number {
    return this._count;
  }
  set count(count: string | number) {
    if (typeof count === 'string') {
      count = Number.parseInt(count, 10);
    }
    if (isNaN(count)) {
      count = 0;
    }
    if (count > 99) {
      count = 99;
    }
    this._count = count;
  }
}
