import { Injectable } from '@angular/core';
import { AdStatusEnum } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';



/**
 * Helper service for marketplace functions
 */
@Injectable({
  providedIn: 'root'
})
export class MarketplaceHelperService {



  constructor(
    private i18n: I18n
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

}
