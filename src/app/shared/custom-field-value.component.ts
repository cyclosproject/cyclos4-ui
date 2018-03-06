import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CustomFieldValue, CustomField, CustomFieldTypeEnum, CustomFieldPossibleValue } from 'app/api/models';
import { GeneralMessages } from 'app/messages/general-messages';
import { FormatFieldValueComponent } from './format-field-value.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Component used to display a custom field value as a `<label-value>`
 */
@Component({
  selector: 'custom-field-value',
  templateUrl: 'custom-field-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomFieldValueComponent {
  constructor(private generalMessages: GeneralMessages) { }

  @Input() fieldValue: CustomFieldValue;
  @Input() labelWidth: string;

}
