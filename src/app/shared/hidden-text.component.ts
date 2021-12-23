import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { AbstractComponent } from 'app/shared/abstract.component';
import { repeat } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows some discs instead of a text, with an icon to disclose the actual text.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'hidden-text',
  templateUrl: 'hidden-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenTextComponent extends AbstractComponent implements OnInit {
  @HostBinding('class.mw-100') classMaxWidth = true;

  @Input() text: string;
  hidden$ = new BehaviorSubject(true);
  display$ = new BehaviorSubject('');

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.hidden$.subscribe(() => this.updateDisplay()));
    this.updateDisplay();
  }

  toggle() {
    this.hidden$.next(!this.hidden$.value);
  }

  private updateDisplay() {
    const hidden = this.hidden$.value;
    this.display$.next(hidden
      ? repeat('•', (this.text || '123456').length)
      : this.text);
  }
}
