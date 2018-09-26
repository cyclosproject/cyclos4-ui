import { Component, ChangeDetectionStrategy, Input, OnInit, Optional } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NotificationType } from 'app/shared/notification-type';

/**
 * Shows a notification message. May be in a popup or directly
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'notification',
  templateUrl: 'notification.component.html',
  styleUrls: ['notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {

  @Input() type: NotificationType = 'info';
  @Input() message: string;
  @Input() allowClose = true;

  alertType: string;
  icon: string;

  constructor(@Optional() public modalRef: BsModalRef) {
  }

  ngOnInit() {
    if (this.modalRef == null) {
      this.allowClose = false;
    }
    switch (this.type) {
      case 'info':
        this.alertType = 'success';
        break;
      case 'warning':
        this.alertType = 'warning';
        break;
      default:
        this.alertType = 'danger';
        break;
    }
    // The material icon ligatures matches the notification types we use
    this.icon = this.type;
  }

}
