import { ElementRef } from '@angular/core';
import { DefaultValueAccessor } from '@angular/forms';

/**
 * Base class for directives that operate over fields (both inputs and custom form fields).
 */
export abstract class BaseFieldDirective {
  constructor(private el: ElementRef, private valueAccessor: any) {}

  get field(): any {
    let result = null;
    if (this.valueAccessor instanceof Array) {
      result = this.valueAccessor[0];
    } else if (this.valueAccessor) {
      result = this.valueAccessor;
    } else if (this.el) {
      result = this.el;
    }
    if (result instanceof DefaultValueAccessor) {
      result = (result as any)._elementRef;
    }
    if (result instanceof ElementRef) {
      result = result.nativeElement;
    }
    return result;
  }
}
