import { OnInit, OnDestroy, Injector, ChangeDetectorRef } from '@angular/core';
import { Messages } from 'app/messages/messages';
import { LayoutService } from 'app/core/layout.service';
import { FormatService } from 'app/core/format.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { StateManager } from '../core/state-manager';
import { BreadcrumbService } from '../core/breadcrumb.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
export abstract class BaseComponent implements OnInit, OnDestroy {
  dataForUiHolder: DataForUiHolder;
  messages: Messages;
  layout: LayoutService;
  format: FormatService;
  errorHandler: ErrorHandlerService;
  login: LoginService;
  notification: NotificationService;
  stateManager: StateManager;
  breadcrumb: BreadcrumbService;
  router: Router;
  route: ActivatedRoute;

  protected media: ObservableMedia;
  public media$: Observable<MediaChange>;
  protected changeDetector: ChangeDetectorRef;

  protected subscriptions: Subscription[] = [];

  constructor(injector: Injector) {
    this.dataForUiHolder = injector.get(DataForUiHolder);
    this.messages = injector.get(Messages);
    this.layout = injector.get(LayoutService);
    this.format = injector.get(FormatService);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.login = injector.get(LoginService);
    this.notification = injector.get(NotificationService);
    this.stateManager = injector.get(StateManager);
    this.layout = injector.get(LayoutService);
    this.breadcrumb = injector.get(BreadcrumbService);
    this.router = injector.get(Router);
    this.route = injector.get(ActivatedRoute);

    this.changeDetector = injector.get(ChangeDetectorRef);
    this.media = injector.get(ObservableMedia);
    this.media$ = this.media.asObservable();
  }

  ngOnInit() {
    this.subscriptions.push(this.media.subscribe(() => {
      this.onDisplayChange();
    }));
    this.subscriptions.push(this.dataForUiHolder.subscribe(() => {
      this.onDisplayChange();
    }));
    this.subscriptions.push(this.layout.subscribeForPageLoaded(() => {
      this.onDisplayChange();
    }));
    this.subscriptions.push(this.route.data.subscribe(data => {
      if (data.menu && this.layout.menu.value !== data.menu) {
        this.layout.menu.next(data.menu);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.length = 0;
  }

  focusDelayed(control: any) {
    if (control.focus) {
      setTimeout(() => control.focus(), 100);
    }
  }

  /**
   * Invoked whenever the current media breakpoints change,
   * or when the user logs in/out
   */
  protected onDisplayChange() {
    this.detectChanges();
  }

  /**
   * Marks the change detector to check for changes
   */
  protected detectChanges(): void {
    this.changeDetector.markForCheck();
  }
}
