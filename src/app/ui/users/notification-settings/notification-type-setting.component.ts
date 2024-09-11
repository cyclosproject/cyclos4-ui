import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationTypeEnum, NotificationTypeMediums } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';

/**
 * A component which allows to edit a notification setting.
 * Either with three buttons control or single/multi selection plus two buttons control.
 */
@Component({
  selector: 'notification-type-setting',
  templateUrl: 'notification-type-setting.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationTypeSettingComponent extends BaseComponent implements OnInit {
  @Input() label: string;
  @Input() setting: NotificationTypeMediums;
  @Input() options: FieldOption[];
  @Input() form: FormGroup;
  @Input() multiSelectionControl: FormControl;
  @Input() disabled: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    if (this.adminType && this.multiSelectionControl) {
      // Update internal control when selection is checked
      this.addSub(
        this.multiSelectionControl.valueChanges.subscribe(values => {
          this.form.controls.internal.setValue(values.length > 0);
        })
      );
    }
  }

  get adminType() {
    switch (this.setting.type) {
      case NotificationTypeEnum.AD_PENDING_BY_ADMIN_AUTHORIZATION:
      case NotificationTypeEnum.APPLICATION_ERROR:
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_EXPIRED:
      case NotificationTypeEnum.EXTERNAL_USER_PAYMENT_PERFORMED_FAILED:
      case NotificationTypeEnum.GENERATED_VOUCHERS_ABOUT_TO_EXPIRE:
      case NotificationTypeEnum.GENERATED_VOUCHERS_EXPIRED:
      case NotificationTypeEnum.NETWORK_CREATED:
      case NotificationTypeEnum.PAYMENT_AWAITING_ADMIN_AUTHORIZATION:
      case NotificationTypeEnum.PAYMENT_PERFORMED:
      case NotificationTypeEnum.SYSTEM_ALERT:
      case NotificationTypeEnum.USER_ALERT:
      case NotificationTypeEnum.USER_IMPORT:
      case NotificationTypeEnum.USER_REGISTRATION:
      case NotificationTypeEnum.VOUCHER_BUYING_ABOUT_TO_EXPIRE:
        return true;
    }
    return false;
  }

  get buttonCount(): number {
    let count = 0;
    if (!this.adminType) {
      count++;
    }
    if (this.setting.email != null) {
      count++;
    }
    if (this.setting.sms != null) {
      count++;
    }
    if (this.setting.app != null) {
      count++;
    }
    return count;
  }
}
