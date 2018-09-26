import { HttpResponse } from '@angular/common/http';

/**
 * Contains an array of results, plus pagination data
 */
export class PagedResults<T> {
  hasResults: boolean;
  hasTotalCount: boolean;
  firstItem: number;
  lastItem: number;

  /**
   * Builds a paged results from an HTTP response
   * @param response The HTTP response
   */
  static from<T>(response: HttpResponse<T[]>): PagedResults<T> {
    return new PagedResults(
      response.body,
      parseInt(response.headers.get('X-Current-Page'), 10),
      parseInt(response.headers.get('X-Page-Size'), 10),
      parseInt(response.headers.get('X-Total-Count'), 10),
      parseInt(response.headers.get('X-Page-Count'), 10),
      response.headers.get('X-Has-Next-Page') === 'true'
    );
  }

  /**
   * Builds a paged results from an array
   */
  static fromArray<T>(array: T[]): PagedResults<T> {
    array = array || [];
    return new PagedResults(array, 0, array.length, array.length, 1, false);
  }

  constructor(
    public results: T[],
    public page: number,
    public pageSize: number,
    public totalCount: number,
    public pageCount: number,
    public hasNext: boolean
  ) {
    if (this.results == null) {
      this.results = [];
    }
    this.hasResults = this.results.length > 0;
    this.hasTotalCount = totalCount != null && !isNaN(totalCount);
    this.firstItem = pageSize * page + 1;
    this.lastItem = this.firstItem + this.results.length - 1;
  }
}
