import { Component, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';

export type TilesPerRow = 1 | 2 | 3 | 4 | 'auto';

/**
 * Wrapper for `tiled-result`s
 */
@Component({
  selector: 'tiled-results',
  templateUrl: 'tiled-results.component.html',
  styleUrls: ['tiled-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiledResultsComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  actualTiles: TilesPerRow = 2;
  _tilesPerRow: TilesPerRow = 2;

  @Input() standalone = false;

  @Input() get tilesPerRow(): TilesPerRow {
    return this._tilesPerRow;
  }

  set tilesPerRow(tiles: TilesPerRow) {
    this._tilesPerRow = tiles;
    this.onDisplayChange();
  }

  onDisplayChange() {
    super.onDisplayChange();
    if (this._tilesPerRow === 'auto') {
      const width = this.layout.contentWidth;
      const tiles = Math.round(width / 200);
      this.actualTiles = Math.max(2, Math.min(4, tiles)) as TilesPerRow;
    }
  }
}
