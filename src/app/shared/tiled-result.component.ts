import { Component, OnInit, Input, ChangeDetectionStrategy, HostBinding, Inject, forwardRef, Optional } from '@angular/core';
import { Image } from 'app/api/models';
import { Action } from 'app/shared/action';
import { TiledResultsComponent } from 'app/shared/tiled-results.component';

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
  constructor(
    @Optional() @Inject(forwardRef(() => TiledResultsComponent)) public tiledResults
  ) {
  }

  @Input() avatarPosition: 'left' | 'top' = 'left';

  /** The icon to show */
  @Input() icon: string;

  /** The image to show (overrides icon) */
  @Input() image: Image;

  /** The tile title */
  @Input() title: string;

  /** Actions shown below the tile */
  @Input() actions: Action[];

  /** Url to navigate by clicking this result */
  @Input() url: string;

}
