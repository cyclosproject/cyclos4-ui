import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { LayoutService } from 'app/core/layout.service';
import { NotificationType } from 'app/shared/notification-type';
import { Enter, Escape, ShortcutService } from 'app/core/shortcut.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Shows a notification message. May be in a popup or directly
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'notification',
  templateUrl: 'notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent implements OnInit, OnDestroy {

  @Input() type: NotificationType = 'info';
  @Input() message: string;
  @Input() allowClose = true;

  alertType: string;
  icon: SvgIcon;
  private shortcutSub: Subscription;

  constructor(
    @Optional() public modalRef: BsModalRef,
    public layout: LayoutService,
    private shortcut: ShortcutService) {
  }

  ngOnInit() {
    if (this.modalRef == null) {
      this.allowClose = false;
    }
    switch (this.type) {
      case 'info':
        this.alertType = 'success';
        this.icon = SvgIcon.InfoCircle;
        break;
      case 'warning':
        this.alertType = 'warning';
        this.icon = SvgIcon.ExclamationCircle;
        break;
      default:
        this.alertType = 'danger';
        this.icon = SvgIcon.ExclamationTriangle;
        break;
    }
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
