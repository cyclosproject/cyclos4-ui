import { ChangeDetectorRef } from "@angular/core";
import { DataSource } from "@angular/cdk/collections";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { ApiResponse } from "app/api/api-response";
import { PaginationData } from "app/shared/pagination-data";

/**
 * Simple implementation for a DataSource to be used on data tables.
 * Delegates the data to a BehaviorSubject which holds the data array.
 * Also holds the pagination data.
 */
export class TableDataSource<T> extends DataSource<T> {

  /**
   * Holds the datasource data
   */
  data: BehaviorSubject<T[]>;

  /**
   * Holds the pagination data
   */
  pagination: BehaviorSubject<PaginationData>;
  
  /**
   * Observable indicating empty data
   */
  empty: Observable<boolean>;

  /**
   * Pushes a new data array to the datasource
   * @param data The new data array
   */
  next(data: T[] |  ApiResponse<T[]>): void {
    if (data instanceof ApiResponse) {
      this.data.next(data.data);
      this.pagination.next(PaginationData.from(data))
    } else {
      this.data.next(data);
      this.pagination.next(null)
    }
  }

  constructor() {
    super();
    this.data = new BehaviorSubject([]);
    this.empty = this.data.asObservable().map(arr => arr.length == 0);
    this.pagination = new BehaviorSubject(null);
  }

  connect(): Observable<T[]> {
    return this.data;
  }

  disconnect(): void {
  }
}