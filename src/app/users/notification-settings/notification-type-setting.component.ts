import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationKindMediums } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';

/**
 * A component which allows to edit a notification setting.
 * Either with three buttons control or single/multi selection plus two buttons control.
 */
@Component({
  selector: 'notification-type-setting',
  templateUrl: 'notification-type-setting.component.html',
  styleUrls: ['notification-type-setting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationTypeSettingComponent extends BaseComponent {

  @Input() label: string;
  @Input() setting: NotificationKindMediums;
  @Input() options: FieldOption[];
  @Input() form: FormGroup;
  @Input() multiSelectionControl: FormControl;

  constructor(injector: Injector) {
    super(injector);
  }

  get adminType() {
    return this.setting.kind.startsWith('admin');
  }

}
