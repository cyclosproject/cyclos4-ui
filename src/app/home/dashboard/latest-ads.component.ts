import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdResult, AdOrderByEnum } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the latest
 */
@Component({
  selector: 'latest-ads',
  templateUrl: 'latest-ads.component.html',
  styleUrls: ['latest-ads.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestAdsComponent extends BaseDashboardComponent implements OnInit {

  @Input() groups: string[];
  @Input() max: number;

  ads$ = new BehaviorSubject<AdResult[]>(null);

  constructor(injector: Injector,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.addSub(this.marketplaceService.searchAds({
      addressResult: AdAddressResultEnum.NONE,
      groups: this.groups,
      hasImages: true,
      orderBy: AdOrderByEnum.DATE,
      fields: ['id', 'owner.display', 'image', 'name'],
      pageSize: this.max
    }).subscribe(ads => {
      this.ads$.next(ads);
      this.notifyReady();
    }));
  }

  path(ad: AdResult): string[] {
    return ['/marketplace', 'view', ad.id];
  }
}
