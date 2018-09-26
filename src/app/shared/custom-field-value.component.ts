import { Component, Input, ChangeDetectionStrategy, ViewChild, HostBinding } from '@angular/core';
import { CustomFieldValue } from 'app/api/models';
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

}
