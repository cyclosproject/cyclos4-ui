import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { NotificationType } from 'app/shared/notification-type';
import { Enter, Escape, ShortcutService } from 'app/shared/shortcut.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

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
export class NotificationComponent implements OnInit, OnDestroy {

  @Input() type: NotificationType = 'info';
  @Input() message: string;
  @Input() allowClose = true;

  alertType: string;
  icon: string;
  private shortcutSub: Subscription;

  constructor(
    @Optional() public modalRef: BsModalRef,
    private shortcut: ShortcutService) {
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
    if (this.allowClose) {
      this.shortcutSub = this.shortcut.subscribe([Enter, Escape], () => this.modalRef.hide());
    }
  }

  ngOnDestroy() {
    if (this.shortcutSub) {
      this.shortcutSub.unsubscribe();
    }
  }

}
