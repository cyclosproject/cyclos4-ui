import { Inject, Injectable } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BasicProfileFieldInput, CustomField, CustomFieldBinaryValues,
  CustomFieldDetailed, CustomFieldSizeEnum, CustomFieldTypeEnum,
  CustomFieldValue, LinkedEntityTypeEnum
} from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';

/**
 * Helper service for custom fields
 */
@Injectable({
  providedIn: 'root',
})
export class FieldHelperService {

  constructor(
    private formBuilder: FormBuilder,
    private format: FormatService,
    @Inject(I18nInjectionToken) private i18n: I18n) {
  }

  /**
   * Returns the actual displayed field size.
   * Some types, such as date and decimal are always shown as small, except if they have a values list.
   */
  fieldSize(field: CustomFieldDetailed): CustomFieldSizeEnum {
    if (field.type === CustomFieldTypeEnum.DATE) {
      return CustomFieldSizeEnum.MEDIUM;
    } else if ([CustomFieldTypeEnum.INTEGER, CustomFieldTypeEnum.DECIMAL].includes(field.type)) {
      return CustomFieldSizeEnum.SMALL;
    } else {
      return field.size;
    }
  }

  hasValue(customFieldInternalName: string, valuesMap: { [key: string]: string; }): boolean {
    const value = valuesMap ? valuesMap[customFieldInternalName] : null;
    return value != null && (value.length === undefined || value.length > 0);
  }

  /**
   * Returns a formatted value for the given custom field value
   */
  getValue(fieldValue: CustomFieldValue, plainText?: boolean | string) {
    switch (fieldValue.field.type) {
      case CustomFieldTypeEnum.BOOLEAN:
        if (fieldValue.booleanValue != null) {
          return {
            value: fieldValue.booleanValue
              ? this.i18n.general.yes
              : this.i18n.general.no,
          };
        }
        break;
      case CustomFieldTypeEnum.DATE:
        return {
          value: this.format.formatAsDate(fieldValue.dateValue),
        };
      case CustomFieldTypeEnum.DECIMAL:
        return {
          value: this.format.formatAsNumber(fieldValue.decimalValue, fieldValue.field.decimalDigits),
        };
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
      case CustomFieldTypeEnum.DYNAMIC_MULTI_SELECTION:
        return {
          value: (fieldValue.dynamicValues || []).map(v => v.label || v.value).join(', ')
        };
      case CustomFieldTypeEnum.FILE:
        return {
          value: fieldValue.fileValues,
        };
      case CustomFieldTypeEnum.IMAGE:
        return {
          value: fieldValue.imageValues,
        };
      case CustomFieldTypeEnum.INTEGER:
        return {
          value: this.format.formatAsNumber(fieldValue.integerValue, 0),
        };
      case CustomFieldTypeEnum.LINKED_ENTITY:
        let entity = null;
        let path: string[] = null;

        switch (fieldValue.field.linkedEntityType) {
          case LinkedEntityTypeEnum.USER:
            entity = fieldValue.userValue;
            path = ['/users', ':id', 'profile'];
            break;
          case LinkedEntityTypeEnum.ADVERTISEMENT:
            entity = fieldValue.adValue;
            path = ['/marketplace', 'view', ':id'];
            break;
          case LinkedEntityTypeEnum.TRANSACTION:
            entity = fieldValue.transactionValue;
            path = ['/banking', 'transaction', ':id'];
            break;
          case LinkedEntityTypeEnum.TRANSFER:
            entity = fieldValue.transferValue;
            path = ['/banking', 'transfer', ':id'];
            break;
          case LinkedEntityTypeEnum.RECORD:
            entity = fieldValue.recordValue;
            path = ['/records', 'view', ':id'];
            break;
        }
        if (entity != null) {
          const link = path == null || entity.id == null ? null :
            '/' + path.map(part => part === ':id' ? entity.id : part).join('/');
          return {
            value: entity.display || entity.name || entity.transactionNumber || entity.id,
            link,
          };
        }
        break;
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        return {
          value: fieldValue.enumeratedValues || [],
        };
      case CustomFieldTypeEnum.RICH_TEXT:
        let rich = fieldValue.stringValue;
        if (rich != null && rich.length > 0) {
          if (plainText) {
            const div = document.createElement('div');
            div.innerHTML = rich;
            rich = div.textContent || div.innerText || '';
          }
        }
        return {
          value: rich,
        };
      case CustomFieldTypeEnum.URL:
        return {
          value: fieldValue.stringValue,
          link: fieldValue.stringValue,
        };
      default:
        return {
          value: fieldValue.stringValue,
        };
    }
    return null;
  }

  /**
   * Returns the display name of the given field
   * @param field The field identifier
   * @param customFields The known custom fields
   */
  fieldDisplay(field: string, customFields?: CustomField[]): string {
    switch (field) {
      case 'display':
        return this.i18n.general.user;
      case 'name':
        return this.i18n.user.name;
      case 'username':
        return this.i18n.user.username;
      case 'email':
        return this.i18n.user.email;
      case 'image':
        return this.i18n.general.image;
      case 'phone':
        return this.i18n.phone.phoneNumber;
      case 'address':
        return this.i18n.address.address;
      case 'accountNumber':
        return this.i18n.account.number;
      default:
        const customField = (customFields || []).find(cf => cf.internalName === field);
        return (customField || {}).name;
    }
  }

  /**
   * Utility to return the field name. As-is if the parameter is a string, or the internal name if a custom field
   * @param field Either the custom field or basic field name
   */
  fieldName(field: string | CustomField): string {
    if (typeof field === 'object') {
      return (field || {}).internalName;
    } else {
      return field;
    }
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given custom field used for search
   * @param customFields The custom profile fields
   * @returns The FormGroup
   */
  customFieldsForSearchFormGroup(customFields: CustomFieldDetailed[], defaultValues?: string[]): FormGroup {
    const defaultValuesMap: { [key: string]: string; } = {};
    if (defaultValues) {
      defaultValues.forEach(f => {
        const keyValue = f.split(':');
        defaultValuesMap[keyValue[0]] = keyValue[1];
      });
    }
    const customControls = this.customValuesFormControlMap(customFields, { currentValues: defaultValuesMap, useDefaults: false });
    const group = this.formBuilder.group({});
    for (const [name, control] of customControls) {
      group.addControl(name, control);
    }
    return group;
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given user profile fields
   * @param basicFields The basic profile fields
   * @param customFields The custom profile fields
   * @returns The FormGroup
   */
  profileFieldsForSearchFormGroup(basicFields: BasicProfileFieldInput[], customFields: CustomFieldDetailed[], currentValues?: string[]): FormGroup {
    const group = this.customFieldsForSearchFormGroup(customFields, currentValues);
    // Append the basic profile fields
    for (const bf of basicFields) {
      group.addControl(bf.field, this.formBuilder.control(null));
    }
    return group;
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given custom fields
   * @param customFields The custom fields
   * @param options A bag of options with the following:
   *
   * - `currentValues`: If provided will contain the field values by internal name. If not, use the default value
   * - `useDefaults`: When set to false will not use the default values for fields. Defaults to true.
   * - `requiredProvider`: If provided will be called for each custom field to determine whether the field is required.
   *                       Otherwise, the CustomFieldDetailed.required flag will be used to add the corresponding validation.
   * - `disabledProvider`: If provided will be called for each custom field to determine whether the field should be disabled
   * - `asyncValProvider`: If provided will be called for each custom field to provide an additional, asynchronous validation
   * @returns The FormGroup
   */
  customValuesFormGroup(customFields: CustomFieldDetailed[], options?: {
    currentValues?: any,
    useDefaults?: boolean,
    requiredProvider?: (field: CustomFieldDetailed) => boolean,
    disabledProvider?: (field: CustomFieldDetailed) => boolean,
    asyncValProvider?: (field: CustomFieldDetailed) => AsyncValidatorFn;
  }): FormGroup {
    const controls = this.customValuesFormControlMap(customFields, options);
    const group = this.formBuilder.group({});
    for (const [name, control] of controls) {
      group.addControl(name, control);
    }
    return group;
  }

  /**
   * Returns a Map from custom field internal name to a form control for each of the given custom fields
   * @param customFields The custom fields
   * @param options A bag of options with the following:
   *
   * - `currentValues`: If provided will contain the field values by internal name. If not, use the default value
   * - `useDefaults`: When set to false will not use the default values for fields. Defaults to true.
   * - `disabledProvider`: If provided will be called for each custom field to determine whether the field should be disabled
   * - `asyncValProvider`: If provided will be called for each custom field to provide an additional, asynchronous validation
   * @returns The Map
   */
  customValuesFormControlMap(customFields: CustomFieldDetailed[], options?: {
    currentValues?: any,
    useDefaults?: boolean,
    requiredProvider?: (field: CustomFieldDetailed) => boolean,
    disabledProvider?: (field: CustomFieldDetailed) => boolean,
    asyncValProvider?: (field: CustomFieldDetailed) => AsyncValidatorFn,
  }): Map<string, FormControl> {
    options = options || {};
    const currentValues = options.currentValues || {};
    const useDefaults = options.useDefaults !== false;
    const disabledProvider = options.disabledProvider || (() => false);
    const asyncValProvider = options.asyncValProvider;
    const requiredProvider = options.requiredProvider ? options.requiredProvider : ((cf: CustomFieldDetailed) => cf.required);
    const customValuesControlsMap = new Map();
    if (customFields) {
      for (const cf of customFields) {
        let value: string = currentValues[cf.internalName];
        if (value == null && useDefaults) {
          value = cf.defaultValue;
        }
        customValuesControlsMap.set(cf.internalName, this.formBuilder.control(
          {
            value,
            disabled: disabledProvider(cf),
          },
          requiredProvider(cf) ? Validators.required : null,
          asyncValProvider ? asyncValProvider(cf) : null,
        ));
      }
    }

    return customValuesControlsMap;
  }

  /**
   * Returns the `FieldOption` which represent the available options of the given custom field
   * @param field The custom field
   * @param format The shared format service
   */
  fieldOptions(field: CustomFieldDetailed): FieldOption[] {
    const isEnum = [CustomFieldTypeEnum.SINGLE_SELECTION, CustomFieldTypeEnum.MULTI_SELECTION].includes(field.type);
    if (!field.hasValuesList && !isEnum) {
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
      case CustomFieldTypeEnum.DYNAMIC_MULTI_SELECTION:
        return (field.dynamicValues || []).map(v => ({ value: v.value, text: v.label }));
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        return (field.possibleValues || []).map(v => ({
          value: ApiHelper.internalNameOrId(v), id: v.id, internalName: v.internalName,
          text: v.value, category: v.category == null ? null : v.category.name,
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
  toCustomValuesFilter(customValues: { [key: string]: string; }): string[] {
    const result: string[] = [];
    for (const key of Object.keys(customValues || {})) {
      const value = customValues[key];
      if (!empty(value)) {
        result.push(key + ':' + customValues[key]);
      }
    }
    return result;
  }

  /**
   * Returns a suitable representation for using user profile field values in searches
   * @param values The profile field values map
   */
  toProfileFieldsFilter(values: { [key: string]: string; }): string[] {
    // TODO we should correctly handle custom fields which are ranges.
    return this.toCustomValuesFilter(values);
  }

  /**
   * Returns a view of the custom field value as `CustomFieldValue`
   */
  asFieldValue(cf: CustomFieldDetailed, value: string, binaryValues?: CustomFieldBinaryValues): CustomFieldValue {
    const fieldValue: CustomFieldValue = { field: cf };
    if (!empty(value)) {
      switch (cf.type) {
        case CustomFieldTypeEnum.BOOLEAN:
          fieldValue.booleanValue = value === 'true';
          break;
        case CustomFieldTypeEnum.INTEGER:
          fieldValue.integerValue = parseInt(value, 10);
          break;
        case CustomFieldTypeEnum.DECIMAL:
          fieldValue.decimalValue = value;
          break;
        case CustomFieldTypeEnum.DATE:
          fieldValue.dateValue = value;
          break;
        case CustomFieldTypeEnum.STRING:
        case CustomFieldTypeEnum.TEXT:
        case CustomFieldTypeEnum.RICH_TEXT:
        case CustomFieldTypeEnum.URL:
          fieldValue.stringValue = value;
          break;
        case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        case CustomFieldTypeEnum.DYNAMIC_MULTI_SELECTION:
          const dynamicParts = value.split(/\|/g);
          if (cf.type === CustomFieldTypeEnum.DYNAMIC_SELECTION) {
            // For single dynamic selection, strip away the second part, if any
            if (dynamicParts.length > 1) {
              dynamicParts.splice(1, dynamicParts.length - 1);
            }
          }
          fieldValue.dynamicValues = (cf.dynamicValues || []).filter(dv => dynamicParts.includes(dv.value));
          break;
        case CustomFieldTypeEnum.SINGLE_SELECTION:
        case CustomFieldTypeEnum.MULTI_SELECTION:
          const pvs = value.split(/\|/g);
          fieldValue.enumeratedValues = (cf.possibleValues || []).filter(pv => pvs.includes(pv.id) || pvs.includes(pv.internalName));
          break;
        case CustomFieldTypeEnum.LINKED_ENTITY:
          const entityParts = value.split(/\|/g);
          const id = entityParts[0];
          const display = entityParts[1] || entityParts[0];
          switch (cf.linkedEntityType) {
            case LinkedEntityTypeEnum.USER:
              fieldValue.userValue = { id, display };
              break;
            case LinkedEntityTypeEnum.ADVERTISEMENT:
              fieldValue.adValue = { id, name: display };
              break;
            case LinkedEntityTypeEnum.RECORD:
              fieldValue.recordValue = { id, display };
              break;
            case LinkedEntityTypeEnum.TRANSFER:
              fieldValue.transferValue = { id, display };
              break;
            case LinkedEntityTypeEnum.TRANSACTION:
              fieldValue.transactionValue = { id, display };
              break;
          }
          break;
        case CustomFieldTypeEnum.FILE:
          fieldValue.fileValues = binaryValues.fileValues[cf.id] || binaryValues.fileValues[cf.internalName];
          break;
        case CustomFieldTypeEnum.IMAGE:
          fieldValue.imageValues = binaryValues.imageValues[cf.id] || binaryValues.imageValues[cf.internalName];
          break;
      }
    }
    return fieldValue;
  }
}
