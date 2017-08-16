import { ChangeDetectorRef } from "@angular/core";
import { DataSource, CollectionViewer } from "@angular/cdk";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";

/**
 * Simple implementation for a DataSource to be used on data tables
 */
export class TableDataSource<T> extends DataSource<T> {

  constructor(private changeDetector: ChangeDetectorRef) {
    super();
  }

  public get data(): T[] {
    return this._data.value;
  }

  public set data(value: T[]) {
    this._data.next(value);
    this.changeDetector.markForCheck();
  }

  private _data: BehaviorSubject<T[]> = new BehaviorSubject([]);

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return this._data;
  }

  disconnect(collectionViewer: CollectionViewer): void {
  }
}