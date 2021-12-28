import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { AdResult } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';

/**
 * Displays the latest advertisements
 */
@Component({
  selector: 'latest-ads',
  templateUrl: 'latest-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestAdsComponent extends BaseDashboardComponent implements OnInit {

  @HostBinding('class.dashboard-icon-result') classIconResult = true;

  @Input() ads: AdResult[];

  constructor(
    injector: Injector,
    private menu: MenuService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // The heading actions
    this.headingActions = [
      new HeadingAction(SvgIcon.Search, this.i18n.general.view,
        event => this.menu.navigate({
          menu: new ActiveMenu(Menu.SEARCH_ADS),
          clear: false,
          event,
        }),
        true),
    ];
  }

  path(ad: AdResult): string {
    return `/marketplace/view/${ad.id}`;
  }

  navigate(ad: AdResult, event: MouseEvent) {
    this.menu.navigate({
      url: this.path(ad),
      menu: new ActiveMenu(Menu.SEARCH_ADS),
      clear: false,
      event,
    });
  }
}
