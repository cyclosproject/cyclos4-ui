import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { QueryFilters, User, VoucherCategory, VoucherTypeDetailed } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { empty, normalizeKeywords } from 'app/shared/helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { ResultType } from 'app/ui/shared/result-type';
import { BehaviorSubject, Observable, of } from 'rxjs';

export type Query = { keywords?: string, category?: string; } & QueryFilters;

/**
 * A selection of a voucher type for either generate / buy / send vouchers.
 */
@Component({
  selector: 'voucher-type-selection',
  templateUrl: 'voucher-type-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherTypeSelectionComponent extends BaseSearchPageComponent<any, Query, VoucherTypeDetailed> implements OnInit {
  @Input() heading: string;
  @Input() mobileHeading: string;
  @Input() categories: VoucherCategory[];
  @Input() types: VoucherTypeDetailed[];
  @Input() user: User;

  @Output() typeSelected = new EventEmitter<VoucherTypeDetailed>();

  headingActions$ = new BehaviorSubject<HeadingAction[]>([]);
  hasCategories: boolean;
  hasFilters: boolean;
  showForm: boolean;
  showCategoriesAction: HeadingAction;
  showTypesAction: HeadingAction;

  constructor(
    injector: Injector,
    public authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    if (this.types == null) {
      this.types = [];
    }
    this.hasCategories = !empty(this.categories);
    if (this.hasCategories) {
      // Types without a category get an artificial 'Other' category
      const noCategory = this.types.filter(t => !t.category);
      if (noCategory.length > 0) {
        const other: VoucherCategory = { id: 'other', name: this.i18n.voucher.otherCategory };
        this.categories = [...this.categories, other];
        noCategory.forEach(t => t.category = other);
      }

      this.showCategoriesAction = new HeadingAction(SvgIcon.Handbag, this.i18n.voucher.showCategories, () => this.showCategories());
      this.showTypesAction = new HeadingAction(SvgIcon.Ticket, this.i18n.voucher.listTypes, () => this.showTypes());
    }
    this.hasFilters = this.hasCategories || this.types.length > 6;
    this.showForm = this.hasFilters || this.user && !this.authHelper.isSelf(this.user);
    this.data = {};
    this.allowedResultTypes = this.hasCategories ? [ResultType.CATEGORIES, ResultType.LIST] : [ResultType.LIST];
    this.resultType = this.hasCategories ? ResultType.CATEGORIES : ResultType.LIST;
  }

  protected getFormControlNames(): string[] {
    return ['keywords', 'category'];
  }

  onResultTypeChanged(resultType: ResultType) {
    if (resultType === ResultType.CATEGORIES) {
      this.form.patchValue({ category: null, keywords: null });
    }
  }

  protected doSearch(filter: Query): Observable<HttpResponse<VoucherTypeDetailed[]>> {
    let kw = normalizeKeywords(filter.keywords);
    let types = [...this.types];
    if (kw.length > 0) {
      // When there's a keyword filter, apply it
      types = types.filter(t =>
        normalizeKeywords(t.voucherTitle).includes(kw)
        || normalizeKeywords(t.voucherDescription).includes(kw)
        || normalizeKeywords(t.name).includes(kw)
        || t.category && normalizeKeywords(t.category.name).includes(kw));
    }
    if (filter.category) {
      types = types.filter(t => t.category.id === filter.category);
    }
    return of(new HttpResponse<VoucherTypeDetailed[]>({ body: types }));
  }

  protected toSearchParams(value: any) {
    return value;
  }

  resolveMenu() {
    return null;
  }

  getInitialResultType() {
    return this.hasCategories ? ResultType.CATEGORIES : ResultType.LIST;
  }

  get selectType() {
    return (type: VoucherTypeDetailed) => this.typeSelected.emit(type);
  }

  showCategories() {
    this.resultType = ResultType.CATEGORIES;
  }

  showTypes() {
    this.resultType = ResultType.LIST;
  }

  selectCategory(cat: VoucherCategory) {
    if (cat) {
      this.form.patchValue({ category: cat.id });
      this.resultType = ResultType.LIST;
    } else {
      this.form.patchValue({ category: null });
      this.resultType = ResultType.CATEGORIES;
    }
  }

  get currentCategory(): VoucherCategory {
    const id = this.form.controls.category.value;
    return id ? this.categories.find(c => c.id === id) : null;
  }
}
