import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Displays a label / value pair
 */
@Component({
  selector: 'label-value',
  templateUrl: 'label-value.component.html',
  styleUrls: ['label-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelValueComponent implements OnInit {
  constructor() { }

  @Input() label: string;

  /** The value may be specified as this attribute or as tag content */
  @Input() value: any;

  /**
   * How to interpret the value: plain text, keep line breaks or trust as HTML.
   * WARNING: When using anything other than 'break' the value should be passed
   * in as an attribute, not content.
   */
  @Input() valueType: 'plain' | 'break' | 'html' = 'plain';

  private _labelWidth: string;
  @Input()
  set labelWidth(val: string | number) {
    this._labelWidth = typeof val === 'number' ? val + 'px' : val;
  }
  get labelWidth(): string | number {
    return this._labelWidth || '160px';
  }

  ngOnInit() { }
}
