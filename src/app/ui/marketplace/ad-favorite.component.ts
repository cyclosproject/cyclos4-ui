import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { AdResult } from 'app/api/models';
import { MarketplaceService } from 'app/api/services/marketplace.service';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick } from 'app/shared/helper';

/**
 * Mark/unmark a favorite ad
 */
@Component({
  selector: 'ad-favorite',
  templateUrl: 'ad-favorite.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdFavoriteComponent extends BaseComponent {
  blurIfClick = blurIfClick;

  @Input() ad: AdResult;

  constructor(injector: Injector, private marketplaceService: MarketplaceService) {
    super(injector);
  }

  setFavorite(ad: AdResult): void {
    if (ad.favoriteForViewer) {
      this.addSub(
        this.marketplaceService.unmarkAsFavorite({ ad: ad.id }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.removedFromFavorites);
        })
      );
    } else {
      this.addSub(
        this.marketplaceService.markAsFavorite({ ad: ad.id }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.addedToFavorites);
        })
      );
    }
    ad.favoriteForViewer = !ad.favoriteForViewer;
  }
}
