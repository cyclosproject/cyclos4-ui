import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector, EventEmitter, Output } from '@angular/core';
import { MdSidenav } from "@angular/material";
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';
import { User } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';
import { AvatarComponent } from 'app/shared/avatar.component';

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
  sidenav: MdSidenav;

  @Output()
  togglePersonalMenu = new EventEmitter<HTMLElement>();

  @ViewChild("personalMenuToggle")
  personalMenuToggle: ElementRef;

  personalMenuToggleClick(event: MouseEvent) {
    this.togglePersonalMenu.emit(this.personalMenuToggle.nativeElement);
    event.preventDefault();
    event.stopPropagation();
  }

  get user(): User {
    return this.login.user;
  }

}