import { OnInit, OnDestroy, Injector } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { StateManager } from '../core/state-manager';
import { BreadcrumbService } from '../core/breadcrumb.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { LayoutService } from 'app/shared/layout.service';
import { MenuService } from 'app/core/menu.service';
import { MapsService } from 'app/core/maps.service';
import { FormBuilder } from '@angular/forms';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
export abstract class BaseComponent implements OnInit, OnDestroy {
  // Export ApiHelper to templates
  ApiHelper = ApiHelper;

  i18n: I18n;
  dataForUiHolder: DataForUiHolder;
  format: FormatService;
  errorHandler: ErrorHandlerService;
  login: LoginService;
  notification: NotificationService;
  layout: LayoutService;
  maps: MapsService;
  menu: MenuService;
  stateManager: StateManager;
  breadcrumb: BreadcrumbService;
  router: Router;
  route: ActivatedRoute;
  formBuilder: FormBuilder;

  private operationalSubs: Subscription[] = [];
  private lifecycleSubs: Subscription[] = [];

  constructor(injector: Injector) {
    this.dataForUiHolder = injector.get(DataForUiHolder);
    this.i18n = injector.get(I18n);
    this.format = injector.get(FormatService);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.login = injector.get(LoginService);
    this.notification = injector.get(NotificationService);
    this.layout = injector.get(LayoutService);
    this.maps = injector.get(MapsService);
    this.menu = injector.get(MenuService);
    this.stateManager = injector.get(StateManager);
    this.breadcrumb = injector.get(BreadcrumbService);
    this.router = injector.get(Router);
    this.route = injector.get(ActivatedRoute);
    this.formBuilder = new FormBuilder();
  }

  protected addSub(sub: Subscription, lifeCycle = false) {
    if (lifeCycle) {
      this.lifecycleSubs.push(sub);
    } else {
      this.operationalSubs.push(sub);
    }
  }

  ngOnInit() {
    this.addSub(this.route.data.subscribe(data => {
      if (data.menu) {
        // Need to defer the next menu setting, or this will give problems with change detection
        setTimeout(() => this.menu.nextMenu(data.menu), 0);
      }
    }));
  }

  ngOnDestroy(): void {
    this.unsubscribe(true);
    this.unsubscribe(false);
  }

  focusDelayed(control: any) {
    if (control.focus) {
      setTimeout(() => control.focus(), 100);
    }
  }

  protected unsubscribe(lifeCycle = true) {
    if (lifeCycle) {
      this.lifecycleSubs.forEach(sub => sub.unsubscribe());
      this.lifecycleSubs = [];
    } else {
      this.operationalSubs.forEach(sub => sub.unsubscribe());
      this.operationalSubs = [];
    }
  }
}
