import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnInit } from '@angular/core';
import { truthyAttr } from 'app/shared/helper';

export type ActionKind
  /** Primary actions like submit. Default kind */
  = 'primary'

  /** Actions "inside" a page which are not primary, like actions over images editing the profile or the button to add new addresses */
  | 'secondary';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'actions',
  templateUrl: 'actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsComponent implements OnInit {

  @Input() kind: ActionKind = 'primary';

  private _forceRow: boolean | string;
  @Input() get forceRow(): boolean | string {
    return this._forceRow;
  }
  set forceRow(forceRow: boolean | string) {
    this._forceRow = truthyAttr(forceRow);
  }

  private _reverseRow: boolean | string;
  @Input() get reverseRow(): boolean | string {
    return this._reverseRow;
  }
  set reverseRow(reverseRow: boolean | string) {
    this._reverseRow = truthyAttr(reverseRow);
  }

  private _forceColumn: boolean | string;
  @Input() get forceColumn(): boolean | string {
    return this._forceColumn;
  }
  set forceColumn(forceColumn: boolean | string) {
    this._forceColumn = truthyAttr(forceColumn);
  }

  private _minimal: boolean | string;
  @HostBinding('class.minimal') @Input() get minimal(): boolean | string {
    return this._minimal;
  }
  set minimal(minimal: boolean | string) {
    this._minimal = truthyAttr(minimal);
  }

  constructor(private element: ElementRef) {
  }

  ngOnInit() {
    const el = this.element.nativeElement as HTMLElement;
    el.className = 'actions d-flex justify-content-between ' + el.className;
    el.classList.add('flex-column');
    if (this.kind === 'primary') {
      el.classList.add('actions-primary');
    }
    if (!this.forceColumn) {
      // The reverse is actually reversed :)
      el.classList.add('flex-sm-' + (this.reverseRow ? 'row' : 'row-reverse'));
      if (this.forceRow) {
        el.classList.add('force-row');
      }
    }
  }
}
