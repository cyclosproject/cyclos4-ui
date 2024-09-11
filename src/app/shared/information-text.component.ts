import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Show the given information text on a tooltip or in a notification when clicked
 */
@Component({
  selector: 'information-text',
  templateUrl: 'information-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InformationTextComponent implements OnInit {
  @Input() informationText: string;

  constructor(private notification: NotificationService) {}

  ngOnInit() {}

  get icon(): SvgIcon {
    return SvgIcon.InfoCircle;
  }

  onClick() {
    this.notification.info(this.informationText);
  }
}
