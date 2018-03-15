import { Component, OnInit, Input, ChangeDetectionStrategy, Optional } from '@angular/core';
import { Notification } from 'app/shared/notification';
import { NotificationType } from 'app/shared/notification-type';
import { MatDialogRef } from '@angular/material';
import { Messages } from 'app/messages/messages';

/**
 * Component used to show a notification
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'notification',
  templateUrl: 'notification.component.html',
  styleUrls: ['notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {
  constructor(
    public messages: Messages,
    @Optional()
    public dialogRef: MatDialogRef<NotificationComponent>
  ) { }

  public containerClass: string;
  public iconColor: string;

  @Input()
  public notification: Notification;

  @Input()
  public allowClose = true;

  ngOnInit() {
    if (this.dialogRef == null) {
      // Don't allow closing if there' no dialog!
      this.allowClose = false;
    }
    this.containerClass = 'notification';
    this.iconColor = '';
    if (this.notification != null) {
      const type = this.notification.type;
      this.containerClass += ' notification--' + type;
      this.iconColor = type === NotificationType.ERROR
        ? 'warn' : type === NotificationType.INFO
          ? 'primary' : 'accent';
    }
  }

  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
