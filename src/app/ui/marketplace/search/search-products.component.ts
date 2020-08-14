import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AdKind, AdResult, AdStatusEnum, Currency } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { PageData } from 'app/ui/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * A component which allows to search and select webshop products for the current user and a given currency
 */
@Component({
  selector: 'search-products',
  templateUrl: 'search-products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchProductsComponent extends BaseComponent implements OnInit {

  private pageSize = 8;

  @Input() currency: Currency;
  @Output() select = new EventEmitter<AdResult>();

  form: FormGroup;

  results$ = new BehaviorSubject<PagedResults<AdResult>>(null);
  rendering$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private marketplaceService: MarketplaceService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({ keywords: null });
    this.addSub(this.form.controls.keywords.valueChanges.subscribe(() => this.update()));
    this.update();
  }

  /**
   * Updates the search results
   */
  update(pageData?: PageData) {
    this.rendering = true;
    this.results = null;
    this.addSub(this.doSearch(pageData).subscribe(response =>
      this.results = PagedResults.from(response),
    ));
  }

  get onClick() {
    return (row: AdResult) => this.addProduct(row);
  }

  addProduct(row: AdResult) {
    if (!this.isOutOfStock(row)) {
      this.notification.snackBar(this.i18n.ad.addedProductOrder);
      this.select.emit(row);
    }
  }

  doSearch(pageData: PageData): Observable<HttpResponse<AdResult[]>> {
    const data: any = pageData || {};
    const query = {
      user: this.ApiHelper.SELF,
      kind: AdKind.WEBSHOP,
      currency: this.currency.id,
      statuses: [AdStatusEnum.ACTIVE],
      pageSize: data.pageSize || this.pageSize,
      page: data.page || 0,
      keywords: this.form.controls.keywords.value,
    };
    return this.marketplaceService.searchUserAds$Response(query);
  }

  close() {
    this.modalRef.hide();
  }

  get results(): PagedResults<AdResult> {
    return this.results$.value;
  }
  set results(results: PagedResults<AdResult>) {
    this.results$.next(results);
  }
  get rendering(): boolean {
    return this.rendering$.value;
  }
  set rendering(rendering: boolean) {
    this.rendering$.next(rendering);
  }

  /**
   * Resolves if the item is out of stock
   */
  resolveStockLabel(ad: AdResult): string {
    if (!ad.unlimitedStock) {
      const quantity = +ad.stockQuantity || 0;
      if (quantity === 0) {
        return this.i18n.ad.outOfStock;
      } else {
        return this.format.formatAsNumber(ad.stockQuantity, quantity % 1 === 0 ? 0 : 2);
      }
    }
    return this.i18n.ad.unlimited;
  }

  /**
   * Returns if the given ad is out of stock
   */
  isOutOfStock(ad: AdResult): boolean {
    return this.resolveStockLabel(ad) === this.i18n.ad.outOfStock;
  }

}
