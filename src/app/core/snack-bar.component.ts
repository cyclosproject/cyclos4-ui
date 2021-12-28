import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { SnackBarOptions, SnackBarProvider } from 'app/core/snack-bar-provider';
import { BehaviorSubject } from 'rxjs';

/**
 * A snackbar is a quick message shown in the page bottom
 */
@Component({
  selector: 'snack-bar',
  templateUrl: 'snack-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackBarComponent implements OnInit, SnackBarProvider {
  constructor(
    private notification: NotificationService,
    private _element: ElementRef,
  ) {
  }

  message$ = new BehaviorSubject('');
  private timeoutHandle: any;

  ngOnInit() {
    this.notification.snackBarProvider = this;
  }

  get element(): HTMLElement {
    return this._element.nativeElement;
  }

  @HostListener('click') onClick() {
    this.hide();
  }

  show(message: string, options?: SnackBarOptions) {
    const timeout = (options || {}).timeout || 3000;
    this.message$.next(message);
    const style = this.element.style;
    style.opacity = '1';
    style.transform = 'translate(-50%, 0)';
    this.timeoutHandle = setTimeout(() => this.hide(), timeout);
  }

  hide() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    const style = this.element.style;
    style.opacity = '';
    style.transform = '';
  }

}
