import { Component, OnInit, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { Image } from 'app/api/models';
import { Action } from 'app/shared/action';

/**
 * Renders a card-like element with an avatar, a title and a body
 */
@Component({
  selector: 'tiled-result',
  templateUrl: 'tiled-result.component.html',
  styleUrls: ['tiled-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiledResultComponent {
  constructor() { }

  /** The icon to show */
  @Input() icon: string;

  /** The image to show (overrides icon) */
  @Input() image: Image;

  /** The tile title */
  @Input() title: string;

  /** Actions shown below the tile */
  @Input() actions: Action[];

}
