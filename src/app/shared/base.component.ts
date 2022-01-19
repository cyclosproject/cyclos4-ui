import { Directive, Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LayoutService } from 'app/core/layout.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { Observable } from 'rxjs';
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

  dataForFrontendHolder: DataForFrontendHolder;
  errorHandler: ErrorHandlerService;
  notification: NotificationService;
  layout: LayoutService;
  stateManager: StateManager;
  router: Router;
  route: ActivatedRoute;
  formBuilder: FormBuilder;
  requesting$: Observable<boolean>;

  constructor(injector: Injector) {
    super(injector);
    this.dataForFrontendHolder = injector.get(DataForFrontendHolder);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.notification = injector.get(NotificationService);
    this.layout = injector.get(LayoutService);
    this.stateManager = injector.get(StateManager);
    this.formBuilder = new FormBuilder();
    this.requesting$ = injector.get(NextRequestState).requesting$;
    try {
      this.router = injector.get(Router);
      this.route = injector.get(ActivatedRoute);
    } catch (e) {
      // Some other apps, such as unsubscribe, don't include the router module
    }
  }

}
