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

  @HostBinding('class') hostClass = 'has-label-value';

  @Input() fieldValue: CustomFieldValue;
  @Input() labelWidth: string;

  @ViewChild('formatFieldValue') formatFieldValue: FormatFieldValueComponent;

}
