import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnInit } from '@angular/core';
import { getRootSpinnerSvg, truthyAttr } from 'app/shared/helper';

/**
 * Shows a spinner to indicate that some processing is taking place
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'spinner',
  templateUrl: 'spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent implements OnInit {
  @HostBinding('class.spinner') classSpinner = true;

  @Input() size: string;

  private _bootstrap: boolean | string = false;
  @Input() get bootstrap(): boolean | string {
    return this._bootstrap;
  }
  set bootstrap(show: boolean | string) {
    this._bootstrap = truthyAttr(show);
  }

  constructor(private element: ElementRef<HTMLElement>) {}

  ngOnInit() {
    if (!this.bootstrap) {
      const element = this.element.nativeElement;
      element.style.width = this.size;
      element.style.height = this.size;
      element.innerHTML = getRootSpinnerSvg();
    }
  }
}
