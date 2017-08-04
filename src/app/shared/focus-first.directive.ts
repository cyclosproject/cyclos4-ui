import { Directive, ElementRef, Renderer, AfterViewInit, ChangeDetectorRef } from '@angular/core';

@Directive({ selector: 'form[focusFirst]' })
export class FocusFirstDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    let elements = this.el.nativeElement.elements;
    if (elements.length > 0) {
      let input = elements[0];
      this.renderer.invokeElementMethod(input, 'focus', []);
      this.changeDetector.detectChanges();
    }
  }

}