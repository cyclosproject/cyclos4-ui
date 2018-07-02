import { Component, Input, ChangeDetectionStrategy, Injector, EventEmitter, Output, AfterContentInit } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { fromEvent } from 'rxjs';

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
export class TiledResultsComponent extends BaseComponent implements AfterContentInit {
  constructor(injector: Injector) {
    super(injector);
  }

  actualTiles: TilesPerRow = 2;
  _tilesPerRow: TilesPerRow = 2;

  @Input() standalone = false;

  /**
   * When set, tiles will have a fixed width instead of by number of tiles
   */
  @Input() tileWidth: number;

  @Output() rendered = new EventEmitter<null>();

  @Input() get tilesPerRow(): TilesPerRow {
    return this._tilesPerRow;
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.tilesPerRow === 'auto') {
      // We need the exact pixel dimensions for the auto size to work ok
      this.subscriptions.push(fromEvent(window, 'resize').subscribe(() =>
        this.onDisplayChange()));
    }
  }

  set tilesPerRow(tiles: TilesPerRow) {
    this._tilesPerRow = tiles;
    this.onDisplayChange();
  }

  onDisplayChange() {
    super.onDisplayChange();
    if (this.tileWidth != null) {
      this.actualTiles = null;
    } else if (this._tilesPerRow === 'auto') {
      const width = this.layout.contentWidth;
      const tiles = Math.round(width / 250);
      this.actualTiles = Math.max(2, Math.min(3, tiles)) as TilesPerRow;
    } else {
      this.actualTiles = this._tilesPerRow;
    }
  }

  ngAfterContentInit() {
    this.rendered.next(null);
  }
}
