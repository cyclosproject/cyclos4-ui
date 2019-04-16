import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Configuration } from 'app/configuration';
import { I18n } from 'app/i18n/i18n';
import { Breakpoint, LayoutService } from 'app/shared/layout.service';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { Subscription } from 'rxjs';

/**
 * Renders a paginator, which allows the user to change the visible results in a table
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'paginator',
  templateUrl: 'paginator.component.html',
  styleUrls: ['paginator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent<T> implements OnDestroy {
  constructor(
    public layout: LayoutService,
    public i18n: I18n,
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

  maxSize(breakpoints: Set<Breakpoint>): number {
    if (breakpoints.has('xxs')) {
      return 3;
    } else if (breakpoints.has('lt-md')) {
      return 5;
    } else {
      return 7;
    }
  }

  get pageSizes(): number[] {
    return Configuration.searchPageSizes;
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
