import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Message, MessageBoxEnum, MessageDataForSearch, MessageDestinationEnum, MessageKind,
  MessageQueryFilters, MessageResult, RoleEnum
} from 'app/api/models';
import { MessagesService } from 'app/api/services/messages.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { MessageHelperService } from 'app/ui/core/message-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { forkJoin, Observable } from 'rxjs';
import { first, skip } from 'rxjs/operators';


/**
 * Displays a search for received and sent messages
 */
@Component({
  selector: 'search-messages',
  templateUrl: 'search-messages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchMessagesComponent
  extends BaseSearchPageComponent<MessageDataForSearch, MessageQueryFilters, MessageResult>
  implements OnInit {

  MessageBoxEnum = MessageBoxEnum;
  RoleEnum = RoleEnum;

  constructor(
    injector: Injector,
    private messagesService: MessagesService,
    public messageHelper: MessageHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Get search data
    this.addSub(this.messagesService.getMessageDataForSearch().subscribe(data => this.data = data));

    // Send a background request indicating the last time messages were viewed
    this.addSub(this.messagesService.updateLastViewDateForMessages().pipe(first()).subscribe(() => {
      // And then immediately update the current messages status
      const status$ = this.messageHelper.messageStatus$;
      const status = { ...status$.value };
      status.lastViewDate = this.dataForFrontendHolder.now().toISOString();
      status.newMessages = 0;
      status$.next(status);
      // Whenever a new message arrives, update the list
      // Skip first subscription invocation to avoid duplicate initial search
      this.addSub(this.messageHelper.messageStatus$.pipe(skip(1)).subscribe(() => this.update()));
    }));

    const newAction = this.canSend ?
      new HeadingAction(this.SvgIcon.Envelope, this.i18n.message.actions.newMessage,
        () => this.router.navigate(['/users', 'messages', 'send']), true)
      : null;
    if (newAction) {
      this.headingActions = [newAction];
    }
    // Update the heading actions with the mark all as read if there's any unread messages
    this.addSub(this.results$.subscribe(results => {
      const messages = ((results ? results.results : null) || []);
      const unread = messages.filter(n => !n.read);
      const updateActions = () => {
        const headingActions = [];
        if (unread.length > 0) {
          headingActions.push(new HeadingAction(SvgIcon.Check2All, this.i18n.notification.actions.markAllRead, () => this.markAllRead()));
        }
        if (messages.length > 0) {
          headingActions.push(new HeadingAction(SvgIcon.Trash,
            this.form.controls.messageBox.value === MessageBoxEnum.TRASH ?
              this.i18n.notification.actions.removeAll :
              this.i18n.message.actions.moveAllToTrash, () => this.removeAll()));
        }
        if (newAction) {
          headingActions.push(newAction);
        }
        this.headingActions = headingActions;
      };
      updateActions();
      this.addSub(this.layout.breakpointChanges$.subscribe(updateActions));
    }));
  }

  rowClick(message: Message) {
    this.router.navigate(['/users', 'messages', 'view', message.id]);
  }

  get canSend(): boolean {
    const p = this.dataForFrontendHolder.auth?.permissions?.messages;
    const my = p.my || {};
    const system = p.system || {};
    return my.sendToUser ||
      my.sendToSystem ||
      my.sendToBrokered ||
      system.sendToGroups ||
      system.sendToUser;
  }

  markAllRead() {
    this.addSub(this.messagesService.markMessagesAsRead({ ids: this.ids }).subscribe(() => this.update()));
  }

  /**
   * Moves messages to trash when searching inbox or sent
   * and deletes messages when searching trash
   */
  removeAll() {
    this.confirmation.confirm({
      message: this.i18n.general.removeAllItemsConfirm,
      callback: () => {
        if (this.form.controls.messageBox.value === MessageBoxEnum.TRASH) {
          const observables: Observable<any>[] = [];
          for (const id of this.ids) {
            observables.push(this.messagesService.deleteMessage({ id }));
          }
          this.addSub(forkJoin(observables).pipe(first()).subscribe(() => this.update()));
        } else {
          this.addSub(this.messagesService.moveMessagesToTrash({ ids: this.ids }).subscribe(() => this.update()));
        }
      }
    });
  }

  get ids(): string[] {
    if (this.results && this.results.results) {
      return this.results.results.map(n => n.id);
    } else {
      return [];
    }
  }

  protected getFormControlNames(): string[] {
    return ['messageBox', 'destination', 'category', 'keywords', 'user'];
  }

  protected toSearchParams(value: any): MessageQueryFilters {
    return value;
  }

  protected doSearch(value: MessageQueryFilters): Observable<HttpResponse<MessageResult[]>> {
    return this.messagesService.searchMessages$Response(value);
  }

  get onClick() {
    return (row: Message) => this.rowClick(row);
  }

  resolveMenu() {
    return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR ? Menu.SYSTEM_MESSAGES : Menu.MESSAGES;
  }

  resolveProfileTitle(): string {
    switch (this.form.controls.messageBox.value) {
      case MessageBoxEnum.INBOX:
        return this.i18n.message.from;
      case MessageBoxEnum.SENT:
        return this.i18n.message.sentTo;
      case MessageBoxEnum.TRASH:
        return this.i18n.message.fromSentTo;
    }
  }

  resolveProfile(message: MessageResult): any {
    const result: any = {
      icon: SvgIcon.Person,
      display: null,
      image: null
    };
    const formatInbox = () => {
      if (message.fromOwner == null) {
        result.display = this.dataForFrontendHolder.dataForUi.applicationUsername;
      } else {
        result.display = message.fromOwner.display;
        result.image = message.fromOwner.image;
      }
    };
    const formatSent = () => {
      if (message.destination === MessageDestinationEnum.BROKERED) {
        result.display = this.i18n.message.sendToBrokered;
      } else if (message.destination === MessageDestinationEnum.SYSTEM) {
        result.display = this.dataForFrontendHolder.dataForUi.applicationUsername;
      } else if ((message.toUsers || []).length > 0) {
        if (message.toUsers.length > 1) {
          result.display = message.toUsers.map(u => u.display).join(', ');
          result.icon = SvgIcon.People;
        } else {
          result.display = message.toUsers[0].display;
          result.image = message.toUsers[0].image;
        }
      } else if ((message.toGroups || []).length > 0) {
        if (message.toGroups.length > 1) {
          result.display = message.toGroups.map(g => g.name).join(', ');
        } else {
          result.display = message.toGroups[0].name;
        }
        result.icon = SvgIcon.People;
      }
    };

    switch (this.form.controls.messageBox.value) {
      case MessageBoxEnum.INBOX:
        formatInbox();
        break;
      case MessageBoxEnum.SENT:
        formatSent();
        break;
      case MessageBoxEnum.TRASH:
        if (message.kind === MessageKind.INCOMING) {
          formatInbox();
        } else {
          formatSent();
        }
        break;
    }
    return result;
  }

  get destinations(): MessageDestinationEnum[] {
    let result =
      [MessageDestinationEnum.USER,
      MessageDestinationEnum.GROUP,
      MessageDestinationEnum.BROKERED,
      MessageDestinationEnum.SYSTEM];
    if (this.dataForFrontendHolder.role === RoleEnum.BROKER) {
      result = result.filter(e => e !== MessageDestinationEnum.GROUP);
      if (this.form.controls.messageBox.value === MessageBoxEnum.INBOX) {
        result = result.filter(e => e !== MessageDestinationEnum.BROKERED);
      }
    } else if (this.dataForFrontendHolder.role === RoleEnum.MEMBER) {
      result = result.filter(e => e !== MessageDestinationEnum.GROUP && e !== MessageDestinationEnum.BROKERED);
    } else {
      result = result.filter(e => e !== MessageDestinationEnum.BROKERED);
    }
    return result;
  }

  /**
   * Moves the given message to trash or removes it permanently
   * based on the given flag
   */
  remove(toTrash: boolean, message: Message) {
    if (!toTrash) {
      this.confirmation.confirm({
        message: this.i18n.general.removeItemConfirm,
        callback: () => this.addSub(this.messagesService.deleteMessage({ id: message.id })
          .subscribe(() => {
            this.notification.snackBar(this.i18n.message.removeDone);
            this.update();
          })),
      });
    } else {
      this.addSub(this.messagesService.moveMessagesToTrash({ ids: [message.id] }).subscribe(() => {
        this.notification.snackBar(this.i18n.message.moveToTrashDone);
        this.update();
      }));
    }
  }

}
