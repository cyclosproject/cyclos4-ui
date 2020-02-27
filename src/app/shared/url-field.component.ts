import { ChangeDetectionStrategy, Component, ElementRef, Host, Injector, Input, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty } from 'app/shared/helper';

/**
 * Component used to enter a URL value.
 * If the value isn't prepended by the scheme, http:// is automatically added
 */
@Component({
  selector: 'url-field',
  templateUrl: 'url-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: UrlFieldComponent, multi: true }
  ]
})
export class UrlFieldComponent
  extends BaseFormFieldComponent<string> {

  /** A placeholder to be shown inside the component */
  @Input() placeholder = '';

  /** Name of the autocomplete value for the HTML input */
  @Input() autocomplete = 'off';

  @ViewChild('input', { static: false }) inputRef: ElementRef;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  get input(): HTMLInputElement {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

  preprocessValue(value: any): string {
    return this.ensureScheme(value);
  }

  onValueInitialized(value: string) {
    // As a workaround to https://github.com/angular/angular/issues/13792, manually update the input value
    const input = this.input;
    if (input) {
      input.value = value;
    }
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.inputRef && this.inputRef.nativeElement) {
      this.inputRef.nativeElement.disabled = isDisabled;
    }
  }

  updateValue() {
    const value = this.value;
    const url = this.ensureScheme(value);
    if (value !== url) {
      this.value = url;
      this.input.value = url;
    }
  }

  protected getFocusableControl() {
    return (<any>(this.inputRef || {})).nativeElement;
  }

  protected getDisabledValue(): string {
    return this.value;
  }

  private ensureScheme(value: any): string {
    if (empty(value)) {
      return null;
    }
    const url = String(value);
    if (!url.includes('://')) {
      return 'http://' + url;
    }
    return url;
  }
}
