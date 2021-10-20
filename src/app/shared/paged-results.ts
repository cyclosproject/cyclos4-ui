import { HttpResponse } from '@angular/common/http';

/**
 * Contains an array of results, plus pagination data
 */
export class PagedResults<T> {
  results: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  hasNext: boolean;

  get hasResults(): boolean {
    return (this.results || []).length > 0;
  }

  get hasTotalCount(): boolean {
    return this.totalCount != null && !isNaN(this.totalCount);
  }

  get firstItem(): number {
    return this.pageSize * this.page + 1;
  }

  get lastItem(): number {
    return this.firstItem + (this.results || []).length - 1;
  }

  constructor(results: T[]) {
    this.results = results || [];
    this.page = 0;
    this.pageSize = this.results.length;
    this.totalCount = this.results.length;
    this.pageCount = 1;
    this.hasNext = false;
  }

  /**
   * Builds a paged results from an HTTP response
   * @param response The HTTP response
   */
  static from<T>(response: HttpResponse<T[]>): PagedResults<T> {
    const paged = new PagedResults(response.body);
    PagedResults.fillHeaders(paged, response);
    return paged;
  }

  /**
   * Fills the given paged results using the headers from the given response
   * @param paged The paged results
   * @param response The HTTP response
   */
  static fillHeaders(paged: PagedResults<any>, response: HttpResponse<any>): void {
    paged.page = parseInt(response.headers.get('X-Current-Page'), 10);
    paged.pageSize = parseInt(response.headers.get('X-Page-Size'), 10);
    paged.totalCount = parseInt(response.headers.get('X-Total-Count'), 10);
    paged.pageCount = parseInt(response.headers.get('X-Page-Count'), 10);
    paged.hasNext = response.headers.get('X-Has-Next-Page') === 'true';
  }
}
