import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { EmailUnsubscribeKind } from 'app/api/models';
import { DataForEmailUnsubscribe } from 'app/api/models/data-for-email-unsubscribe';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { UnsubscribeState } from 'app/unsubscribe/unsubscribe-state';

/**
 * Display the unsubscribe form
 */
@Component({
  selector: 'unsubscribe-form',
  templateUrl: 'unsubscribe-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsubscribeFormComponent implements OnInit {
  data: DataForEmailUnsubscribe;
  message: string;

  constructor(@Inject(I18nInjectionToken) public i18n: I18n, public state: UnsubscribeState) {}

  ngOnInit() {
    this.data = this.state.data;
    const params = {
      name: this.data.user?.display,
      email: this.data.email
    };
    switch (this.data.kind) {
      case EmailUnsubscribeKind.NOTIFICATION:
        this.message = this.i18n.unsubscribe.messageNotification(params);
        break;
      case EmailUnsubscribeKind.MESSAGE:
        this.message = this.i18n.unsubscribe.messageMessage(params);
        break;
      case EmailUnsubscribeKind.MAILING:
        this.message = this.i18n.unsubscribe.messageMailing(params);
        break;
    }
  }
}
