import { Injector, Directive } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { ExportHelperService } from 'app/core/export-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { LoginService } from 'app/core/login.service';
import { MapsService } from 'app/core/maps.service';
import { MenuService } from 'app/core/menu.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { LayoutService } from 'app/shared/layout.service';
import { Observable } from 'rxjs';
import { BreadcrumbService } from '../core/breadcrumb.service';
import { StateManager } from '../core/state-manager';

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
@Directive()
export abstract class BaseComponent
  extends AbstractComponent {

  dataForUiHolder: DataForUiHolder;
  errorHandler: ErrorHandlerService;
  login: LoginService;
  notification: NotificationService;
  layout: LayoutService;
  maps: MapsService;
  menu: MenuService;
  stateManager: StateManager;
  breadcrumb: BreadcrumbService;
  authHelper: AuthHelperService;
  fieldHelper: FieldHelperService;
  exportHelper: ExportHelperService;
  router: Router;
  route: ActivatedRoute;
  formBuilder: FormBuilder;
  requesting$: Observable<boolean>;

  constructor(injector: Injector) {
    super(injector);
    this.dataForUiHolder = injector.get(DataForUiHolder);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.login = injector.get(LoginService);
    this.notification = injector.get(NotificationService);
    this.layout = injector.get(LayoutService);
    this.maps = injector.get(MapsService);
    this.menu = injector.get(MenuService);
    this.stateManager = injector.get(StateManager);
    this.breadcrumb = injector.get(BreadcrumbService);
    this.authHelper = injector.get(AuthHelperService);
    this.fieldHelper = injector.get(FieldHelperService);
    this.exportHelper = injector.get(ExportHelperService);
    this.router = injector.get(Router);
    this.route = injector.get(ActivatedRoute);
    this.formBuilder = new FormBuilder();
    this.requesting$ = injector.get(NextRequestState).requesting$;
  }

}
