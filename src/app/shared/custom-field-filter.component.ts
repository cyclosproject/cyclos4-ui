import { ChangeDetectionStrategy, Component, Host, Input, Optional, SkipSelf, ViewChild, Injector } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from '@angular/forms';
import { CustomFieldDetailed, CustomFieldTypeEnum, LinkedEntityTypeEnum } from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { FieldOption } from 'app/shared/field-option';
import { truthyAttr } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';

const INPUT = [
  CustomFieldTypeEnum.STRING, CustomFieldTypeEnum.TEXT,
  CustomFieldTypeEnum.RICH_TEXT, CustomFieldTypeEnum.URL];
const ENUMERATED = [CustomFieldTypeEnum.SINGLE_SELECTION, CustomFieldTypeEnum.MULTI_SELECTION];

/**
 * Component which uses a custom field as a search filter
 */
@Component({
  selector: 'custom-field-filter',
  templateUrl: 'custom-field-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CustomFieldFilterComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: CustomFieldFilterComponent, multi: true }
  ]
})
export class CustomFieldFilterComponent extends BaseFormFieldComponent<string> implements Validator {
  private _field: CustomFieldDetailed;
  @Input() get field(): CustomFieldDetailed {
    return this._field;
  }
  set field(field: CustomFieldDetailed) {
    this._field = field;
    if (field) {
      this.type = this.field.type;
      this.linkedEntityType = this.field.linkedEntityType;
      this.fieldOptions = this.fieldHelper.fieldOptions(field);

      // Set the BaseFormField inputs
      this._id = field.internalName;
      this.name = field.internalName;
      if (!this.hideLabel) {
        this.label = field.name;
      }
      this.fieldSize = field.size;
    }
  }
  @Input() focused: boolean | string;

  type: CustomFieldTypeEnum;
  linkedEntityType: LinkedEntityTypeEnum;
  fieldOptions: FieldOption[];

  @ViewChild('inputField', { static: false }) inputField: InputFieldComponent;
  @ViewChild('multiSelectionField', { static: false }) multiSelectionField: MultiSelectionFieldComponent;
  @ViewChild('singleSelectionField', { static: false }) singleSelectionField: SingleSelectionFieldComponent;
  @ViewChild('userField', { static: false }) userField: UserFieldComponent;

  _hideLabel: boolean | string = false;
  @Input() get hideLabel(): boolean | string {
    return this._hideLabel;
  }
  set hideLabel(hideLabel: boolean | string) {
    this._hideLabel = truthyAttr(hideLabel);
    if (this._hideLabel) {
      this.label = null;
    }
  }

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private fieldHelper: FieldHelperService
  ) {
    super(injector, controlContainer);
  }

  preprocessValue(value: any): string {
    if (value == null) {
      return '';
    }
    if (this.type === CustomFieldTypeEnum.DYNAMIC_SELECTION && typeof value === 'string') {
      // The dynamic can have a separator between value and text. Keep only the value
      return value.split(ApiHelper.VALUE_SEPARATOR)[0];
    }
    return value;
  }

  get input(): boolean {
    return INPUT.includes(this.type)
      || (this.type === CustomFieldTypeEnum.DYNAMIC_SELECTION && !this.field.hasValuesList)
      || (this.type === CustomFieldTypeEnum.LINKED_ENTITY && !this.user);
  }

  get enumerated(): boolean {
    return ENUMERATED.includes(this.type);
  }

  get user(): boolean {
    return this.type === CustomFieldTypeEnum.LINKED_ENTITY && this.linkedEntityType === LinkedEntityTypeEnum.USER;
  }

  get hasValuesList(): boolean {
    // Don't handle enumerated as with values list because they are already rendered correctly, and have categories
    return this.field.hasValuesList && !this.enumerated;
  }

  // Validator methods
  validate() {
    // TODO validate dates (no support for dates yet)
    return null;
  }

  protected getFocusableControl() {
    return [
      this.inputField,
      this.multiSelectionField,
      this.singleSelectionField,
      this.userField
    ].find(c => c != null);
  }

  protected getDisabledValue(): string {
    // It is not practical to disable a search field. Still...
    return this.value;
  }

}
