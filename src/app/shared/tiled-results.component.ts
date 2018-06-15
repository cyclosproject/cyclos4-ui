import { Component, OnInit, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { Image } from 'app/api/models';
import { Action } from 'app/shared/action';

/**
 * Wrapper for `tiled-result`s
 */
@Component({
  selector: 'tiled-results',
  templateUrl: 'tiled-results.component.html',
  styleUrls: ['tiled-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiledResultsComponent {
  constructor() { }

  @Input() tilesPerRow: 1 | 2 | 3 = 2;

}
