import {
  ChangeDetectionStrategy, Component, Injector, Optional, Host, SkipSelf, OnInit, ViewChild, ElementRef
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR, FormGroup, FormBuilder } from '@angular/forms';
import { TimeInterval, TimeFieldEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty } from 'app/shared/helper';

/**
 * A field that allows to enter a time interval by specifing amount and field (days, months, etc)
 */
@Component({
  selector: 'time-interval-field',
  templateUrl: 'time-interval-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: TimeIntervalFieldComponent, multi: true }
  ]
})
export class TimeIntervalFieldComponent extends BaseFormFieldComponent<TimeInterval> implements OnInit {

  @ViewChild('inputField', { static: false }) private inputRef: ElementRef;

  form: FormGroup;

  constructor(injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private formBuilder: FormBuilder
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      amount: null,
      field: TimeFieldEnum.DAYS
    });
    this.addSub(this.form.valueChanges.subscribe(value => {
      if (empty(this.form.controls.amount == null)) {
        this.value = null;
      } else {
        this.value = value;
      }
    }));
  }

  protected getDisabledValue(): string {
    return this.format.formatTimeInterval(this.form.value);
  }

  protected getFocusableControl() {
    return this.inputRef ? this.inputRef.nativeElement : null;
  }

}
