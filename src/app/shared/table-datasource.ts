import { ChangeDetectorRef } from "@angular/core";
import { DataSource } from "@angular/cdk/collections";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";

/**
 * Simple implementation for a DataSource to be used on data tables
 */
export class TableDataSource<T> extends DataSource<T> {

  constructor(private changeDetector: ChangeDetectorRef) {
    super();
  }

  get hasData(): boolean {
    return this.data.length > 0;
  }

  get data(): T[] {
    return this._data.value;
  }

  set data(value: T[]) {
    this._data.next(value);
    this.changeDetector.markForCheck();
  }

  asObservable(): Observable<T[]> {
    return this._data.asObservable();
  }

  private _data: BehaviorSubject<T[]> = new BehaviorSubject([]);

  connect(): Observable<T[]> {
    return this._data;
  }

  disconnect(): void {
  }
}