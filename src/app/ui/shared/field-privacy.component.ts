import { ChangeDetectionStrategy, Component, HostBinding, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { truthyAttr } from 'app/shared/helper';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
import { BehaviorSubject } from 'rxjs';

/**
 * A widget that switches between field visibilities.
 * Has 2 working modes:
 * - If a field is given, assumes the control value is an array with the field names of hidden fields
 * - If no field is given, assumes the control value is the boolean for hidden (true) or public (false)
 */
@Component({
  selector: 'field-privacy',
  templateUrl: 'field-privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldPrivacyComponent implements OnInit {
  private _justifyStart: boolean | string = false;
  @Input() get justifyStart(): boolean | string {
    return this._justifyStart;
  }
  set justifyStart(justify: boolean | string) {
    this._justifyStart = truthyAttr(justify);
    this.updateClass();
  }
  @Input() field: string;
  @Input() control: FormControl;
  @ViewChild('ttip', { static: true }) ttip: TooltipDirective;

  @HostBinding('class') clazz;

  icon$ = new BehaviorSubject<string>(null);

  constructor(@Inject(I18nInjectionToken) private i18n: I18n) {
  }

  ngOnInit() {
    this.updateClass();
  }

  private updateClass() {
    this.clazz = 'h-100 d-flex flex-column align-items-center' + (this._justifyStart ? 'justify-content-start' : 'justify-content-end');
  }

  get hidden(): boolean {
    if (this.field) {
      const hiddenFields = this.control.value as string[] || [];
      return hiddenFields.includes(this.field);
    } else {
      return this.control.value === true;
    }
  }

  get icon(): SvgIcon {
    return this.hidden ? SvgIcon.EyeSlash : SvgIcon.Eye;
  }

  toggle() {
    if (this.field) {
      let hiddenFields = this.control.value as string[] || [];
      if (hiddenFields.includes(this.field)) {
        hiddenFields = hiddenFields.filter(el => el !== this.field);
      } else {
        hiddenFields = [...hiddenFields, this.field];
      }
      this.control.setValue(hiddenFields);
    } else {
      this.control.setValue(!this.control.value);
    }
    // Manually mark the control as touched because this field isn't a real NG_VALUE_ACCESSOR
    this.control.markAsTouched();
    this.ttip.hide();
  }

  get tooltip(): string {
    if (this.hidden) {
      return this.i18n.field.privacy.privateTooltip;
    } else {
      return this.i18n.field.privacy.publicTooltip;
    }
  }
}
