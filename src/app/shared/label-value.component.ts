import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ElementRef,
  HostBinding, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef
} from '@angular/core';
import { CustomFieldSizeEnum } from 'app/api/models';
import { Breakpoint as LayoutBreakpoint, LayoutService } from 'app/core/layout.service';
import { BaseFormFieldComponent, FieldLabelPosition } from 'app/shared/base-form-field.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { truthyAttr } from 'app/shared/helper';
import { ValueFormat } from 'app/shared/value-format';
import { Subscription } from 'rxjs';


export const COLS = 12;

type Breakpoint = 'xxs' | 'xs' | 'sm' | 'md';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelValueComponent implements OnInit, OnDestroy, OnChanges {

  @HostBinding('class.label-value') classLabelValue = true;
  @HostBinding('class.any-label-value') classAnyLabelValue = true;
  @HostBinding('class.label-on-side') classLabelOnSide = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private layout: LayoutService,
    private element: ElementRef<HTMLElement>
  ) { }

  private subs: Subscription[] = [];

  /** When the content has an extraCell directive, we render it on the same row */
  @ContentChild(ExtraCellDirective, { static: true, read: TemplateRef }) _extraCell: TemplateRef<any>;

  @HostBinding('class.has-extra-cell') get extraCell(): ExtraCellDirective {
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

  /** The information text to display */
  @Input() informationText: string;

  /** Whether the extra cell, even if present, should be ignored */
  private _ignoreExtraCell = false;
  @Input() get ignoreExtraCell(): boolean | string {
    return this._ignoreExtraCell;
  }
  set ignoreExtraCell(ignoreExtraCell: boolean | string) {
    this._ignoreExtraCell = truthyAttr(ignoreExtraCell);
  }

  /** Whether to use as many columns as possible for the label */
  private _maximizeLabel = false;
  @HostBinding('class.maximize-label') @Input() get maximizeLabel(): boolean | string {
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
  @Input() fieldSize = CustomFieldSizeEnum.FULL;

  /** Optional control id for which this label refers to */
  @Input() forId = undefined;

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
    if (field) {
      // As we've modified @Input() properties, manually trigger change detection
      this.changeDetector.detectChanges();
    }
    // Update the indication that the label is on side
    this.subs.push(this.layout.breakpointChanges$.subscribe(bs => {
      this.updateLabelOnSideClass(bs);
    }));
    this.updateLabelOnSideClass(this.layout.activeBreakpoints);
    this.updateSizeClass();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.labelOnSide) {
      this.updateLabelOnSideClass(this.layout.activeBreakpoints);
    }
    if (changes.fieldSize) {
      this.updateSizeClass();
    }
  }

  private updateSizeClass() {
    const classes = this.element.nativeElement.classList;
    for (const size of Object.values(CustomFieldSizeEnum)) {
      classes.remove(`size-${size}`);
    }
    if (this.fieldSize) {
      classes.add(`size-${this.fieldSize}`);
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
      // We have to manipulate the element directly because host binding is not adding or removing the
      // class style correctly when this component is embeeded inside another component (e.g custom-field-input.component)
      this.element.nativeElement.classList[labelOnSide ? 'add' : 'remove']('label-on-side');
      this.changeDetector.detectChanges();
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
