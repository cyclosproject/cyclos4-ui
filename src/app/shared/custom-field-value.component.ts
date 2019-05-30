import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { CustomField, CustomFieldTypeEnum, CustomFieldValue } from 'app/api/models';
import { LayoutService } from 'app/shared/layout.service';
import { FormatFieldValueComponent } from './format-field-value.component';

/**
 * Component used to display a custom field value as a `<label-value>`
 */
@Component({
  selector: 'custom-field-value',
  templateUrl: 'custom-field-value.component.html',
  styleUrls: ['custom-field-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomFieldValueComponent {

  @Input() fieldValue: CustomFieldValue;

  @ViewChild('formatFieldValue') formatFieldValue: FormatFieldValueComponent;

  constructor(public layout: LayoutService) {
  }

  get field(): CustomField {
    return this.fieldValue ? this.fieldValue.field : null;
  }

  labelOnTop(ltsm: boolean): boolean {
    if (!ltsm) {
      return false;
    }
    const field = this.field;
    const type = field ? field.type : null;
    return [CustomFieldTypeEnum.RICH_TEXT, CustomFieldTypeEnum.TEXT].includes(type);
  }

}
