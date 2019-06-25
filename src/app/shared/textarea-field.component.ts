import {
  Component, Input, ChangeDetectionStrategy, SkipSelf, Host, Optional,
  ViewChild, ElementRef, AfterViewInit, Injector
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import autosize from 'autosize';

/**
 * Component used to display a text area
 */
@Component({
  selector: 'textarea-field',
  templateUrl: 'textarea-field.component.html',
  styleUrls: ['textarea-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: TextAreaFieldComponent, multi: true }
  ]
})
export class TextAreaFieldComponent
  extends BaseFormFieldComponent<string> implements AfterViewInit {

  /** A placeholder to be shown inside the component */
  @Input() placeholder = '';

  @ViewChild('textarea', { static: false }) textareaRef: ElementRef;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.textareaRef && this.textareaRef.nativeElement) {
      this.textareaRef.nativeElement.disabled = isDisabled;
    }
  }

  ngAfterViewInit() {
    if (this.textareaRef && this.textareaRef.nativeElement) {
      const textarea = this.textareaRef.nativeElement;
      autosize(textarea);
      // As update sometimes changes the height, ensure that nothing jumps by initially updating
      setTimeout(() => autosize.update(textarea), 1);
    }
  }

  protected getFocusableControl() {
    return (<any>(this.textareaRef || {})).nativeElement;
  }

  protected getDisabledValue(): string {
    return this.value;
  }

  notifyValueChange(value: string) {
    super.notifyValueChange(value);
    if (this.textareaRef && this.textareaRef.nativeElement) {
      autosize.update(this.textareaRef.nativeElement);
    }
  }
}
