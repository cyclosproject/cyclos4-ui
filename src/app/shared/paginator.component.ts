import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { ElementReference, scrollTop } from 'app/shared/helper';
import { Breakpoint } from 'app/shared/layout.service';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { ArrowsHorizontal } from 'app/shared/shortcut.service';

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
export class PaginatorComponent<T> extends BaseComponent implements OnInit {

  @Input() scrollAnchor: ElementReference;

  _results: PagedResults<T>;
  @Input() get results(): PagedResults<T> {
    return this._results;
  }
  set results(results: PagedResults<T>) {
    this._results = results;
    if (results) {
      this.lastPage = results;
      if (this.form) {
        this.form.setValue({
          pageNumber: results.page + 1,
          pageSize: results.pageSize
        }, {
            emitEvent: false
          });
      }
    }
  }

  @Output() update = new EventEmitter<PageData>();

  form: FormGroup;

  private lastPage: PageData;

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    const results = this.results || { page: null, pageSize: null };
    this.form = this.formBuilder.group({
      // PageNumber is always page + 1, as NgxBootstrap is 1-based, and we're 0-based
      pageNumber: (results.page || 0) + 1,
      pageSize: null
    });
    this.addSub(this.form.valueChanges.subscribe(
      val => {
        const data: PageData = {
          page: val.pageNumber - 1,
          pageSize: val.pageSize
        };
        this.doUpdate(data);
      }));

    this.addShortcut(ArrowsHorizontal, event => {
      if (this.layout.gtxs) {
        return false;
      }
      this.nextOrPrevious(event.key === 'ArrowRight');
    });
  }

  maxSize(breakpoints: Set<Breakpoint>): number {
    return breakpoints.has('lt-md') ? 5 : 7;
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

      // Scroll back to anchor element or top
      scrollTop(this.scrollAnchor);
    }
  }

  nextOrPrevious(next: boolean) {
    if (!this.results) {
      return;
    }
    if (next && !this.results.hasNext) {
      return;
    }
    if (!next && this.results.page <= 0) {
      return;
    }
    this.doUpdate({
      page: this.results.page + (next ? 1 : -1),
      pageSize: this.results.pageSize
    });
  }
}
