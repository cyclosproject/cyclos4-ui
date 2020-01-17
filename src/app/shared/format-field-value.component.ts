import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import {
  CustomField, CustomFieldDetailed, CustomFieldTypeEnum, CustomFieldValue,
  Image, LinkedEntityTypeEnum, StoredFile
} from 'app/api/models';
import { FilesService, ImagesService } from 'app/api/services';
import { NextRequestState } from 'app/core/next-request-state';
import { I18n } from 'app/i18n/i18n';
import { AbstractComponent } from 'app/shared/abstract.component';
import { ApiHelper } from 'app/shared/api-helper';
import { truthyAttr } from 'app/shared/helper';
import download from 'downloadjs';

/** Types whose values are rendered directly */
const DIRECT_TYPES = [
  CustomFieldTypeEnum.STRING,
  CustomFieldTypeEnum.DYNAMIC_SELECTION,
  CustomFieldTypeEnum.BOOLEAN,
  CustomFieldTypeEnum.INTEGER,
  CustomFieldTypeEnum.DECIMAL,
  CustomFieldTypeEnum.DATE,
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
export class FormatFieldValueComponent extends AbstractComponent implements OnInit {
  constructor(
    injector: Injector,
    public i18n: I18n,
    private nextRequestState: NextRequestState,
    private filesService: FilesService,
    private imagesService: ImagesService) {
    super(injector);
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
   * Known images, so they can be looked up by id
   */
  @Input() images: Image[];

  /**
   * Known files, so they can be looked up by id
   */
  @Input() files: StoredFile[];

  private _asLabelValue: boolean | string = false;

  @Input() get asLabelValue(): boolean | string {
    return this._asLabelValue;
  }
  set asLabelValue(value: boolean | string) {
    this._asLabelValue = truthyAttr(value);
  }

  /**
   * Indicates that multi-line / rich text should be rendered as plain text with no line breaks
   */
  private _plainText: boolean | string = false;
  @Input() get plainText(): boolean | string {
    return this._plainText;
  }
  set plainText(plainText: boolean | string) {
    this._plainText = truthyAttr(plainText);
  }

  field: CustomField;
  type: CustomFieldTypeEnum;
  value: any;
  hasValue = false;

  get directValue(): boolean {
    return DIRECT_TYPES.includes(this.type);
  }

  ngOnInit() {
    super.ngOnInit();

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
    this.value = value;
    this.hasValue = value != null && (value.length === undefined || value.length > 0);
    if (this.asLabelValue && typeof value === 'string' && this.field.type !== CustomFieldTypeEnum.URL) {
      this.value = this.i18n.general.labelValue({
        label: this.field.name,
        value: value
      });
    }
  }

  private getValue(): any {
    switch (this.type) {
      case CustomFieldTypeEnum.BOOLEAN:
        if (this.fieldValue.booleanValue != null) {
          return this.fieldValue.booleanValue
            ? this.i18n.general.yes
            : this.i18n.general.no;
        }
        break;
      case CustomFieldTypeEnum.DATE:
        return this.format.formatAsDate(this.fieldValue.dateValue);
      case CustomFieldTypeEnum.DECIMAL:
        return this.format.formatAsNumber(this.fieldValue.decimalValue, this.field.decimalDigits);
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
        return this.format.formatAsNumber(this.fieldValue.integerValue, 0);
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
            return possibleValues.find(pv => pv.id === ref || pv.internalName === ref);
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
        fieldValue.fileValues = parts.map(id => (this.files || []).find(f => f.id === id)).filter(f => f != null);
        break;
      case CustomFieldTypeEnum.IMAGE:
        fieldValue.imageValues = parts.map(id => (this.images || []).find(i => i.id === id)).filter(i => i != null);
        break;
      default:
        fieldValue.stringValue = value;
        break;
    }
    return fieldValue;
  }

  appendAuth(url: string): string {
    return this.nextRequestState.appendAuth(url);
  }

  downloadFile(event: MouseEvent, file: StoredFile) {
    this.addSub(this.filesService.getRawFileContent({ id: file.id }).subscribe(blob => {
      download(blob, file.name, file.contentType);
    }));
    event.stopPropagation();
    event.preventDefault();
  }

  downloadImage(event: MouseEvent, image: Image) {
    this.addSub(this.imagesService.getImageContent({ idOrKey: image.id }).subscribe(blob => {
      download(blob, image.name, image.contentType);
    }));
    event.stopPropagation();
    event.preventDefault();
  }
}
