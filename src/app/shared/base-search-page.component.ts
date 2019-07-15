import { HttpResponse } from '@angular/common/http';
import { Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { QueryFilters } from 'app/api/models';
import { NextRequestState } from 'app/core/next-request-state';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { ResultType } from 'app/shared/result-type';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Base class implemented by search pages.
 * @param D The data type
 * @param P The search parameters which extends the QueryFiters type with path variables
 * @param R The result type
 */
export abstract class BaseSearchPageComponent<D, P extends QueryFilters, R> extends BasePageComponent<D> implements OnInit {
  // Export ResultType to the template
  ResultType = ResultType;

  resultType$ = new BehaviorSubject<ResultType>(null);
  resultTypeControl = new FormControl(null);
  results$ = new BehaviorSubject<PagedResults<R>>(null);
  allowedResultTypes$ = new BehaviorSubject([ResultType.LIST]);
  rendering$ = new BehaviorSubject(false);
  moreFilters$ = new BehaviorSubject(false);
  previousResultType: ResultType;

  nextRequestState: NextRequestState;

  readonly form: FormGroup;
  previousValue: any;

  protected printable = false;
  private _moreFiltersAction: HeadingAction;

  protected onDataInitialized(_data: D) {
    this.stateManager.manage(this.form);
    this.stateManager.manage(this.resultTypeControl, 'resultType');
    this.stateManager.manageValue(this.moreFilters$, 'moreFilters');
    this.previousValue = this.form.value;
    this.previousResultType = this.resultType;
    this.resultType$.next(this.previousResultType);
    this.addSub(this.resultTypeControl.valueChanges.subscribe(rt => {
      if (this.shouldUpdateOnChange(this.form.value)) {
        this.update();
      }
      const previous = this.previousResultType;
      this.previousResultType = rt;
      this.resultType$.next(rt);
      if (previous == null || previous !== rt) {
        this.rendering = true;
        this.stateManager.set('resultType', rt);
        this.onResultTypeChanged(rt, previous);
      }
    }));

    // Only after finishing initialization add a listener to form values to update the results. This avoids duplicated searches.
    setTimeout(() => {
      this.addSub(this.form.valueChanges.pipe(debounceTime(ApiHelper.DEBOUNCE_TIME)).subscribe(value => {
        if (this.shouldUpdateOnChange(value)) {
          this.update();
        }
        this.previousValue = value;
      }), true);
      // When starting with categories, don't initially search
      if (this.previousResultType !== ResultType.CATEGORIES) {
        this.update();
      }
    }, 1);
  }

  /**
   * By default will just skip the update if only the result type has changed
   * @param value The current form value
   */
  protected shouldUpdateOnChange(value: any): boolean {
    const previousResultType = this.previousResultType;
    const resultType = this.resultType;
    const wasCategoriesOrNull = previousResultType == null || previousResultType === ResultType.CATEGORIES;
    const isCategories = resultType === ResultType.CATEGORIES;
    if (isCategories && !wasCategoriesOrNull) {
      // Switching to categories - don't update results
      return false;
    } else if (wasCategoriesOrNull) {
      // Either first time or switching from categories. Update.
      return true;
    }
    return !isEqual(this.previousValue, value);
  }

  get results(): PagedResults<R> {
    return this.results$.value;
  }
  set results(results: PagedResults<R>) {
    this.results$.next(results);
  }

  get rendering(): boolean {
    return this.rendering$.value;
  }
  set rendering(rendering: boolean) {
    this.rendering$.next(rendering);
  }

  get allowedResultTypes(): ResultType[] {
    return this.allowedResultTypes$.value;
  }
  set allowedResultTypes(resultTypes: ResultType[]) {
    this.allowedResultTypes$.next(resultTypes);
  }

  get moreFilters(): boolean {
    return this.moreFilters$.value;
  }
  set moreFilters(moreFilters: boolean) {
    this.moreFilters$.next(moreFilters);
  }


  get pageData(): PageData {
    const val = this.form.value;
    return {
      page: val.page,
      pageSize: val.pageSize
    };
  }
  set pageData(pageData: PageData) {
    this.form.patchValue(pageData);
  }

  get resultType(): ResultType {
    return this.resultTypeControl.value;
  }
  set resultType(resultType: ResultType) {
    if (resultType == null) {
      resultType = this.getInitialResultType();
    }
    this.resultTypeControl.setValue(resultType);
  }

  constructor(injector: Injector) {
    super(injector);
    this.nextRequestState = injector.get(NextRequestState);
    const controls: any = {};
    controls.page = 0;
    controls.resultType = this.getInitialResultType();
    for (const name of this.getFormControlNames() || []) {
      controls[name] = null;
    }
    this.form = this.formBuilder.group(controls);
  }

  ngOnInit() {
    super.ngOnInit();
    this.resultType = this.getInitialResultType();
  }

  protected get moreFiltersAction(): HeadingAction {
    if (this._moreFiltersAction) {
      return this._moreFiltersAction;
    }

    this._moreFiltersAction = new HeadingAction(this.showMoreFiltersIcon(), this.showMoreFiltersLabel(), () => {
      this.moreFilters = !this.moreFilters;
      this._moreFiltersAction.icon = this.moreFilters ? this.showLessFiltersIcon() : this.showMoreFiltersIcon();
      this._moreFiltersAction.label = this.moreFilters ? this.showLessFiltersLabel() : this.showMoreFiltersLabel();
    }, true);
    this._moreFiltersAction.breakpoint = 'gt-xxs';

    return this._moreFiltersAction;
  }

  /**
   * Returns the label for showing more filters action
   */
  protected showMoreFiltersLabel(): string {
    return this.printable ? this.i18n.general.showMoreFilters : this.i18n.general.moreFilters;
  }

  /**
   * Returns the label for showing less filters action
   */
  protected showLessFiltersLabel(): string {
    return this.printable ? this.i18n.general.showLessFilters : this.i18n.general.lessFilters;
  }

  /**
   * Returns the icon for showing more filters action
   */
  protected showMoreFiltersIcon(): string {
    return 'filter_list';
  }

  /**
   * Returns the icon for showing less filters action
   */
  protected showLessFiltersIcon(): string {
    return 'filter_list';
  }

  /**
   * Callback invoked whenever the result type changes
   * @param _resultType The new result type
   * @param _previous The previous result type
   */
  protected onResultTypeChanged(_resultType: ResultType, _previous: ResultType): void {
  }

  /**
   * Must be implemented to return the names for each form control
   */
  protected abstract getFormControlNames(): string[];

  /**
   * Can be overridden to determine the initial result type in this search
   */
  protected getInitialResultType(): ResultType {
    return ResultType.LIST;
  }

  /**
   * Must be implemented to actually call the API method for search
   */
  protected abstract doSearch(filter: P): Observable<HttpResponse<R[]>>;

  /**
  * Must be implemented to convert from the object obtained from the FormGroup to the query filters
  */
  protected abstract toSearchParams(value: any): P;

  /**
   * Updates the search results
   */
  update(pageData?: PageData) {
    if (pageData) {
      this.form.patchValue(pageData, { emitEvent: false });
    }
    this.rendering = true;
    this.results = null;
    this.nextRequestState.leaveNotification = true;
    const value = this.form.value;
    value.pageSize = this.layout.searchPageSize;
    this.addSub(this.doSearch(this.toSearchParams(value)).subscribe(response => {
      if (this.resultType === ResultType.CATEGORIES) {
        // Switch to the first allowed result type that isn't categories
        this.resultType = this.allowedResultTypes.find(rt => rt !== ResultType.CATEGORIES);
      }
      this.results = PagedResults.from(response);
    }));
  }

  /**
   * Resets the current page and page size of the current form, optionally emitting the change event (which will trigger a new search)
   */
  resetPage(emitEvent = false) {
    this.form.patchValue({ page: 0 }, { emitEvent: emitEvent });
  }

}
