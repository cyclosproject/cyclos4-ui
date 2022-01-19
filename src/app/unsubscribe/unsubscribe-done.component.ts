import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { EmailUnsubscribeKind } from 'app/api/models';
import { DataForEmailUnsubscribe } from 'app/api/models/data-for-email-unsubscribe';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { UnsubscribeState } from 'app/unsubscribe/unsubscribe-state';

/**
 * Display the message after being unsubscribed
 */
@Component({
  selector: 'unsubscribe-done',
  templateUrl: 'unsubscribe-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsubscribeDoneComponent implements OnInit {

  data: DataForEmailUnsubscribe;
  message: string;

  constructor(
    @Inject(I18nInjectionToken) public i18n: I18n,
    public state: UnsubscribeState,
  ) {
  }

  ngOnInit() {
    this.data = this.state.data;
    switch (this.data.kind) {
      case EmailUnsubscribeKind.NOTIFICATION:
        this.message = this.i18n.unsubscribe.doneNotification(this.data.email);
        break;
      case EmailUnsubscribeKind.MESSAGE:
        this.message = this.i18n.unsubscribe.doneMessage(this.data.email);
        break;
      case EmailUnsubscribeKind.MAILING:
        this.message = this.i18n.unsubscribe.doneMailing(this.data.email);
        break;
    }
  }
}
