import {
  Component, OnInit, Input, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef,
  ContentChild, TemplateRef, HostBinding
} from '@angular/core';
import { truthyAttr } from 'app/shared/helper';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { ValueFormat } from 'app/shared/value-format';
import { Subscription } from 'rxjs';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';

/**
 * Displays a label / value pair
 */
@Component({
  selector: 'label-value',
  templateUrl: 'label-value.component.html',
  styleUrls: ['label-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelValueComponent implements OnInit, OnDestroy {

  @HostBinding('class.label-value') classLabelValue = true;
  @HostBinding('class.row') classRow = true;
  @HostBinding('class.no-gutters') classNoGutters = true;
  @HostBinding('class.any-label-value') classAnyLabelValue = true;

  constructor(private changeDetector: ChangeDetectorRef) { }

  private sub: Subscription;

  /** When the content has an extraCell directive, we render it on the same row */
  @ContentChild(ExtraCellDirective, { read: TemplateRef }) _extraCell;

  get extraCell(): ExtraCellDirective {
    if (this._ignoreExtraCell) {
      return null;
    }
    return this._extraCell;
  }

  /** When setting the full form field, copy settings such as label and required */
  @Input() formField: BaseFormFieldComponent<any>;

  /** The label to display */
  @Input() label: string;

  /** Where to place the label */
  @Input() labelPosition: 'side' | 'above' | 'auto' = 'auto';

  /** Label size */
  @Input() labelSize: 'normal' | 'large' | 'small' = 'normal';

  /** Whether the extra cell, even if present, should be ignored */
  private _ignoreExtraCell = false;
  @Input() get ignoreExtraCell(): boolean | string {
    return this._ignoreExtraCell;
  }
  set ignoreExtraCell(ignoreExtraCell: boolean | string) {
    this._ignoreExtraCell = truthyAttr(ignoreExtraCell);
  }

  /** Whether to visually present a required marker next to the label */
  private _required = false;
  @Input() get required(): boolean | string {
    return this._required;
  }
  set required(required: boolean | string) {
    this._required = truthyAttr(required);
  }

  /** The size for the value part */
  @Input() fieldSize: CustomFieldSizeEnum | number = CustomFieldSizeEnum.FULL;

  labelClasses: string[];
  valueClasses: string[];

  /** Optional control id for which this label refers to */
  @Input() forId = '';

  /** The value may be specified as this attribute or as tag content */
  private _value = null;
  @Input() get value(): any {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }

  /**
   * How the label-value is used:
   * - view: The value is a simple text or simple view-only widget
   * - field: A form field
   * - fieldView: Like view, but presenting in the same way as form fields
   */
  @Input() kind: 'view' | 'field' | 'fieldView' = 'view';

  @HostBinding('class.view') get view() {
    return this.kind === 'view';
  }
  @HostBinding('class.field') get field() {
    return this.kind === 'field';
  }
  @HostBinding('class.field-view') get fieldView() {
    return this.kind === 'fieldView';
  }

  /**
   * How to interpret the value: plain text, keep line breaks or trust as HTML.
   * WARNING: When using anything other than 'plain' the value should be passed
   * in as an attribute, not content.
   */
  @Input() valueFormat: ValueFormat = 'plain';

  ngOnInit() {
    const field = this.formField;
    if (field) {
      this.kind = 'field';
      this.label = field.label;
      this.labelPosition = field.labelPosition;
      this.required = field.required;
      this.fieldSize = field.fieldSize;
      this.forId = field.id;
      this.sub = field.disabledChange.subscribe(disabled => this.updateFieldDisabled(disabled));
      this.valueFormat = field.disabledFormat;
      this.updateFieldDisabled(field.disabled);
    }
    this.labelClasses = this.resolveLabelClasses();
    this.valueClasses = this.resolveValueClasses();
    if (field) {
      // As we've modified @Input() properties, manually trigger change detection
      this.changeDetector.detectChanges();
    }
  }

  private resolveLabelClasses(): string[] {
    const classes: string[] = [];
    switch (this.labelPosition) {
      case 'above':
        classes.push('col-12');
        break;
      case 'side':
        classes.push('col-4');
        break;
      default:
        classes.push('col-12');
        if (this.kind === 'view') {
          classes.push('col-xs-5');
        } else {
          classes.push('col-sm-4');
        }
        break;
    }
    if (this.labelSize === 'large') {
      classes.push('label-large');
    } else if (this.labelSize === 'small') {
      classes.push('label-small');
    }
    return classes;
  }

  private resolveValueClasses(): string[] {
    let cols: number;
    if (typeof this.fieldSize === 'number') {
      cols = this.fieldSize;
    } else {
      switch (this.fieldSize) {
        case CustomFieldSizeEnum.TINY:
          cols = 2;
          break;
        case CustomFieldSizeEnum.SMALL:
          cols = 3;
          break;
        case CustomFieldSizeEnum.MEDIUM:
          cols = 5;
          break;
        default:
          cols = 8;
          break;
      }
    }

    switch (this.labelPosition) {
      case 'above':
        return this.extraCell ? ['col-10', `col-sm-11`] : ['col-12'];
      case 'side':
        return this.extraCell ? ['col-6', `col-sm-${cols - 1}`] : ['col-8', `col-sm-${cols}`];
      default:
        if (this.kind === 'view') {
          // Readonly shows the value on the same line, even on XS (but not on XXS)
          if (this.extraCell) {
            return ['col-10', 'col-xs-6', `col-sm-${cols - 2}`];
          } else {
            return ['col-12', 'col-xs-7', `col-sm-${cols - 1}`];
          }
        } else {
          if (this.extraCell) {
            return ['col-10', `col-sm-${cols - 1}`];
          } else {
            return ['col-12', `col-sm-${cols}`];
          }
        }
    }
  }

  private updateFieldDisabled(disabled: boolean) {
    this.kind = disabled ? 'fieldView' : 'field';
    if (this.formField.disabledFormat === 'component') {
      // The disable version is another component. Don't set the value, as the <ng-content> still has to be rendered
      this.value = null;
    } else {
      // Set a value, which, according to the template, is rendered instead of the <ng-content>
      this.value = disabled ? this.formField.disabledValue : null;
    }
    this.changeDetector.detectChanges();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
