import { Directive, ElementRef, Renderer, AfterViewInit, ChangeDetectorRef, Input } from '@angular/core';

@Directive({ selector: 'input[focused],select[focused],textarea[focused]' })
export class FocusedDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer,
    private changeDetector: ChangeDetectorRef
  ) { }

  @Input()
  focused: string | boolean;

  ngAfterViewInit(): void {
    if (this.focused === '' || this.focused === true || this.focused === 'true') {
      const run = () => {
        this.renderer.invokeElementMethod(this.el.nativeElement, 'focus', []);
        this.changeDetector.detectChanges();
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
