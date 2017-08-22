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
    if (this.focused == '' || this.focused === true || this.focused === 'true') {
      this.renderer.invokeElementMethod(this.el.nativeElement, 'focus', []);
      this.changeDetector.detectChanges();
    }
  }
}