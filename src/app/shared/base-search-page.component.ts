import { HttpResponse } from '@angular/common/http';
import { Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { scrollTop } from 'app/shared/helper';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { ResultType } from 'app/shared/result-type';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Base class implemented by search pages.
 * @param D The data type
 * @param R The result type
 */
export abstract class BaseSearchPageComponent<D, R> extends BasePageComponent<D> implements OnInit {
  // Export ResultType to the template
  ResultType = ResultType;

  resultType$ = new BehaviorSubject<ResultType>(null);
  resultTypeControl = new FormControl(null);
  results$ = new BehaviorSubject<PagedResults<R>>(null);
  allowedResultTypes$ = new BehaviorSubject([ResultType.LIST]);
  loaded$ = new BehaviorSubject(false);
  rendering$ = new BehaviorSubject(false);
  moreFilters$ = new BehaviorSubject(false);
  previousResultType: ResultType;

  readonly form: FormGroup;
  previousValue: any;

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
      this.resultType$.next(rt);
      this.previousResultType = rt;
    }));
    this.addSub(this.form.valueChanges.pipe(debounceTime(ApiHelper.DEBOUNCE_TIME)).subscribe(value => {
      if (this.shouldUpdateOnChange(value)) {
        this.update();
      }
      this.previousValue = value;
    }), true);
    this.loaded = true;

    // When starting with categories, don't initially search
    if (this.previousResultType !== ResultType.CATEGORIES) {
      this.update();
    }
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

  get loaded(): boolean {
    return this.loaded$.value;
  }
  set loaded(loaded: boolean) {
    this.loaded$.next(loaded);
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
    const previous = this.resultType;
    if (previous == null || previous !== resultType) {
      this.rendering = true;
      this.resultTypeControl.setValue(resultType);
      // .. however, we must update the state, otherwise the result type isn't remembered
      if (previous != null) {
        this.stateManager.set('resultType', resultType);
      }
      this.onResultTypeChanged(resultType, previous);
    }
  }

  constructor(injector: Injector) {
    super(injector);
    const controls: any = {};
    controls.page = 0;
    controls.pageSize = null;
    controls.resultType = this.getInitialResultType();
    for (const name of this.getFormControlNames() || []) {
      controls[name] = null;
    }
    this.form = this.formBuilder.group(controls);
    this.addSub(this.resultTypeControl.valueChanges.subscribe(resultType => {
      this.resultType = resultType;
    }), false);
  }

  ngOnInit() {
    super.ngOnInit();
    this.resultType = this.getInitialResultType();
  }

  protected get moreFiltersAction(): HeadingAction {
    if (this._moreFiltersAction) {
      return this._moreFiltersAction;
    }

    const more = this.i18n('More filters');
    const less = this.i18n('Less filters');

    this._moreFiltersAction = new HeadingAction('filter_list', more, () => {
      this.moreFilters = !this.moreFilters;
      this._moreFiltersAction.label = this.moreFilters ? less : more;
    }, true);

    return this._moreFiltersAction;
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
  protected abstract doSearch(value: any): Observable<HttpResponse<R[]>>;

  /**
   * Updates the search results
   */
  protected update(pageData?: PageData) {
    if (pageData) {
      // Scroll to the beginning of the results before updating
      const results = document.getElementsByTagName('results-layout');
      const element = results.length === 0 ? null : results.item(0) as HTMLElement;
      scrollTop(element);
      this.form.patchValue(pageData, { emitEvent: false });
    }
    this.rendering = true;
    this.results = null;
    this.addSub(this.doSearch(this.form.value).subscribe(response => {
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
    this.form.patchValue({ page: 0, pageSize: null }, { emitEvent: emitEvent });
  }

}
