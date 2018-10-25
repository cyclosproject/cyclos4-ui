import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild,
  HostBinding, Input, OnDestroy, OnInit, TemplateRef
} from '@angular/core';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { truthyAttr } from 'app/shared/helper';
import { ValueFormat } from 'app/shared/value-format';
import { Subscription } from 'rxjs';

export const COLS = 12;

type Breakpoint = 'xxs' | 'xs' | 'sm';
const BREAKPOINTS: Breakpoint[] = ['xxs', 'xs', 'sm'];

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

  /** Whether to prevent line wrapping on labels */
  private _noWrapLabel = false;
  @Input() get noWrapLabel(): boolean | string {
    return this._noWrapLabel;
  }
  set noWrapLabel(noWrapLabel: boolean | string) {
    this._noWrapLabel = truthyAttr(noWrapLabel);
  }

  /** The size for the value part */
  @Input() fieldSize: CustomFieldSizeEnum | number = CustomFieldSizeEnum.FULL;

  labelClasses: string[];
  valueClasses: string[];
  extraClasses: string[];

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
    this.initClasses();
    if (field) {
      // As we've modified @Input() properties, manually trigger change detection
      this.changeDetector.detectChanges();
    }
  }

  /**
   * Initializes the classes for label, value and extra.
   * The extra cell, if used, takes 2 cols in xxs / xs, and 1 col for larger.
   */
  private initClasses() {
    this.labelClasses = [];
    this.valueClasses = [];
    this.extraClasses = [];

    for (const breakpoint of BREAKPOINTS) {
      const cols = this.getCols(breakpoint);
      const prefix = breakpoint === 'xxs' ? '' : `-${breakpoint}`;
      this.labelClasses.push(`col${prefix}-${cols.label}`);
      this.valueClasses.push(`col${prefix}-${cols.value}`);
      if (this.extraCell) {
        this.extraClasses.push(`col${prefix}-${cols.extra}`);
      }
    }
  }

  /**
   * Returns whether, for the given breakpoint, labels should be rendered on side.
   */
  private isLabelOnSide(breakpoint: Breakpoint): boolean {
    switch (breakpoint) {
      case 'xxs':
        // Never allow labels on side on xxs - they don't fit!
        return false;
      case 'xs':
        // For xs, the labelPosition 'auto' will render on side for view or fieldView
        return this.labelPosition === 'side' || this.labelPosition === 'auto' && ['view', 'fieldView'].includes(this.kind);
      default:
        // For larger resolutions, will always use labels on side, unless explicitly stated as above
        return this.labelPosition !== 'above';
    }
  }

  /**
   * Returns the number of columns used by each aspect: label, value and extra
   * @param breakpoint The resolution breakpoint
   */
  private getCols(breakpoint: Breakpoint): { label: number, value: number, extra: number } {
    const labelCols = this.getLabelCols(breakpoint);

    let valueCols = this.getValueCols(labelCols, breakpoint);
    let extraCols = this.getExtraCols(breakpoint);

    if (this.extraCell) {
      const totalCols = valueCols + labelCols + extraCols;
      if (totalCols > COLS) {
        // Sacrifice the value cols, taking all remaining cols
        valueCols = (COLS === labelCols ? COLS : COLS - labelCols) - extraCols;
      } else if (totalCols < COLS) {
        // There are less cols - expand the extra cols
        extraCols = (COLS === labelCols ? COLS : COLS - labelCols) - valueCols;
      }
    }
    return { label: labelCols, value: valueCols, extra: extraCols };
  }

  /**
   * Returns the number of columns used by labels in the given breakpoint
   */
  private getLabelCols(breakpoint: Breakpoint): number {
    const labelOnSide = this.isLabelOnSide(breakpoint);
    if (labelOnSide) {
      switch (breakpoint) {
        case 'xxs':
          // On xxs it is the same as if labels are forced above
          return COLS;
        case 'xs':
          // On xs use 5 cols for view mode, 4 for form mode
          return this.kind === 'view' ? 5 : 4;
        default:
          // On larger resolutions, always use 4 cols for labels
          return 4;
      }
    } else {
      // Use all columns
      return COLS;
    }
  }

  /**
   * Returns the number of columns used by values
   */
  private getValueCols(labelCols: number, breakpoint: Breakpoint): number {
    if (breakpoint === 'xxs') {
      // For xxs always use all columns
      return COLS;
    } else if (typeof this.fieldSize === 'number') {
      // Specific number of columns
      return this.fieldSize;
    } else if (this.labelPosition === 'above') {
      // Take all cols for value
      return COLS;
    } else {
      // Depends on field size
      switch (this.fieldSize) {
        case CustomFieldSizeEnum.TINY:
          return breakpoint === 'xs' ? 4 : 2;
        case CustomFieldSizeEnum.SMALL:
          return breakpoint === 'xs' ? 6 : 3;
        case CustomFieldSizeEnum.MEDIUM:
          return breakpoint === 'xs' ? 8 : 5;
        default:
          return labelCols === COLS ? COLS : COLS - labelCols;
      }
    }
  }

  /**
   * Returns the number of columns used by extra widgets
   */
  private getExtraCols(breakpoint: Breakpoint): number {
    if (this.extraCell) {
      switch (breakpoint) {
        case 'xxs':
          return 3;
        case 'xs':
          return 2;
        default:
          return 1;
      }
    } else {
      return 0;
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
