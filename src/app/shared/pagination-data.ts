import { ApiResponse } from 'app/api/api-response';

/**
 * Pagination data, which can be constructed from an HTTP response
 */
export class PaginationData {

  static from(response: ApiResponse<any>): PaginationData {
    let resp = response.response;
    let pageItems = response.data || [];
    return new PaginationData(
      parseInt(resp.headers.get('X-Current-Page'), 10),
      parseInt(resp.headers.get('X-Page-Size'), 10),
      pageItems.length,
      parseInt(resp.headers.get('X-Total-Count'), 10),
      parseInt(resp.headers.get('X-Page-Count'), 10),
      resp.headers.get('X-Has-Next-Page') === 'true'
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

  hasTotalCount: boolean;
  firstItem: number;
  lastItem: number;
}