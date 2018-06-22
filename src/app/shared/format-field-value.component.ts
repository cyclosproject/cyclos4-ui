import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  CustomFieldValue, CustomField, CustomFieldTypeEnum, CustomFieldDetailed,
  LinkedEntityTypeEnum,
  StoredFile,
  Image
} from 'app/api/models';
import { Messages } from 'app/messages/messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs';
import { NextRequestState } from 'app/core/next-request-state';
import * as download from 'downloadjs';
import { FilesService, ImagesService } from 'app/api/services';

/** Types whose values are rendered directly */
const DIRECT_TYPES = [
  CustomFieldTypeEnum.STRING,
  CustomFieldTypeEnum.DYNAMIC_SELECTION,
  CustomFieldTypeEnum.BOOLEAN,
  CustomFieldTypeEnum.LINKED_ENTITY
];

/**
 * Component used to directly display a custom field value.
 * Also works for regular fields.
 * The content of the `format-field-value` tag is rendered when
 * there is no value (default value).
 */
@Component({
  selector: 'format-field-value',
  templateUrl: 'format-field-value.component.html',
  styleUrls: ['format-field-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormatFieldValueComponent implements OnInit {
  constructor(
    private messages: Messages,
    private nextRequestState: NextRequestState,
    private filesService: FilesService,
    private imagesService: ImagesService) {
  }

  /**
   * Either this has to be specified or the other 3: fields + fieldName + object
   */
  @Input() fieldValue: CustomFieldValue;

  /**
   * Either this + fieldName + object has to be specified, or fieldValue.
   * This is actually optional. If not specified, or the corresponding field
   * is not found, will just render the actual value with no formatting.
   */
  @Input() fields: CustomFieldDetailed[];

  /**
   * Either this + fields + object has to be specified, or fieldValue
   */
  @Input() fieldName: string;

  /**
   * Either this + fields + field has to be specified, or fieldValue
   */
  @Input() object: any;

  /**
   * May be specified as a separated holder for custom values
   */
  @Input() customValues: any;

  /**
   * Indicates that multi-line / rich text should be rendered as plain text with no line breaks
   */
  @Input() plainText = false;

  field: CustomField;
  type: CustomFieldTypeEnum;
  value = new BehaviorSubject<any>(null);
  hasValue = new BehaviorSubject(false);

  get directValue(): boolean {
    return DIRECT_TYPES.includes(this.type);
  }

  ngOnInit() {
    if (this.fieldValue == null &&
      (this.fields == null || this.object == null)) {
      throw new Error('Either fieldValue or all fields, field and object must be set');
    }
    // Default the custom values source to object.customValues
    if (this.object != null && this.customValues == null) {
      this.customValues = this.object.customValues;
    }
    if (this.fieldValue == null) {
      // When there's no CustomFieldValue, emulate one, so the handling is the same regardless the case
      this.fieldValue = this.createFieldValue();
    }
    this.field = this.fieldValue.field;
    this.type = this.field.type;
    const value = this.getValue();
    // For rich / plain, handle text / rich text as plain text
    if (this.plainText && [CustomFieldTypeEnum.RICH_TEXT, CustomFieldTypeEnum.TEXT].includes(this.type)) {
      this.type = CustomFieldTypeEnum.STRING;
    }
    this.value.next(value);
    this.hasValue.next(value != null && (value.length === undefined || value.length > 0));
  }

  private getValue(): any {
    switch (this.type) {
      case CustomFieldTypeEnum.BOOLEAN:
        if (this.fieldValue.booleanValue != null) {
          return this.fieldValue.booleanValue
            ? this.messages.yes()
            : this.messages.no();
        }
        break;
      case CustomFieldTypeEnum.DATE:
        return this.fieldValue.dateValue;
      case CustomFieldTypeEnum.DECIMAL:
        return this.fieldValue.decimalValue;
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        const dyn = this.fieldValue.dynamicValue;
        if (dyn) {
          return dyn.label || dyn.value;
        }
        break;
      case CustomFieldTypeEnum.FILE:
        return this.fieldValue.fileValues;
      case CustomFieldTypeEnum.IMAGE:
        return this.fieldValue.imageValues;
      case CustomFieldTypeEnum.INTEGER:
        return this.fieldValue.integerValue;
      case CustomFieldTypeEnum.LINKED_ENTITY:
        let entity = null;
        switch (this.field.linkedEntityType) {
          case LinkedEntityTypeEnum.USER:
            entity = this.fieldValue.userValue;
            break;
          case LinkedEntityTypeEnum.ADVERTISEMENT:
            entity = this.fieldValue.adValue;
            break;
          case LinkedEntityTypeEnum.TRANSACTION:
            entity = this.fieldValue.transactionValue;
            break;
          case LinkedEntityTypeEnum.TRANSFER:
            entity = this.fieldValue.transferValue;
            break;
          case LinkedEntityTypeEnum.RECORD:
            entity = this.fieldValue.recordValue;
            break;
        }
        if (entity != null) {
          return entity.display || entity.name || entity.transactionNumber || entity.id;
        }
        break;
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        return this.fieldValue.enumeratedValues || [];
      case CustomFieldTypeEnum.RICH_TEXT:
        let rich = this.fieldValue.stringValue;
        if (rich != null && rich.length > 0) {
          if (this.plainText) {
            const div = document.createElement('div');
            div.innerHTML = rich;
            rich = div.textContent || div.innerText || '';
          } else {
            // For HTML, add a div in the end that prevents floats from passing
            // through the parent div's height
            rich += '<div class="clear-floats"></div>';
          }
        }
        return rich;
      default:
        return this.fieldValue.stringValue;
    }
    return null;
  }

  private createFieldValue(): CustomFieldValue {
    // First get the actual value
    let value = this.object[this.fieldName] as string;
    if (value == null && this.customValues) {
      // Attempt a custom field value
      value = this.customValues[this.fieldName] as string;
    }
    if (value === '') {
      value = null;
    }
    const parts = value == null ? [] : value.split(ApiHelper.VALUE_SEPARATOR);

    // Then create a new CustomFieldValue
    const fieldValue: CustomFieldValue = {
      field: this.fields.find(cf => cf.internalName === this.fieldName)
    };
    if (fieldValue.field == null) {
      // When no custom field is found, assume one of type string
      fieldValue.field = {
        name: this.fieldName,
        internalName: this.fieldName,
        type: CustomFieldTypeEnum.STRING
      };
    }
    switch (fieldValue.field.type) {
      case CustomFieldTypeEnum.BOOLEAN:
        fieldValue.booleanValue = value === 'true';
        break;
      case CustomFieldTypeEnum.DATE:
        fieldValue.dateValue = value;
        break;
      case CustomFieldTypeEnum.DECIMAL:
        fieldValue.decimalValue = value;
        break;
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        fieldValue.dynamicValue = {
          value: parts[0],
          label: parts.length > 1 ? parts[1] : parts[0]
        };
        break;
      case CustomFieldTypeEnum.INTEGER:
        fieldValue.integerValue = parseInt(value, 10);
        break;
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        fieldValue.enumeratedValues = parts.map(ref => {
          const cf = (fieldValue.field as CustomFieldDetailed);
          const possibleValues = (cf || {}).possibleValues;
          if (possibleValues) {
            return possibleValues.find(pv => pv.id === value || pv.internalName === value);
          }
          return null;
        });
        // Make sure no nulls exist in the value
        fieldValue.enumeratedValues = fieldValue.enumeratedValues.filter(pv => pv != null);
        break;
      case CustomFieldTypeEnum.LINKED_ENTITY:
        if (value != null) {
          const id = parts[0];
          const display = parts.length > 1 ? parts[1] : parts[0];
          switch (fieldValue.field.linkedEntityType) {
            case LinkedEntityTypeEnum.USER:
              fieldValue.userValue = {
                id: id,
                display: display
              };
              break;
            case LinkedEntityTypeEnum.ADVERTISEMENT:
              fieldValue.adValue = {
                id: id,
                name: display
              };
              break;
            case LinkedEntityTypeEnum.TRANSACTION:
              fieldValue.transactionValue = {
                id: id,
                display: display
              };
              break;
            case LinkedEntityTypeEnum.TRANSFER:
              fieldValue.transferValue = {
                id: id,
                display: display
              };
              break;
            case LinkedEntityTypeEnum.RECORD:
              fieldValue.recordValue = {
                id: id,
                display: display
              };
              break;
          }
        }
        break;
      case CustomFieldTypeEnum.FILE:
      case CustomFieldTypeEnum.IMAGE:
        // FILE and IMAGE are not supported on search results
        break;
      default:
        fieldValue.stringValue = value;
        break;
    }
    return fieldValue;
  }

  appendAuth(url: string): string {
    const sessionToken = this.nextRequestState.sessionToken;
    if (sessionToken == null || sessionToken === '') {
      return url;
    }
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'Session-Token=' + sessionToken;
  }

  downloadFile(event: MouseEvent, file: StoredFile) {
    this.filesService.getRawFileContent(file.id).subscribe(blob => {
      download(blob, file.name, file.contentType);
    });
    event.stopPropagation();
    event.preventDefault();
  }

  downloadImage(event: MouseEvent, image: Image) {
    const url = image.url;
    const sep = url.lastIndexOf('/');
    const file = url.substr(sep + 1);
    this.imagesService.getImageContentById({ id: image.id }).subscribe(blob => {
      download(blob, image.name, image.contentType);
    });
    event.stopPropagation();
    event.preventDefault();
  }
}
