import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild,
  HostBinding, Input, OnDestroy, OnInit, TemplateRef, OnChanges, SimpleChanges
} from '@angular/core';
import { CustomFieldSizeEnum } from 'app/api/models';
import { BaseFormFieldComponent, FieldLabelPosition } from 'app/shared/base-form-field.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { truthyAttr } from 'app/shared/helper';
import { ValueFormat } from 'app/shared/value-format';
import { Subscription } from 'rxjs';
import { LayoutService, Breakpoint as LayoutBreakpoint } from 'app/shared/layout.service';

export const COLS = 12;

type Breakpoint = 'xxs' | 'xs' | 'sm' | 'md';
const Breakpoints: Breakpoint[] = ['xxs', 'xs', 'sm', 'md'];

/**
 * How the label-value is used:
 * - view: The value is a simple text or simple view-only widget
 * - field: A form field
 * - fieldView: Like view, but presenting in the same way as form fields
 */
export type LabelValueKind = 'view' | 'field' | 'fieldView';

/**
 * Displays a label / value pair
 */
@Component({
  selector: 'label-value',
  templateUrl: 'label-value.component.html',
  styleUrls: ['label-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelValueComponent implements OnInit, OnDestroy, OnChanges {

  @HostBinding('class.label-value') classLabelValue = true;
  @HostBinding('class.row') classRow = true;
  @HostBinding('class.no-gutters') classNoGutters = true;
  @HostBinding('class.any-label-value') classAnyLabelValue = true;
  @HostBinding('class.label-on-side') classLabelOnSide = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private layout: LayoutService
  ) { }

  private subs: Subscription[] = [];

  /** When the content has an extraCell directive, we render it on the same row */
  @ContentChild(ExtraCellDirective, { static: true, read: TemplateRef }) _extraCell: TemplateRef<any>;

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
  @Input() labelPosition: FieldLabelPosition = 'auto';

  /** Whether the extra cell, even if present, should be ignored */
  private _ignoreExtraCell = false;
  @HostBinding('class.maximize-label') @Input()
  get ignoreExtraCell(): boolean | string {
    return this._ignoreExtraCell;
  }
  set ignoreExtraCell(ignoreExtraCell: boolean | string) {
    this._ignoreExtraCell = truthyAttr(ignoreExtraCell);
  }

  /** Whether to use as many columns as possible for the label */
  private _maximizeLabel = false;
  @Input() get maximizeLabel(): boolean | string {
    return this._maximizeLabel;
  }
  set maximizeLabel(maximizeLabel: boolean | string) {
    this._maximizeLabel = truthyAttr(maximizeLabel);
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

  @Input() kind: LabelValueKind = 'view';

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
      this.subs.push(field.disabledChange.subscribe((disabled: boolean) => this.updateFieldDisabled(disabled)));
      this.valueFormat = field.disabledFormat;
      this.updateFieldDisabled(field.disabled);
    }
    this.initClasses();
    if (field) {
      // As we've modified @Input() properties, manually trigger change detection
      this.changeDetector.detectChanges();
    }
    // Update the indication that the label is on side
    this.subs.push(this.layout.breakpointChanges$.subscribe(bs => {
      this.updateLabelOnSideClass(bs);
    }));
    this.updateLabelOnSideClass(this.layout.activeBreakpoints);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.labelPosition || changes.fieldSize) {
      this.initClasses();
    }
  }

  private updateLabelOnSideClass(bs: Set<LayoutBreakpoint>) {
    const bp: Breakpoint = bs.has('xxs')
      ? 'xxs' : bs.has('xs')
        ? 'xs' : bs.has('sm')
          ? 'sm' : 'md';
    const labelOnSide = this.isLabelOnSide(bp);
    if (this.classLabelOnSide !== labelOnSide) {
      this.classLabelOnSide = labelOnSide;
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

    for (const breakpoint of Breakpoints) {
      const cols = this.getCols(breakpoint);
      const prefix = breakpoint === 'xxs' ? '' : `-${breakpoint}`;
      this.labelClasses.push(`col${prefix}-${cols.label}`);
      this.valueClasses.push(`col${prefix}-${cols.value}`);
      if (this.extraCell) {
        this.extraClasses.push(`col${prefix}-${cols.extra}`);
      }
    }
    if (this.maximizeLabel) {
      this.valueClasses.push('align-items-end');
      this.valueClasses.push('align-items-sm-start');
    }
  }

  /**
   * Returns whether, for the given breakpoint, labels should be rendered on side.
   */
  private isLabelOnSide(breakpoint: Breakpoint): boolean {
    if (this.labelPosition === 'sideForced') {
      return true;
    }
    switch (breakpoint) {
      case 'xxs':
        // Other than sideForced, won't be on side on xxs
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
          // On xxs use 6 cols
          return this.maximizeLabel
            ? this.extraCell ? 9 : 10
            : 6;
        case 'xs':
          // On xs use 5 cols
          return this.maximizeLabel
            ? this.extraCell ? 10 : 11
            : 5;
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
    if (typeof this.fieldSize === 'number') {
      // Specific number of columns
      return this.fieldSize;
    } else if (this.labelPosition === 'above') {
      // Take all cols for value
      return COLS;
    } else if (breakpoint === 'xxs') {
      // On xxs we ignore the fieldSize
      return labelCols === COLS ? COLS : COLS - labelCols;
    } else {
      // Depends on field size
      switch (this.fieldSize) {
        case CustomFieldSizeEnum.TINY:
          switch (breakpoint) {
            case 'xs':
              return 6;
            case 'sm':
              return 4;
            default:
              return 3;
          }
        case CustomFieldSizeEnum.SMALL:
          switch (breakpoint) {
            case 'xs':
              return 7;
            case 'sm':
              return 5;
            default:
              return 3;
          }
        case CustomFieldSizeEnum.MEDIUM:
          switch (breakpoint) {
            case 'xs':
              return 9;
            case 'sm':
              return 6;
            default:
              return 5;
          }
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
    this.subs.forEach(s => s.unsubscribe());
  }
}
