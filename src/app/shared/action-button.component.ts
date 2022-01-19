import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Injector, Input, OnChanges, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';
import { BehaviorSubject, Subscription } from 'rxjs';

export type ActionKind
  /** Primary actions like submit. Default kind */
  = 'primary'

  /** Actions "inside" a page which are not primary, like actions over images editing the profile or the button to add new addresses */
  | 'secondary';

/**
 * A button that displays a spinner, before the icon and/or text, if it is disabled.
 */
@Component({
  selector: 'action-button',
  templateUrl: 'action-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonComponent extends BaseComponent implements OnChanges {

  @HostBinding('class.d-inline-block') classInlineBlock = true;
  @HostBinding('class.button') classButton = true;

  private _outline: boolean | string = false;
  @Input() get outline(): boolean | string {
    return this._outline;
  }
  set outline(show: boolean | string) {
    this._outline = truthyAttr(show);
  }

  @Input() actionKind: ActionKind;
  @Input() disabled: boolean;
  @Input() label: string;
  @Input() icon: SvgIcon | string;
  @Output() action = new EventEmitter<any>();

  _disableSpinner: boolean | string = false;
  @Input() get disableSpinner(): boolean | string {
    return this._disableSpinner;
  }
  set disableSpinner(flag: boolean | string) {
    this._disableSpinner = truthyAttr(flag);
  }

  @ViewChild('button') button: ElementRef<HTMLButtonElement>;

  subscription: Subscription;
  showSpinner$ = new BehaviorSubject(false);

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.disabled && changes.disabled.currentValue === false) {
      this.showSpinner$.next(false);
    }
  }

  onClick(event: any) {
    if (!this.disableSpinner) {
      this.showSpinner$.next(true);
    }
    this.action.emit(event);
  }

  click() {
    this.button.nativeElement.click();
  }
}
