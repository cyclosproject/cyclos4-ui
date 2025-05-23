import { Inject, Injectable } from '@angular/core';
import { AdCategoryWithChildren, AdStatusEnum, OrderStatusEnum, ShoppingCartItemDetailed } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { FormatService } from 'app/core/format.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { empty } from 'app/shared/helper';
import { HierarchyItem } from 'app/ui/marketplace/hierarchy-item.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Helper service for marketplace functions
 */
@Injectable({
  providedIn: 'root'
})
export class MarketplaceHelperService {
  cartItems$ = new BehaviorSubject<number>(0);

  constructor(
    @Inject(I18nInjectionToken) private i18n: I18n,
    protected authHelper: AuthHelperService,
    protected dataForFrontendHolder: DataForFrontendHolder,
    protected format: FormatService
  ) {
    // Subscribe for cart items count on UI initialization
    dataForFrontendHolder.subscribe(dataForFrontend => {
      const dataForUi = (dataForFrontend || {}).dataForUi || {};
      this.cartItems = dataForUi.shoppingCartWebShopCount || 0;
    });
  }

  /**
   * Resolves the label for the given status
   */
  resolveStatusLabel(status: AdStatusEnum) {
    switch (status) {
      case AdStatusEnum.ACTIVE:
        return this.i18n.ad.status.active;
      case AdStatusEnum.DISABLED:
        return this.i18n.ad.status.disabled;
      case AdStatusEnum.DRAFT:
        return this.i18n.ad.status.draft;
      case AdStatusEnum.EXPIRED:
        return this.i18n.ad.status.expired;
      case AdStatusEnum.HIDDEN:
        return this.i18n.ad.status.hidden;
      case AdStatusEnum.PENDING:
        return this.i18n.ad.status.pending;
      case AdStatusEnum.SCHEDULED:
        return this.i18n.ad.status.scheduled;
    }
  }

  /**
   * Resolves the label for the given order status
   */
  resolveOrderStatusLabel(status: OrderStatusEnum) {
    switch (status) {
      case OrderStatusEnum.COMPLETED:
        return this.i18n.ad.orderStatus.completed;
      case OrderStatusEnum.DISPOSED:
        return this.i18n.ad.orderStatus.disposed;
      case OrderStatusEnum.DRAFT:
        return this.i18n.ad.orderStatus.draft;
      case OrderStatusEnum.PAYMENT_CANCELED:
        return this.i18n.ad.orderStatus.paymentCanceled;
      case OrderStatusEnum.PAYMENT_DENIED:
        return this.i18n.ad.orderStatus.paymentDenied;
      case OrderStatusEnum.PAYMENT_EXPIRED:
        return this.i18n.ad.orderStatus.paymentExpired;
      case OrderStatusEnum.PAYMENT_PENDING:
        return this.i18n.ad.orderStatus.paymentPending;
      case OrderStatusEnum.PENDING_BUYER:
        return this.i18n.ad.orderStatus.pendingBuyer;
      case OrderStatusEnum.PENDING_SELLER:
        return this.i18n.ad.orderStatus.pendingSeller;
      case OrderStatusEnum.REJECTED_BY_BUYER:
        return this.i18n.ad.orderStatus.rejectedByBuyer;
      case OrderStatusEnum.REJECTED_BY_SELLER:
        return this.i18n.ad.orderStatus.rejectedBySeller;
    }
  }

  /**
   * Returns the items quantity formatted with decimals based on the webshop definition
   */
  getFormattedQuantity(item: ShoppingCartItemDetailed): string {
    return this.format.formatAsNumber(item.quantity, item.product.allowDecimalQuantity ? 2 : 0);
  }

  /**
   * Returns the current cart items count
   */
  get cartItems(): number {
    return this.cartItems$.value;
  }

  /**
   * Updates the cart items count to be reflected in top bar
   */
  set cartItems(items: number) {
    this.cartItems$.next(items);
  }

  /**
   * Creates a list of categories with extra information (e.g level, leaf) used for rendering
   */
  populateCategories(categories: HierarchyItem[], items: AdCategoryWithChildren[], level: number) {
    for (const item of items) {
      const hasChildren = !empty(item.children);
      const hierarchy: HierarchyItem = item as any;
      hierarchy.level = level;
      hierarchy.leaf = !hasChildren;
      categories.push(hierarchy);
      if (hasChildren) {
        this.populateCategories(categories, item.children, level + 1);
      }
    }
  }
}
