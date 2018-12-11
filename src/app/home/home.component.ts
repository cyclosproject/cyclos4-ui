import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ContentPage } from 'app/content/content-page';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { BasePageComponent } from 'app/shared/base-page.component';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export const GUTTER = 20;

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
  resolver: DashboardItemConfig[] | DashboardResolver;

  constructor(private injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.login.user == null) {
      // For guests, just fetch the content
      this.homePage = environment.homePage;
      this.ready$.next(true);
    } else {
      // For logged users, resolve the dashboard items
      this.resolver = environment.dashboardResolver as any;
      let configs: DashboardItemConfig[] | Observable<DashboardItemConfig[]>;
      if (this.resolver instanceof Array) {
        configs = this.resolver;
      } else {
        configs = this.resolver.resolveItems(this.injector);
      }
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
    this.configs$.next(configs);
    this.leftConfigs$.next(configs.filter(c => c.column === 'left'));
    this.rightConfigs$.next(configs.filter(c => c.column === 'right'));
    this.fullConfigs$.next(configs.filter(c => c.column == null || c.column === 'full'));
    this.ready$.next(true);
  }

  defaultFullWidthLayout(): boolean {
    if (this.login.user == null) {
      // Home content page may be full width
      return environment.homePage.layout === 'full';
    }
    return false;
  }
}
