import { Injector, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MapsService } from 'app/core/maps.service';
import { MenuService } from 'app/core/menu.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { ApiHelper } from 'app/shared/api-helper';
import { LayoutService } from 'app/shared/layout.service';
import { Observable, Subscription } from 'rxjs';
import { BreadcrumbService } from '../core/breadcrumb.service';
import { StateManager } from '../core/state-manager';
import { Messages } from 'app/messages/messages';

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
export abstract class BaseComponent implements OnInit, OnDestroy {
  // Export ApiHelper to templates
  ApiHelper = ApiHelper;

  messages: Messages;
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
  requesting$: Observable<boolean>;

  private operationalSubs: Subscription[] = [];
  private lifecycleSubs: Subscription[] = [];

  constructor(injector: Injector) {
    this.messages = injector.get(Messages);
    this.dataForUiHolder = injector.get(DataForUiHolder);
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
    this.requesting$ = injector.get(NextRequestState).requesting$;
  }

  protected addSub(sub: Subscription, lifeCycle = false) {
    if (lifeCycle) {
      this.lifecycleSubs.push(sub);
    } else {
      this.operationalSubs.push(sub);
    }
  }

  ngOnInit() {
    // Just have the ngOnInit declared, as we might need it later
  }

  ngOnDestroy(): void {
    this.unsubscribe(true);
    this.unsubscribe(false);
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
