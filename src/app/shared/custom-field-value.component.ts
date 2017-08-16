import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CustomFieldValue, CustomField, CustomFieldTypeEnum } from "app/api/models";
import { GeneralMessages } from "app/messages/general-messages";

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

  @Input()
  public fieldValue: CustomFieldValue;
  
  public field: CustomField;
  public type: CustomFieldTypeEnum;
  public value: any;
  public hasValue: boolean;

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
        this.value = this.fieldValue.dynamicValue;
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
        this.value = this.fieldValue.linkedEntityValue;
        break;
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        this.value = this.fieldValue.enumeratedValues;
        break;
      case CustomFieldTypeEnum.RICH_TEXT:
        this.value = this.fieldValue.stringValue;
        if (this.value != null && this.value.length > 0) {
          // For HTML, add a div in the end that prevents floats from passing
          // through the parent div's height
          this.value += "<div style='clear:both'></div>";
        }
        break;
      default:
        this.value = this.fieldValue.stringValue;
        break;
    }
    this.hasValue = this.value != null && this.value.length !== 0;
  }
}