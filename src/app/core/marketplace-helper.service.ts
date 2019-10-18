import { Injectable } from '@angular/core';
import { AdStatusEnum, OrderStatusEnum } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';
import { AuthHelperService } from 'app/core/auth-helper.service';



/**
 * Helper service for marketplace functions
 */
@Injectable({
  providedIn: 'root'
})
export class MarketplaceHelperService {



  constructor(
    private i18n: I18n,
    protected authHelper: AuthHelperService
  ) { }

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

}
