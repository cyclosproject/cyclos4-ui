import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GeneralMessages } from 'app/messages/general-messages';
import { Notification } from 'app/shared/notification';

/**
 * Component shown when the URL is not a recognized component
 */
@Component({
  selector: 'not-found',
  templateUrl: 'not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent implements OnInit {

  public notification: Notification;

  constructor(
    public generalMessages: GeneralMessages
  ) {
    this.notification = Notification.error(this.generalMessages.errorNotFound());
  }

  ngOnInit() { }
}
