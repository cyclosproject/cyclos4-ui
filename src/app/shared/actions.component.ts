import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, HostBinding } from '@angular/core';
import { truthyAttr } from 'app/shared/helper';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'actions',
  templateUrl: 'actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsComponent implements OnInit {

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
    // The reverse is actually reversed :)
    const suffix = this.reverseRow ? 'row' : 'row-reverse';
    if (this.forceRow) {
      el.classList.add(`flex-xs-${suffix}`);
      el.classList.add('force-row');
    } else {
      el.classList.add(`flex-sm-${suffix}`);
    }
  }
}
