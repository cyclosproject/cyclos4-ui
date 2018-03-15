import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Messages } from 'app/messages/messages';
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
    public messages: Messages
  ) {
    this.notification = Notification.error(this.messages.errorNotFound());
  }

  ngOnInit() { }
}
