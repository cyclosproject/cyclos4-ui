import { HttpResponse } from '@angular/common/http';

/**
 * Pagination data, which can be constructed from an HTTP response
 */
export class PaginationData {
  hasTotalCount: boolean;
  firstItem: number;
  lastItem: number;

  static from(response: HttpResponse<any>): PaginationData {
    const pageItems = response.body || [];
    return new PaginationData(
      parseInt(response.headers.get('X-Current-Page'), 10),
      parseInt(response.headers.get('X-Page-Size'), 10),
      pageItems.length,
      parseInt(response.headers.get('X-Total-Count'), 10),
      parseInt(response.headers.get('X-Page-Count'), 10),
      response.headers.get('X-Has-Next-Page') === 'true'
    );
  }

  constructor(
    public page: number,
    public pageSize: number,
    public currentPageItems: number,
    public totalCount: number,
    public pageCount: number,
    public hasNext: boolean
  ) {
    this.hasTotalCount = totalCount != null && !isNaN(totalCount);
    this.firstItem = pageSize * page + 1;
    this.lastItem = this.firstItem + currentPageItems - 1;
  }
}
