import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, AbstractControl } from '@angular/forms';
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
export class NotificationTypeSettingComponent extends BaseComponent implements OnInit {

  @Input() label: string;
  @Input() setting: NotificationKindMediums;
  @Input() options: FieldOption[];
  @Input() form: FormGroup;
  @Input() multiSelectionControl: FormControl;

  internalControl: AbstractControl;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.internalControl = this.form.controls.internal;
    if (this.adminType && this.multiSelectionControl) {
      // Update internal control when selection is checked
      this.addSub(this.multiSelectionControl.valueChanges.subscribe(values => {
        this.form.controls.internal.setValue(values.length > 0);
      }));
    }
  }

  get adminType() {
    return this.setting.kind.startsWith('admin');
  }

}
