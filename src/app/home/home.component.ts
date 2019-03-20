import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Configuration } from 'app/configuration';
import { ContentPage } from 'app/content/content-page';
import { handleFullWidthLayout } from 'app/content/content-with-layout';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { BasePageComponent, UpdateTitleFrom } from 'app/shared/base-page.component';
import { BehaviorSubject } from 'rxjs';

export const SessionToken = 'sessionToken';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<void> implements OnInit {

  ready$ = new BehaviorSubject(false);
  homePage: ContentPage;
  configs$ = new BehaviorSubject<DashboardItemConfig[]>(null);
  leftConfigs$ = new BehaviorSubject<DashboardItemConfig[]>(null);
  rightConfigs$ = new BehaviorSubject<DashboardItemConfig[]>(null);
  fullConfigs$ = new BehaviorSubject<DashboardItemConfig[]>(null);

  constructor(private injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    if (this.login.user == null) {
      // For guests, just fetch the content
      this.homePage = Configuration.homePage || { content: '' };
      this.ready$.next(true);
    } else {
      // For logged users, resolve the dashboard items
      const configs = Configuration.dashboard ? Configuration.dashboard.dashboardItems(this.injector) : null;
      if (configs instanceof Array) {
        this.initializeItems(configs);
      } else {
        this.addSub(configs.subscribe(i => {
          this.initializeItems(i);
        }));
      }
    }
  }

  private initializeItems(configs: DashboardItemConfig[]) {
    configs = configs.filter(i => !!i);
    this.configs$.next(configs);
    this.leftConfigs$.next(configs.filter(c => c.column === 'left'));
    this.rightConfigs$.next(configs.filter(c => c.column === 'right'));
    this.fullConfigs$.next(configs.filter(c => c.column == null || c.column === 'full'));
    this.ready$.next(true);
  }

  defaultFullWidthLayout(): boolean {
    if (this.login.user == null) {
      // Home content page may be full width
      return handleFullWidthLayout(Configuration.homePage);
    }
    return false;
  }

  updateTitleFrom(): UpdateTitleFrom {
    return 'menu';
  }

}
