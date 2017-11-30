import { OnInit, OnDestroy, Injector, ChangeDetectorRef } from '@angular/core';
import { GeneralMessages } from 'app/messages/general-messages';
import { LayoutService } from 'app/core/layout.service';
import { FormatService } from 'app/core/format.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { ObservableMedia } from '@angular/flex-layout';
import { Subscription } from 'rxjs/Subscription';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
export abstract class BaseComponent implements OnInit, OnDestroy {
  generalMessages: GeneralMessages;
  layout: LayoutService;
  format: FormatService;
  errorHandler: ErrorHandlerService;
  login: LoginService;
  notification: NotificationService;
  router: Router;
  route: ActivatedRoute;

  protected changeDetector: ChangeDetectorRef;
  protected media: ObservableMedia;

  protected subscriptions: Subscription[] = [];

  constructor(injector: Injector) {
    this.generalMessages = injector.get(GeneralMessages);
    this.layout = injector.get(LayoutService);
    this.format = injector.get(FormatService);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.login = injector.get(LoginService);
    this.notification = injector.get(NotificationService);
    this.layout = injector.get(LayoutService);
    this.router = injector.get(Router);
    this.route = injector.get(ActivatedRoute);

    this.changeDetector = injector.get(ChangeDetectorRef);
    this.media = injector.get(ObservableMedia);
  }

  ngOnInit() {
    this.subscriptions.push(this.media.subscribe(() => {
      this.onDisplayChange();
    }));
    this.subscriptions.push(this.login.subscribeForAuth(() => {
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
