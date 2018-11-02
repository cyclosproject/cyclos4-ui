import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { SnackBarProvider } from 'app/core/snack-bar-provider';
import { BehaviorSubject } from 'rxjs';

/**
 * A snackbar is a quick message shown in the page bottom
 */
@Component({
  selector: 'snack-bar',
  templateUrl: 'snack-bar.component.html',
  styleUrls: ['snack-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackBarComponent implements OnInit, SnackBarProvider {
  constructor(
    private notification: NotificationService,
    private _element: ElementRef
  ) {
  }

  message$ = new BehaviorSubject('');

  ngOnInit() {
    this.notification.snackBarProvider = this;
  }

  get element(): HTMLElement {
    return this._element.nativeElement;
  }

  show(message: string) {
    this.message$.next(message);
    const style = this.element.style;
    style.opacity = '1';
    style.transform = 'translate(-50%, 0)';
    setTimeout(() => this.hide(), 3000);
  }

  hide() {
    const style = this.element.style;
    style.opacity = '';
    style.transform = '';
  }

}
