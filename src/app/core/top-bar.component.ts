import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { MdSidenav } from "@angular/material";
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';

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
  public sidenav: MdSidenav;
}