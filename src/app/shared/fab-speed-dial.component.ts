import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Action } from 'app/shared/action';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
} from '@angular/animations';

/**
 * A floating action button which presents a speed dial (actions revealed on click)
 * Based on https://stackblitz.com/edit/sat-popover-speed-dial
 */
@Component({
  selector: 'fab-speed-dial',
  templateUrl: 'fab-speed-dial.component.html',
  styleUrls: ['fab-speed-dial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('spinInOut', [
      state('in', style({ transform: 'rotate(0)', opacity: '1' })),
      transition(':enter', [
        style({ transform: 'rotate(-180deg)', opacity: '0' }),
        animate('150ms ease')
      ]),
      transition(':leave', [
        animate('150ms ease', style({ transform: 'rotate(180deg)', opacity: '0' }))
      ]),
    ]),
    trigger('preventInitialAnimation', [
      transition(':enter', [
        query(':enter', [], { optional: true })
      ]),
    ]),
  ]
})
export class FabSpeedDialComponent {
  constructor() { }

  /** The icon to show */
  @Input() icon = 'add';

  /** Actions shown below the tile */
  @Input() actions: Action[];

}
