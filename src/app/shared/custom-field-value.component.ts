import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CustomField, CustomFieldTypeEnum, CustomFieldValue } from 'app/api/models';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';
import { LayoutService } from 'app/shared/layout.service';

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

  @Input() labelPosition: FieldLabelPosition;
  @Input() fieldValue: CustomFieldValue;

  constructor(public layout: LayoutService) {
  }

  get field(): CustomField {
    return this.fieldValue ? this.fieldValue.field : null;
  }

  getLabelPosition(ltsm: boolean): FieldLabelPosition {
    if (this.labelPosition) {
      return this.labelPosition;
    }
    if (ltsm) {
      return 'auto';
    }
    const field = this.field;
    const type = field ? field.type : null;
    // Show rich text / text with label above
    return [CustomFieldTypeEnum.RICH_TEXT, CustomFieldTypeEnum.TEXT].includes(type)
      ? 'above' : 'auto';
  }

}
