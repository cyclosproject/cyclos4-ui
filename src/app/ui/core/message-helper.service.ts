import { Inject, Injectable } from '@angular/core';
import { MessageDestinationEnum, MessagesStatus, RoleEnum } from 'app/api/models';
import { MessagesService } from 'app/api/services/messages.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Helper service for messaging functions
 */
@Injectable({
  providedIn: 'root'
})
export class MessageHelperService {
  messageStatus$ = new BehaviorSubject<MessagesStatus>(null);

  constructor(
    @Inject(I18nInjectionToken) private i18n: I18n,
    nextRequestState: NextRequestState,
    messagesService: MessagesService,
    pushNotifications: PushNotificationsService,
    protected dataForFrontendHolder: DataForFrontendHolder
  ) {
    // Subscribe for user changes: update the message status
    dataForFrontendHolder.subscribe(dataForFrontend => {
      const dataForUi = (dataForFrontend || {}).dataForUi;
      const auth = (dataForUi || {}).auth || {};
      const isAdmin = auth?.role === RoleEnum.ADMINISTRATOR;
      const messagesPermissions = (auth.permissions || {}).messages || {};
      if (auth.user && (isAdmin ? messagesPermissions.system?.view : messagesPermissions.my.view)) {
        nextRequestState.ignoreNextError = true;
        messagesService
          .messagesStatus()
          .pipe(first())
          .subscribe(status => {
            this.messageStatus$.next(status);
          });
        this.messageStatus$.next(null);
      } else {
        this.messageStatus$.next(null);
      }
    });

    // Subscribe for message pushes
    pushNotifications.newMessages$.subscribe(event => {
      this.messageStatus$.next(event);
    });
  }

  resolveLabel(): string {
    return this.isSystemMessages() ? this.i18n.menu.marketplaceSystemMessages : this.i18n.menu.personalMessages;
  }

  protected isSystemMessages() {
    const auth = this.dataForFrontendHolder.dataForUi.auth || {};
    const role = auth == null ? null : auth.role;
    const isAdmin = role === RoleEnum.ADMINISTRATOR;
    return isAdmin;
  }

  resolveMenu() {
    return this.isSystemMessages() ? Menu.SYSTEM_MESSAGES : Menu.MESSAGES;
  }

  /**
   * Resolves the label for the given destination enum value
   */
  resolveDestination(destination: MessageDestinationEnum): string {
    switch (destination) {
      case MessageDestinationEnum.BROKERED:
        return this.i18n.message.messageDestination.brokered;
      case MessageDestinationEnum.GROUP:
        return this.i18n.message.messageDestination.group;
      case MessageDestinationEnum.SYSTEM:
        return this.i18n.message.messageDestination.system;
      case MessageDestinationEnum.USER:
        return this.i18n.message.messageDestination.user;
    }
  }
}
