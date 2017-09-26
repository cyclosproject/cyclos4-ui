import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { MdSidenav } from "@angular/material";
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';

/**
 * A bar that stretches all available width
 */
@Component({
  selector: 'layout-bar',
  templateUrl: 'layout-bar.component.html',
  styleUrls: ['layout-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutBarComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }
}