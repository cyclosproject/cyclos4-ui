import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Shows an icon and a counter
 */
@Component({
  selector: 'icon-with-counter',
  templateUrl: 'icon-with-counter.component.html',
  styleUrls: ['icon-with-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconWithCounterComponent {

  @Input() icon: string;
  @Input() counter = 0;
}
