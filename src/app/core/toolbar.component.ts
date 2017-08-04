import { Component, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import { MdSidenav } from "@angular/material";
import { FormatService } from "app/core/format.service";

/**
 * The toolbar displayed on the top
 */
@Component({
  selector: 'toolbar',
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss']
})
export class ToolbarComponent implements AfterViewInit {
  constructor(
    public format: FormatService
  ) { }

  @Input()
  public sidenav: MdSidenav;

  @ViewChild("title")
  private title: ElementRef;

  private previousTitle: string;

  ngAfterViewInit() {
    this.sidenav.onOpenStart.subscribe(() => {
      this.previousTitle = this.title.nativeElement.innerHTML;
      this.title.nativeElement.innerHTML = '';
    });
    this.sidenav.onCloseStart.subscribe(() => {
      this.title.nativeElement.innerHTML = this.previousTitle;
    });
  }
}