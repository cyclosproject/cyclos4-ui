import {
  Component, Input, ChangeDetectionStrategy, Injector, EventEmitter,
  Output, AfterContentInit, AfterContentChecked, ElementRef, QueryList, ViewChild, ContentChildren,
} from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { fromEvent, BehaviorSubject } from 'rxjs';
import { TiledResultComponent } from 'app/shared/tiled-result.component';

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
export class TiledResultsComponent extends BaseComponent implements AfterContentInit, AfterContentChecked {
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

  @ViewChild('container') container: ElementRef;

  @ContentChildren(TiledResultComponent) results: QueryList<TiledResultComponent>;

  emptySpaces = new BehaviorSubject<Array<any>>([]);

  ngOnInit() {
    super.ngOnInit();
    // We need the exact pixel dimensions to calculate either auto tile size or number of empty tiles
    this.subscriptions.push(fromEvent(window, 'resize').subscribe(() =>
      this.onDisplayChange()));
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

    if (this.tileWidth != null && this.results && this.container && this.layout.gtxs) {
      const width = <number>this.container.nativeElement.clientWidth;
      const tilesPerRow = Math.floor(width / this.tileWidth);
      const lastRow = this.results.length % tilesPerRow;
      const missing = tilesPerRow - lastRow;
      this.emptySpaces.next(missing === 0 ? [] : ' '.repeat(missing).split(''));
    } else if (this.emptySpaces.value.length > 0) {
      this.emptySpaces.next([]);
    }
  }

  ngAfterContentChecked() {
    this.rendered.next(null);
  }

  ngAfterContentInit() {
    if (this.tileWidth == null) {
      // Will only control the number of tiles if they have a fixed width
      return;
    }
    const processResults = () => {
      this.results.forEach(res => {
        res.tileWidth = this.tileWidth;
        res.changeDetector.detectChanges();
      });
      this.onDisplayChange();
    };
    this.results.changes.subscribe(processResults);
    processResults();
  }
}
