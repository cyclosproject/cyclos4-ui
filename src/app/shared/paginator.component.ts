import { ChangeDetectionStrategy, Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { MatTable } from '@angular/material';
import { QueryFilters } from 'app/api/models';
import { PaginationData } from 'app/shared/pagination-data';
import { ApiHelper } from 'app/shared/api-helper';
import { FormBuilder, FormGroup } from '@angular/forms';

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
  constructor(
    injector: Injector,
    formBuilder: FormBuilder) {
    super(injector);
    this.form = formBuilder.group({
      page: null,
      pageSize: null
    });
  }

  @Input()
  dataSource: TableDataSource<T>;

  @Input()
  query: QueryFilters;

  @Output()
  update = new EventEmitter<void>();

  form: FormGroup;

  private initialized = false;

  ngOnInit() {
    super.ngOnInit();
    this.subscriptions.push(this.dataSource.pagination.subscribe(pagination => {
      if (pagination) {
        if (!this.initialized) {
          this.form.setValue({
            page: pagination.page,
            pageSize: pagination.pageSize
          });
          this.initialized = true;
        }
      }
    }));
    this.subscriptions.push(this.form.valueChanges.subscribe(
      val => this.doUpdate(val as PageData)));
  }

  get pagination(): PaginationData {
    return this.dataSource.pagination.value;
  }

  previous() {
    const pagination = this.pagination;
    if (!pagination || pagination.page === 0) {
      return;
    }
    this.form.patchValue({
      page: pagination.page - 1
    });
  }

  next() {
    const pagination = this.pagination;
    if (pagination && pagination.hasTotalCount && pagination.page >= pagination.pageCount) {
      // We know by the total count that there shouldn't have any other page
      return;
    }
    this.form.patchValue({
      page: pagination.page + 1
    });
  }

  first() {
    const pagination = this.pagination;
    if (!pagination) {
      return;
    }
    this.form.patchValue({
      page: 0
    });
  }

  last() {
    const pagination = this.pagination;
    if (!pagination || !pagination.hasTotalCount) {
      return;
    }
    this.form.patchValue({
      page: pagination.pageCount - 1
    });
  }

  get pageSizes(): number[] {
    return ApiHelper.PAGE_SIZES;
  }

  private doUpdate(data: PageData) {
    if (this.query) {
      this.query.page = data.page;
      this.query.pageSize = data.pageSize;
      this.update.emit();
    }
  }

}
