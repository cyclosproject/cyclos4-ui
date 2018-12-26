import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdOrderByEnum, AdResult } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays the latest advertisements
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
    if (!this.max) {
      this.max = 6;
    }

    this.addSub(this.marketplaceService.searchAds({
      addressResult: AdAddressResultEnum.NONE,
      groups: this.groups,
      hasImages: true,
      profileFields: ['image:true'],
      orderBy: AdOrderByEnum.DATE,
      fields: ['id', 'owner', 'image', 'name'],
      pageSize: this.max * 3
    }).subscribe(ads => {
      this.ads$.next(this.preprocess(ads));
      this.notifyReady();
    }));
  }

  /**
   * Attempt to leave a single ad per user. If not possible, then repeat ads
   */
  private preprocess(ads: AdResult[]): AdResult[] {
    if (ads.length < this.max) {
      return ads;
    }
    const result = this.onePerOwner(ads).slice(0, this.max);
    while (result.length < this.max) {
      // We still need more results, yet, from different owners
      const remaining = ads.filter(ad => !result.includes(ad));
      const onePerOwner = this.onePerOwner(remaining);
      for (const ad of onePerOwner) {
        if (result.length < this.max) {
          result.push(ad);
        }
      }
    }
    return result;
  }

  /**
   * Returns a single ad per owner
   */
  private onePerOwner(ads: AdResult[]): AdResult[] {
    const owners = new Set<string>();
    const result: AdResult[] = [];
    // First pass: collect a single ad from each owner
    for (const ad of ads) {
      if (owners.has(ad.owner.id)) {
        continue;
      }
      owners.add(ad.owner.id);
      result.push(ad);
    }
    return result;
  }

  path(ad: AdResult): string[] {
    return ['/marketplace', 'view', ad.id];
  }

  navigate(ad: AdResult, event: MouseEvent) {
    this.doNavigate(this.path(ad), event);
  }

  navigateToOwner(ad: AdResult, event: MouseEvent) {
    this.doNavigate(['/users', 'profile', ad.owner.id], event);
  }

  private doNavigate(url: string[], event: MouseEvent) {
    this.menu.setActiveMenu(Menu.SEARCH_ADS);
    this.router.navigate(url);
    event.preventDefault();
    event.stopPropagation();
    this.breadcrumb.clear();
    this.stateManager.clear();
  }
}
