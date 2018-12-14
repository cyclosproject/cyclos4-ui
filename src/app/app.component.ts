import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from 'app/core/banner.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { blank } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { trim } from 'lodash';
import { BehaviorSubject } from 'rxjs';

declare const setSpinnerVisible: (visible: boolean) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  constructor(
    private title: Title,
    private router: Router,
    private route: ActivatedRoute,
    private format: FormatService,
    private dataForUiHolder: DataForUiHolder,
    public login: LoginService,
    public menu: MenuService,
    public layout: LayoutService,
    private banner: BannerService,
    // PushNotificationsService is here because it is not directly used by any
    // other component / service, but handles itself the push notifications.
    // It would otherwise be removed from the built app by tree-shaking.
    private push: PushNotificationsService
  ) { }

  initialized = new BehaviorSubject(false);
  loggingOut = new BehaviorSubject(false);

  ngOnInit() {
    this.push.initialize();
    this.banner.initialize();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.title.setTitle(this.format.appTitle);
    this.dataForUiHolder.subscribe(dataForUi => {
      if (dataForUi != null) {
        this.initialized.next(true);
        this.prepareContent();
      }
    });
    if (this.dataForUiHolder.dataForUi) {
      // Already initialized?!?
      this.initialized.next(true);
      this.prepareContent();
    }
    this.login.subscribeForLoggingOut(flag => this.loggingOut.next(flag));
    this.layout.currentPage$.subscribe(() => {
      if (this.menu.lastSelectedMenu == null) {
        const data = this.route.snapshot.data || {};
        this.menu.lastSelectedMenu = data.menu;
      }
    });
    setSpinnerVisible(false);
  }

  private prepareContent() {
    const style = getComputedStyle(document.body);
    this.applyFont(style);
    this.applyThemeColor(style);
  }

  private applyFont(style: CSSStyleDeclaration) {
    const url = trim(style.getPropertyValue('--font-import-url'), '\" ');
    if (blank(url)) {
      return;
    }
    const id = 'fontStyle';
    let element: HTMLLinkElement = document.getElementById(id) as HTMLLinkElement;
    if (!element) {
      element = document.createElement('link');
      element.id = id;
      element.rel = 'stylesheet';
      document.head.appendChild(element);
      element.href = url;
    } else if (element.href !== url) {
      element.href = url;
    }
  }

  private applyThemeColor(style: CSSStyleDeclaration) {
    const primaryColor = style.getPropertyValue('--primary').trim();
    if (blank(primaryColor)) {
      return;
    }
    this.layout.primaryColor = primaryColor;
    this.layout.secondaryColor = style.getPropertyValue('--secondary').trim();
    const id = 'themeColorMeta';
    let meta: HTMLMetaElement = document.getElementById(id) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.id = id;
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = primaryColor;
  }
}
