import { Component, OnInit, Input, ChangeDetectionStrategy, HostBinding, Inject, forwardRef, Optional } from '@angular/core';
import { Image } from 'app/api/models';
import { Action } from 'app/shared/action';
import { TiledResultsComponent } from 'app/shared/tiled-results.component';
import { LayoutService } from 'app/core/layout.service';

/**
 * Renders a card-like element with an avatar, a title and a body
 */
@Component({
  selector: 'tiled-result',
  templateUrl: 'tiled-result.component.html',
  styleUrls: ['tiled-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiledResultComponent implements OnInit {
  constructor(
    @Optional() @Inject(forwardRef(() => TiledResultsComponent)) public tiledResults,
    public layout: LayoutService
  ) {
  }

  @Input() avatarPosition: 'left' | 'top' = 'left';

  /** The icon to show */
  @Input() icon: string;

  /** The image to show (overrides icon) */
  @Input() image: Image;

  /** Show a large image (lightbox) when clicking on the image? */
  @Input() useLightbox = false;

  /** The tile title */
  @Input() title: string;

  /** Actions shown below the tile */
  @Input() actions: Action[];

  /** Url to navigate by clicking this result */
  @Input() url: string;

  /** The tile width. If there's a wrapper `<tiled-results>`, will read from it */
  @Input() tileWidth: number;

  ngOnInit() {
    if (this.tileWidth == null && this.tiledResults != null) {
      this.tileWidth = this.tiledResults.tileWidth;
    }
  }
}
