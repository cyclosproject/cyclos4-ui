import { ChangeDetectionStrategy, Component, Injector, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { QueryFilters } from 'app/api/models';
import { PagedResults } from 'app/shared/paged-results';
import { ApiHelper } from 'app/shared/api-helper';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LayoutService } from 'app/shared/layout.service';
import { PageData } from 'app/shared/page-data';

/**
 * Renders a paginator, which allows the user to change the visible results in a table
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'paginator',
  templateUrl: 'paginator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent<T> implements OnDestroy {
  constructor(
    public layout: LayoutService,
    formBuilder: FormBuilder) {
    this.form = formBuilder.group({
      // PageNumber is always page + 1, as NgxBootstrap is 1-based, and we're 0-based
      pageNumber: null,
      pageSize: null
    });
    this.formSub = this.form.valueChanges.subscribe(
      val => {
        const data: PageData = {
          page: val.pageNumber - 1,
          pageSize: val.pageSize
        };
        this.doUpdate(data);
      });
  }

  private formSub: Subscription;

  _results: PagedResults<T>;
  @Input() get results(): PagedResults<T> {
    return this._results;
  }

  set results(results: PagedResults<T>) {
    this._results = results;
    if (results) {
      this.lastPage = results;
      this.form.setValue({
        pageNumber: results.page + 1,
        pageSize: results.pageSize
      }, {
          emitEvent: false
        });
    }
  }

  @Output() update = new EventEmitter<PageData>();

  form: FormGroup;

  private lastPage: PageData;

  ngOnDestroy(): void {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
  }

  get pageSizes(): number[] {
    return ApiHelper.PAGE_SIZES;
  }

  get totalCount(): number {
    if (this.results.hasTotalCount) {
      return this.results.totalCount;
    }
    // When there's no total count, we simulate it by sending enough records for another page
    return (this.results.page + 1) * this.results.pageSize + (this.results.hasNext ? 1 : 0);
  }

  private doUpdate(data: PageData) {
    const changed = this.lastPage == null || data == null || data.page !== this.lastPage.page || data.pageSize !== this.lastPage.pageSize;
    if (changed) {
      this.lastPage = data;
      this.update.emit(data);
    }
  }

}
