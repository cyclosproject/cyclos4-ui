import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Injector, Input, OnChanges, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';
import { BehaviorSubject, Subscription } from 'rxjs';

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

  @Input() disabled: boolean;
  @Input() label: string;
  @Input() icon: string;
  @Output() action = new EventEmitter<any>();

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
    this.showSpinner$.next(true);
    this.action.emit(event);
  }

  click() {
    this.button.nativeElement.click();
  }
}
