import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Message, MessageDestinationEnum, MessageKind, MessageOwnerEnum, MessageView, RoleEnum } from 'app/api/models';
import { MessagesService } from 'app/api/services/messages.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Displays a sent/received message and allows to perform different
 * actions like mark as unread, reply and move to trash
 */
@Component({
  selector: 'view-message',
  templateUrl: 'view-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewMessageComponent extends BaseViewPageComponent<MessageView> implements OnInit {
  constructor(
    injector: Injector,
    private messagesService: MessagesService) {
    super(injector);
  }

  RoleEnum = RoleEnum;
  MessageKind = MessageKind;
  MessageDestinationEnum = MessageDestinationEnum;
  MessageOwnerEnum = MessageOwnerEnum;
  id: string;

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.messagesService.viewMessage({ id: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: MessageView) {

    const actions = [];
    if (data.canReply) {
      actions.push(
        new HeadingAction(SvgIcon.Pencil, this.i18n.message.actions.reply, () =>
          this.router.navigate(['/users', 'messages', 'reply', this.id])));
    }
    if (data.canMarkUnread) {
      actions.push(
        new HeadingAction(SvgIcon.EnvelopeOpen, this.i18n.message.actions.markAsUnread, () =>
          this.markAsUnread()
        ));
    }
    if (data.canMoveToTrash) {
      actions.push(
        new HeadingAction(SvgIcon.Trash, this.i18n.message.actions.moveToTrash, () =>
          this.moveToTrash()
        ));
    }
    if (data.canRemove) {
      actions.push(
        new HeadingAction(SvgIcon.Trash, this.i18n.message.actions.remove, () =>
          this.remove()
        ));
    }
    if (data.canRestore) {
      actions.push(
        new HeadingAction(SvgIcon.ArrowCounterclockwise, this.i18n.message.actions.restore, () =>
          this.restore()
        ));
    }
    this.headingActions = actions;
  }

  path(message: Message) {
    return ['/users', 'messages', 'view', message.id];
  }

  /**
   * Moves the given message to trash or removes it permanently
   */
  remove() {
    if (this.data.removedAt) {
      this.confirmation.confirm({
        message: this.i18n.general.removeItemConfirm,
        callback: () => this.addSub(this.messagesService.deleteMessage({ id: this.data.id })
          .subscribe(() => {
            this.notification.snackBar(this.i18n.message.removeDone);
            history.back();
          })),
      });
    } else {
      this.addSub(this.messagesService.moveMessagesToTrash({ ids: [this.data.id] }).subscribe(() => {
        this.notification.snackBar(this.i18n.message.moveToTrashDone);
        this.reload();
      }));
    }
  }

  private restore() {
    this.addSub(this.messagesService.restoreMessagesFromTrash({ ids: [this.data.id] }).subscribe(() => {
      this.notification.snackBar(this.i18n.message.messageRestored);
      this.reload();
    }));
  }

  private moveToTrash() {
    this.addSub(this.messagesService.moveMessagesToTrash({ ids: [this.data.id] }).subscribe(() => {
      this.notification.snackBar(this.i18n.message.moveToTrashDone);
      this.reload();
    }));
  }

  private markAsUnread() {
    this.addSub(this.messagesService.markMessagesAsUnread({ ids: [this.data.id] }).subscribe(() => {
      this.notification.snackBar(this.i18n.message.markAsUnreadDone);
      history.back();
    }));
  }

  resolveMenu() {
    return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR ?
      Menu.SYSTEM_MESSAGES : Menu.MESSAGES;
  }

  /**
   * Returns the names of the sent groups
   */
  get groups(): string[] {
    return (this.data.toGroups || []).map(g => g.name);
  }

}
