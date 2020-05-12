import {
  ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output
} from '@angular/core';
import { AbstractComponent } from 'app/shared/abstract.component';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';

/**
 * A button that displays a countdown after be clicked.
 */
@Component({
  selector: 'countdown-button',
  templateUrl: 'countdown-button.component.html',
  styleUrls: ['countdown-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownButtonComponent extends AbstractComponent implements OnInit {

  text$ = new BehaviorSubject<string>(null);
  disabled$ = new BehaviorSubject<boolean>(false);

  @Input() first: boolean;
  @Input() buttonText: string;
  @Input() icon: string;
  @Input() elementClass: string;
  @Input() disabledSeconds: number;
  @Input() disabledKey: (remainingSeconds: number) => string;
  @Output() action = new EventEmitter<any>();

  remaining: number;
  countdown: Observable<number>;
  subscription: Subscription;

  constructor(
    injector: Injector,
    public layout: LayoutService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.countdown = timer(1000, 1000);
    this.text$.next(this.buttonText);
  }

  onClick(event: any) {
    if (!this.disabled$.getValue()) {
      this.action.emit(event);
      this.remaining = this.disabledSeconds;
      this.disabled$.next(true);
      this.tick();
      this.subscription = this.countdown.subscribe(() => this.tick());
    }
  }

  tick() {
    if (this.remaining <= 0) {
      this.disabled$.next(false);
      this.text$.next(this.buttonText);
      this.subscription.unsubscribe();
    } else {
      this.text$.next(this.disabledKey(this.remaining));
      this.remaining--;
    }
  }
}
