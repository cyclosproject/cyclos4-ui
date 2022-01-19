import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Group, MessageCategory, MessageDataForReply, MessageDataForSend, MessageDestinationEnum, RoleEnum, User } from 'app/api/models';
import { MessagesService } from 'app/api/services/messages.service';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { MessageHelperService } from 'app/ui/core/message-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';
import { Observable } from 'rxjs';

/**
 * Create or reply a message
 */
@Component({
  selector: 'edit-message',
  templateUrl: 'edit-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMessageComponent
  extends BasePageComponent<MessageDataForSend | MessageDataForReply>
  implements OnInit {

  MessageDestinationEnum = MessageDestinationEnum;
  RoleEnum = RoleEnum;

  reply: string;
  to: string;
  form: FormGroup;


  constructor(
    injector: Injector,
    private messagesService: MessagesService,
    public messageHelper: MessageHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.reply = this.route.snapshot.params.id;
    this.to = this.route.snapshot.queryParams.to;

    const request: Observable<MessageDataForSend | MessageDataForReply> =
      this.reply ? this.messagesService.getMessageDataForReply({ id: this.reply }) :
        this.messagesService.getMessageDataForSend({ user: this.to });
    this.addSub(request
      .subscribe(data =>
        this.data = data));
  }

  onDataInitialized(data: MessageDataForSend | MessageDataForReply) {

    const replyData = (data as MessageDataForReply) || {};
    const sendData = (data as MessageDataForSend) || {};
    let repliedBody = null;

    if (!empty(replyData.repliedMessage?.body)) {
      const prefix = this.i18n.message.replyBody({
        date: this.format.formatAsDateTime(replyData.repliedMessage.date),
        user: replyData.repliedMessage.from.display
      });
      repliedBody =
        '<br><br><br>' + prefix
        + '</p><div style="border-left:1px solid silver;margin-left: 5px;padding-left:5px;">'
        + replyData.repliedMessage.body + '</div>';
    }

    const destinations = sendData.destinations || [];

    this.form = this.formBuilder.group({
      destination: destinations.length === 1 ? destinations[0] : null,
      toUsers: sendData.toUser ? [sendData.toUser.id] : null,
      toGroups: null,
      category: null,
      subject: replyData.reply?.subject,
      body: repliedBody
    });
  }

  /**
   * Sends the message
   */
  send() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    if (!empty(this.reply)) {
      const reply = cloneDeep(this.data as MessageDataForReply).reply;
      reply.subject = this.form.controls.subject.value;
      reply.body = this.form.controls.body.value;
      this.addSub(this.messagesService.replyMessage({
        id: this.reply, body: reply
      }).subscribe(id => {
        this.notification.snackBar(this.i18n.message.messageSent);
        this.router.navigate(['/users', 'messages', 'view', id], { replaceUrl: true });
      }));
    } else {
      this.addSub(this.messagesService.sendMessage({
        body:
          this.form.value
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.message.messageSent);
        history.back();
      }));
    }
  }

  resolveTitle(): string {
    return this.reply ? this.i18n.message.title.reply :
      this.i18n.message.title.newMessage;
  }

  resolveMobileTitle(): string {
    return this.reply ? this.i18n.message.mobileTitle.reply :
      this.i18n.message.mobileTitle.newMessage;
  }

  get toUser(): User {
    return (this.data as MessageDataForSend).toUser;
  }

  get destinations(): MessageDestinationEnum[] {
    return (this.data as MessageDataForSend).destinations || [];
  }

  get maxRecipients(): number {
    return (this.data as MessageDataForSend).maxRecipients;
  }

  get groups(): Group[] {
    return (this.data as MessageDataForSend).groups || [];
  }

  get categories(): MessageCategory[] {
    return (this.data as MessageDataForSend).categories || [];
  }

  resolveMenu() {
    return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR ?
      Menu.SYSTEM_MESSAGES : Menu.MESSAGES;
  }

}
