import { Component, Input, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CustomFieldValue } from 'app/api/models';
import { FormatFieldValueComponent } from './format-field-value.component';

/**
 * Component used to display a custom field value as a `<label-value>`
 */
@Component({
  selector: 'custom-field-value',
  templateUrl: 'custom-field-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomFieldValueComponent {

  @Input() fieldValue: CustomFieldValue;
  @Input() labelWidth: string;

  @ViewChild('formatFieldValue') formatFieldValue: FormatFieldValueComponent;

}
