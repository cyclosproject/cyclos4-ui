import { Component, OnInit, OnDestroy, Injector, ChangeDetectorRef } from '@angular/core';
import { GeneralMessages } from "app/messages/general-messages";
import { LayoutService } from "app/core/layout.service";
import { FormatService } from "app/core/format.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { LoginService } from "app/core/login.service";
import { NotificationService } from "app/core/notification.service";
import { ObservableMedia } from "@angular/flex-layout";
import { Subscription } from "rxjs/Subscription";

/**
 * Base class to meant to be inherited by other components.
 * By contract, all subclasses that override the ngOnInit or ngOnDestroy
 * MUST call the super implementation too, or the component state
 * may become inconsistent.
 */
export abstract class BaseComponent implements OnInit, OnDestroy {
  public generalMessages: GeneralMessages;
  public layout: LayoutService;
  public format: FormatService;
  public errorHandler: ErrorHandlerService;
  public login: LoginService;
  public notification: NotificationService;
  protected changeDetector: ChangeDetectorRef;
  protected media: ObservableMedia;
  private mediaSubscription: Subscription;
  
  constructor(injector: Injector) {
    this.generalMessages = injector.get(GeneralMessages);
    this.layout = injector.get(LayoutService);
    this.format = injector.get(FormatService);
    this.errorHandler = injector.get(ErrorHandlerService);
    this.login = injector.get(LoginService);
    this.notification = injector.get(NotificationService);
    this.layout = injector.get(LayoutService);

    this.changeDetector = injector.get(ChangeDetectorRef);
    this.media = injector.get(ObservableMedia);
  }

  ngOnInit() {
    this.mediaSubscription = this.media.subscribe(() => {
      this.changeDetector.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.mediaSubscription) {
      this.mediaSubscription.unsubscribe();
    }
  }

  /**
   * Marks the change detector to check for changes
   */
  protected detectChanges(): void {
    this.changeDetector.markForCheck();
  }
}