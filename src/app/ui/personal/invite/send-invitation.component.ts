import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataForSendInvitation, SendInvitation } from 'app/api/models';
import { InviteService } from 'app/api/services/invite.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Send an invitation e-mail to external users
 */
@Component({
  selector: 'send-invitation',
  templateUrl: 'send-invitation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendInvitationComponent
  extends BasePageComponent<DataForSendInvitation>
  implements OnInit {

  form: FormGroup;

  constructor(
    injector: Injector,
    private inviteService: InviteService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.inviteService.getDataForInvite().subscribe(data => this.data = data));
  }

  onDataInitialized(data: DataForSendInvitation) {
    this.form = new FormGroup({
      toEmails: this.formBuilder.control([]),
      assignBroker: this.formBuilder.control(false)
    });
    this.form.patchValue(data.send);
  }

  send() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const send = this.form.value as SendInvitation;
    this.addSub(this.inviteService.sendInvitation({ body: send }).subscribe(() => {
      if (send.toEmails?.length === 1) {
        this.notification.snackBar(this.i18n.invite.sentSingle);
      } else {
        this.notification.snackBar(this.i18n.invite.sentMultiple);
      }
      this.form.patchValue(this.data.send);
    }));
  }

  resolveMenu() {
    return Menu.INVITE;
  }
}
