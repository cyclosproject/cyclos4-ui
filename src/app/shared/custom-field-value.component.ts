import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CustomFieldValue, CustomField, CustomFieldTypeEnum, CustomFieldPossibleValue } from 'app/api/models';
import { GeneralMessages } from 'app/messages/general-messages';

/** Types whose values are passed directly as attribute to the <label-value> tag */
const DIRECT_TYPES = [
  CustomFieldTypeEnum.STRING, CustomFieldTypeEnum.TEXT, CustomFieldTypeEnum.RICH_TEXT,
  CustomFieldTypeEnum.DYNAMIC_SELECTION, CustomFieldTypeEnum.BOOLEAN, CustomFieldTypeEnum.LINKED_ENTITY];

/**
 * Component used to display a custom field value
 */
@Component({
  selector: 'custom-field-value',
  templateUrl: 'custom-field-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomFieldValueComponent implements OnInit {
  constructor(private generalMessages: GeneralMessages) { }

  @Input() fieldValue: CustomFieldValue;
  @Input() labelWidth: string;

  field: CustomField;
  type: CustomFieldTypeEnum;
  value: any;

  get hasValue(): boolean {
    return this.value != null && (this.value.length === undefined || this.value.length > 0);
  }

  get directValue(): boolean {
    return DIRECT_TYPES.includes(this.type);
  }

  get valueType(): string {
    return this.type === CustomFieldTypeEnum.RICH_TEXT
      ? 'html' : this.type === CustomFieldTypeEnum.TEXT
        ? 'break' : 'plain';
  }

  ngOnInit() {
    this.field = this.fieldValue.field;
    this.type = this.field.type;
    switch (this.type) {
      case CustomFieldTypeEnum.BOOLEAN:
        if (this.fieldValue.booleanValue != null) {
          this.value = this.fieldValue.booleanValue
            ? this.generalMessages.yes()
            : this.generalMessages.no();
        }
        break;
      case CustomFieldTypeEnum.DATE:
        this.value = this.fieldValue.dateValue;
        break;
      case CustomFieldTypeEnum.DECIMAL:
        this.value = this.fieldValue.decimalValue;
        break;
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        const dyn = this.fieldValue.dynamicValue;
        this.value = dyn.label || dyn.value;
        break;
      case CustomFieldTypeEnum.FILE:
        this.value = this.fieldValue.fileValues;
        break;
      case CustomFieldTypeEnum.IMAGE:
        this.value = this.fieldValue.imageValues;
        break;
      case CustomFieldTypeEnum.INTEGER:
        this.value = this.fieldValue.integerValue;
        break;
      case CustomFieldTypeEnum.LINKED_ENTITY:
        const entity = (this.fieldValue.linkedEntityValue || {});
        this.value = entity.name || entity.id;
        break;
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        this.value = this.fieldValue.enumeratedValues;
        // Sort the values
        this.value.sort((pv1: CustomFieldPossibleValue, pv2: CustomFieldPossibleValue) => {
          if (pv1.category == null && pv2.category != null) {
            return -1;
          } else if (pv2.category == null && pv1.category != null) {
            return 1;
          } else {
            return pv1.value === pv2.value ? 0 : pv1.value < pv2.value ? -1 : 1;
          }
        });
        break;
      case CustomFieldTypeEnum.RICH_TEXT:
        this.value = this.fieldValue.stringValue;
        if (this.value != null && this.value.length > 0) {
          // For HTML, add a div in the end that prevents floats from passing
          // through the parent div's height
          this.value += '<div style="clear: both"></div>';
        }
        break;
      default:
        this.value = this.fieldValue.stringValue;
        break;
    }
  }
}
