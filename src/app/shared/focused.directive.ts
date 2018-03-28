import { Directive, ElementRef, AfterViewInit, ChangeDetectorRef, Input, Optional } from '@angular/core';
import { MatSelect, MatInput } from '@angular/material';

@Directive({ selector: 'mat-select[focused],input[focused],select[focused],textarea[focused]' })
export class FocusedDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    @Optional() private select: MatSelect,
    @Optional() private input: MatInput,
    private changeDetector: ChangeDetectorRef
  ) { }

  @Input()
  focused: string | boolean;

  ngAfterViewInit(): void {
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
