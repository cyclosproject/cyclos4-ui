import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Inject, Input, Optional } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldDirective } from 'app/shared/base-field.directive';
import { truthyAttr, focus } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Input fields with this directive will receive an initial focus
 */
@Directive({
  selector: '[focused]'
})
export class FocusedDirective extends BaseFieldDirective implements AfterViewInit {
  constructor(
    private layout: LayoutService,
    @Optional() el: ElementRef,
    @Optional() @Inject(NG_VALUE_ACCESSOR) valueAccessor: any,
    private changeDetector: ChangeDetectorRef
  ) {
    super(el, valueAccessor);
  }

  _focused: boolean | string = false;
  @Input() get focused(): boolean | string {
    return this._focused;
  }
  set focused(focused: boolean | string) {
    this._focused = truthyAttr(focused);
  }

  ngAfterViewInit(): void {
    if (this._focused && this.layout.gtxs) {
      const field = this.field;
      if (field) {
        setTimeout(() => {
          focus(field);
          this.changeDetector.detectChanges();
        }, 100);
      }
    }
  }
}
