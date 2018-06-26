import { Directive, ElementRef, AfterViewInit, ChangeDetectorRef, Input, Optional, OnInit } from '@angular/core';
import { MatSelect, MatInput } from '@angular/material';
import { PageLayoutComponent } from 'app/shared/page-layout.component';

@Directive({ selector: 'mat-select[focused],input[focused],select[focused],textarea[focused]' })
export class FocusedDirective implements OnInit, AfterViewInit {
  constructor(
    private el: ElementRef,
    @Optional() private select: MatSelect,
    @Optional() private input: MatInput,
    @Optional() private pageLayout: PageLayoutComponent,
    private changeDetector: ChangeDetectorRef
  ) { }

  @Input()
  focused: string | boolean;

  ngOnInit() {
    if (this.pageLayout) {
      this.pageLayout.filtersShown.subscribe(filtersVisible => {
        if (filtersVisible) {
          this.setFocus();
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.setFocus();
  }

  private setFocus() {
    if (this.focused === '' || this.focused === true || this.focused === 'true') {
      const run = () => {
        if (this.select != null) {
          this.select.focus();
        } else if (this.input != null) {
          this.input.focus();
        } else {
          this.el.nativeElement.focus();
          this.changeDetector.detectChanges();
        }
      };
      if (this.el.nativeElement.clientWidth === 0) {
        // The field is still hidden
        setTimeout(run, 100);
      } else {
        // The field is visible - invoke directly
        run();
      }
    }
  }
}
