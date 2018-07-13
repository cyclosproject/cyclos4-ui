import { Component, AfterViewInit, Input, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';

/**
 * Displays actions, normally buttons
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'actions',
  templateUrl: 'actions.component.html',
  styleUrls: ['actions.component.scss']
})
export class ActionsComponent implements OnInit, AfterViewInit {

  @Input() root: boolean | string = false;
  @Input() reverse: boolean | string = false;
  @Input() topMargin: 'normal' | 'double' | 'half' | 'small' | 'none' = 'normal';
  @Input() align: string;
  @Input() buttonSpace: 'normal' | 'small' | 'equidistant' | 'none' = 'normal';
  @Input() xsMode: 'column' | 'column-reverse' | 'row' = 'column-reverse';
  inDialogActions = false;

  constructor(
    private el: ElementRef,
    private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
    if (this.root === '' || this.root === 'true') {
      this.root = true;
    }
    if (this.reverse === '' || this.reverse === 'true') {
      this.reverse = true;
    }
  }

  ngAfterViewInit() {
    if (this.el && this.el.nativeElement) {
      let el = this.el.nativeElement;
      while (el != null && el.tagName !== 'HTML') {
        if (el.tagName === 'MAT-DIALOG-ACTIONS') {
          this.inDialogActions = true;
          break;
        }
        el = el.parentElement;
      }
    }
    // Set some defaults when inside a dialog actions section
    if (this.inDialogActions) {
      this.topMargin = 'half';
      this.buttonSpace = 'equidistant';
      this.xsMode = 'row';
      this.root = true;
      this.changeDetector.detectChanges();
    }
  }

}
