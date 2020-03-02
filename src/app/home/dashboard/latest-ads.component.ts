import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdOrderByEnum, AdResult } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';
import { Menu, ActiveMenu } from 'app/shared/menu';
import { HeadingAction } from 'app/shared/action';

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

    // The heading actions
    this.headingActions = [
      new HeadingAction('search', this.i18n.general.view,
        event => this.menu.navigate({
          menu: new ActiveMenu(Menu.SEARCH_ADS),
          clear: false,
          event: event
        }),
        true)
    ];

    this.addSub(this.marketplaceService.searchAds({
      addressResult: AdAddressResultEnum.NONE,
      groups: this.groups,
      hasImages: true,
      profileFields: ['image:true'],
      orderBy: AdOrderByEnum.DATE,
      fields: ['id', 'owner', 'image', 'name'],
      pageSize: this.max * 3,
      skipTotalCount: true
    }).subscribe(ads => {
      this.ads$.next(this.preprocess(ads));
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
    let i = 0;
    while (result.length < this.max) {
      // We still need more results, yet, from different owners
      const remaining = ads.filter(ad => !result.includes(ad));
      const onePerOwner = this.onePerOwner(remaining);
      for (const ad of onePerOwner) {
        if (result.length < this.max) {
          result.push(ad);
        }
      }
      if (i++ > 3) {
        break;
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
      if (ad.owner && ad.owner.id) {
        if (owners.has(ad.owner.id)) {
          continue;
        }
        owners.add(ad.owner.id);
        result.push(ad);
      }
    }
    return result;
  }

  path(ad: AdResult): string {
    return `/marketplace/view/${ad.id}`;
  }

  navigate(ad: AdResult, event: MouseEvent) {
    this.menu.navigate({
      url: this.path(ad),
      menu: new ActiveMenu(Menu.SEARCH_ADS),
      clear: false,
      event: event
    });
  }

  navigateToOwner(ad: AdResult, event: MouseEvent) {
    this.menu.navigate({
      url: `/users/${ad.owner.id}/profile`,
      menu: new ActiveMenu(Menu.SEARCH_USERS),
      clear: false,
      event: event
    });
  }
}
