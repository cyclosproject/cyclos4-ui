import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { MdSidenav } from "@angular/material";
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';

/**
 * The toolbar displayed on the top
 */
@Component({
  selector: 'toolbar',
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  public sidenav: MdSidenav;
}