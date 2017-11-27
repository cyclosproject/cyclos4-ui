import { ChangeDetectionStrategy, Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { MatTable } from '@angular/material';
import { QueryFilters } from 'app/api/models';
import { PaginationData } from 'app/shared/pagination-data';
import { ApiHelper } from 'app/shared/api-helper';

type PageData = {
  page: number, pageSize: number
};

/**
 * Adds either a message for an empty data table or a paginator
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'paginator',
  templateUrl: 'paginator.component.html',
  styleUrls: ['paginator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent<T> extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  dataSource: TableDataSource<T>;

  @Input()
  query: QueryFilters;

  @Output()
  update = new EventEmitter<void>();

  get pagination(): PaginationData {
    return this.dataSource.pagination.value;
  }

  previous() {
    const pagination = this.pagination;
    if (!pagination || pagination.page === 0) {
      return;
    }
    this.doUpdate({
      page: pagination.page - 1,
      pageSize: pagination.pageSize
    });
  }

  next() {
    const pagination = this.pagination;
    if (pagination && pagination.hasTotalCount && pagination.page >= pagination.pageCount) {
      // We know by the total count that there shouldn't have any other page
      return;
    }
    this.doUpdate({
      page: pagination.page + 1,
      pageSize: pagination.pageSize
    });
  }

  first() {
    const pagination = this.pagination;
    if (!pagination) {
      return;
    }
    this.doUpdate({
      page: 0,
      pageSize: pagination.pageSize
    });
  }

  last() {
    const pagination = this.pagination;
    if (!pagination || !pagination.hasTotalCount) {
      return;
    }
    this.doUpdate({
      page: pagination.pageCount - 1,
      pageSize: pagination.pageSize
    });
  }

  get pageSizes(): number[] {
    return ApiHelper.PAGE_SIZES;
  }

  get pageSize(): number {
    const pagination = this.pagination;
    return pagination ? pagination.pageSize : ApiHelper.DEFAULT_PAGE_SIZE;
  }

  set pageSize(pageSize: number) {
    const pagination = this.pagination;
    if (this.pagination) {
      this.doUpdate({
        page: this.pagination.page,
        pageSize: pageSize
      });
    }
  }

  private doUpdate(data: PageData) {
    this.query.page = data.page;
    this.query.pageSize = data.pageSize;
    this.update.emit();
  }

}
