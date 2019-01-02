import { Injectable } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFieldDetailed, CustomFieldTypeEnum, LinkedEntityTypeEnum, CustomFieldSizeEnum } from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';

/**
 * Helper service for custom fields
 */
@Injectable({
  providedIn: 'root'
})
export class FieldHelperService {

  constructor(
    private formBuilder: FormBuilder,
    private format: FormatService) {
  }

  /**
   * Returns the actual displayed field size.
   * Some types, such as date and decimal are always shown as small, except if they have a values list.
   */
  fieldSize(field: CustomFieldDetailed): CustomFieldSizeEnum {
    if (field.hasValuesList) {
      return CustomFieldSizeEnum.FULL;
    }
    if (field.type === CustomFieldTypeEnum.DATE) {
      return CustomFieldSizeEnum.MEDIUM;
    } else if ([CustomFieldTypeEnum.INTEGER, CustomFieldTypeEnum.DECIMAL].includes(field.type)) {
      return CustomFieldSizeEnum.SMALL;
    } else {
      return field.size;
    }
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given custom fields
   * @param customFields The custom fields
   * @param options A bag of options with the following:
   *
   * - `currentValues`: If provided will contain the field values by internal name. If not, use the default value
   * - `useDefaults`: When set to false will not use the default values for fields. Defaults to true.
   * - `disabledProvider`: If provided will be called for each custom field to determine whether the field should be disabled
   * - `asyncValProvider`: If provided will be called for each custom field to provide an additional, asynchronous validation
   * @returns The FormGroup
   */
  customValuesFormGroup(customFields: CustomFieldDetailed[],
    options?: {
      currentValues?: any,
      useDefaults?: boolean,
      disabledProvider?: (CustomFieldDetailed) => boolean,
      asyncValProvider?: (CustomFieldDetailed) => AsyncValidatorFn
    }): FormGroup {
    options = options || {};
    const currentValues = options.currentValues || {};
    const useDefaults = options.useDefaults !== false;
    const disabledProvider = options.disabledProvider || (() => false);
    const asyncValProvider = options.asyncValProvider;
    const customValues = {};
    for (const cf of customFields) {
      let value: string = currentValues[cf.internalName];
      if (value == null && useDefaults) {
        value = cf.defaultValue;
      }
      customValues[cf.internalName] = [
        {
          value: value,
          disabled: disabledProvider(cf)
        },
        cf.required ? Validators.required : null,
        asyncValProvider ? asyncValProvider(cf) : null
      ];
    }
    return this.formBuilder.group(customValues);
  }

  /**
   * Returns the `FieldOption` which represent the available options of the given custom field
   * @param field The custom field
   * @param format The shared format service
   */
  fieldOptions(field: CustomFieldDetailed): FieldOption[] {
    if (!field.hasValuesList) {
      return null;
    }
    switch (field.type) {
      case CustomFieldTypeEnum.STRING:
      case CustomFieldTypeEnum.TEXT:
      case CustomFieldTypeEnum.RICH_TEXT:
      case CustomFieldTypeEnum.URL:
        return (field.stringValues || []).map(v => ({ value: v, text: v }));
      case CustomFieldTypeEnum.DATE:
        return (field.dateValues || []).map(v => ({ value: v, text: this.format.formatAsDate(v) }));
      case CustomFieldTypeEnum.DECIMAL:
        return (field.decimalValues || []).map(v => ({ value: v, text: this.format.formatAsNumber(v, field.decimalDigits) }));
      case CustomFieldTypeEnum.INTEGER:
        return (field.integerValues || []).map(v => ({ value: String(v), text: this.format.formatAsNumber(v, 0) }));
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        return (field.dynamicValues || []).map(v => ({ value: v.value, text: v.label }));
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        return (field.possibleValues || []).map(v => ({
          value: ApiHelper.internalNameOrId(v), id: v.id, internalName: v.internalName,
          text: v.value, category: v.category == null ? null : v.category.name
        }));
      case CustomFieldTypeEnum.LINKED_ENTITY:
        switch (field.linkedEntityType) {
          case LinkedEntityTypeEnum.ADVERTISEMENT:
            return (field.adValues || []).map(v => ({ value: v.id, text: v.name }));
          case LinkedEntityTypeEnum.RECORD:
            return (field.recordValues || []).map(v => ({ value: v.id, text: v.display }));
          case LinkedEntityTypeEnum.TRANSACTION:
            return (field.transactionValues || []).map(v => ({ value: v.id, internalName: v.transactionNumber, text: v.display }));
          case LinkedEntityTypeEnum.TRANSFER:
            return (field.transferValues || []).map(v => ({ value: v.id, internalName: v.transactionNumber, text: v.display }));
          case LinkedEntityTypeEnum.USER:
            return (field.userValues || []).map(v => ({ value: v.id, text: v.display }));
        }
    }
    return [];
  }

  /**
   * Returns a suitable representation for using custom field values in searches
   * @param customValues The custom values map
   */
  toCustomValuesFilter(customValues: { [key: string]: string }): string[] {
    const result: string[] = [];
    for (const key in customValues || {}) {
      if (customValues.hasOwnProperty(key)) {
        const value = customValues[key];
        if (!empty(value)) {
          result.push(key + ':' + customValues[key]);
        }
      }
    }
    return result;
  }
}
