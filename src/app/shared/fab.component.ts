import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

/**
 * A floating action button which presents a speed dial (actions revealed on click)
 * Based on https://stackblitz.com/edit/sat-popover-speed-dial
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'fab',
  templateUrl: 'fab.component.html',
  styleUrls: ['fab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FabComponent {
  constructor() { }

  /** The icon to show */
  @Input() icon = 'add';

  /** Click event emitter */
  @Output() click = new EventEmitter<null>(true);

}
