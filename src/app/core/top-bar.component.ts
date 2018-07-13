import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector, EventEmitter, Output } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { BaseComponent } from 'app/shared/base.component';
import { User } from 'app/api/models';
import { Subject } from 'rxjs';

/**
 * The top bar with the application title, main menu, personal menu, etc.
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent extends BaseComponent {

  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  sidenav: MatSidenav;

  @Output()
  togglePersonalMenu = new EventEmitter<HTMLElement>();

  @ViewChild('personalMenuToggle')
  personalMenuToggle: ElementRef;

  hideTitle = new Subject<boolean>();

  ngOnInit() {
    super.ngOnInit();
    if (this.sidenav) {
      this.subscriptions.push(this.sidenav.openedStart.subscribe(() => this.hideTitle.next(true)));
      this.subscriptions.push(this.sidenav.closedStart.subscribe(() => this.hideTitle.next(false)));
    }
  }

  personalMenuToggleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.togglePersonalMenu.emit(this.personalMenuToggle.nativeElement);
  }

}
