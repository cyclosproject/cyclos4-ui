import { Component, ChangeDetectionStrategy, Input, OnInit, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { RootMenuEntry, RootMenu, MenuType } from 'app/shared/menu';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { Router } from '@angular/router';
import { NotificationService } from 'app/core/notification.service';
import { SnackBarProvider } from 'app/core/snack-bar-provider';

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
