import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { truthyAttr } from 'app/shared/helper';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';

/**
 * A button that displays a countdown after be clicked.
 */
@Component({
  selector: 'countdown-button',
  templateUrl: 'countdown-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownButtonComponent implements OnInit {

  @HostBinding('class.d-inline-block') classInlineBlock = true;
  @HostBinding('class.button') classButton = true;

  text$ = new BehaviorSubject<string>(null);
  disabled$ = new BehaviorSubject<boolean>(false);

  private _outline: boolean | string = false;
  @Input() get outline(): boolean | string {
    return this._outline;
  }
  set outline(show: boolean | string) {
    this._outline = truthyAttr(show);
  }

  @Input() label: string;
  @Input() icon: string;
  @Input() disabledSeconds: number;
  @Input() disabledKey: (remainingSeconds: number) => string;
  @Output() action = new EventEmitter<any>();

  remaining: number;
  countdown: Observable<number>;
  subscription: Subscription;

  constructor() { }

  ngOnInit() {
    this.countdown = timer(1000, 1000);
    this.text$.next(this.label);
  }

  onClick(event: any) {
    if (!this.disabled$.getValue()) {
      this.remaining = this.disabledSeconds;
      this.disabled$.next(true);
      this.subscription = this.countdown.subscribe(() => this.tick());
      this.action.emit(event);
      this.tick();
    }
  }

  tick() {
    if (this.disabled$.value === false) {
      return;
    }
    if (this.remaining <= 0) {
      this.reenable();
    } else {
      this.text$.next(this.disabledKey ? this.disabledKey(this.remaining) : String(this.remaining));
      this.remaining--;
    }
  }

  reenable() {
    this.disabled$.next(false);
    this.text$.next(this.label);
    this.remaining = 0;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
