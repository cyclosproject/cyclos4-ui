import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Inject, Input, Optional } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LayoutService } from 'app/core/layout.service';
import { NotificationService } from 'app/core/notification.service';
import { BaseFieldDirective } from 'app/shared/base-field.directive';
import { focus, truthyAttr } from 'app/shared/helper';

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
    private changeDetector: ChangeDetectorRef,
    private notification: NotificationService
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
      if (field && !this.notification.isOpen) {
        setTimeout(() => {
          focus(field);
          this.changeDetector.detectChanges();
        }, 100);
      }
    }
  }
}
