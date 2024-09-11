import { ChangeDetectionStrategy, Component, Host, Injector, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormArray,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { Agreement } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';

/**
 * Component used to accept agreements
 */
@Component({
  selector: 'accept-agreements',
  templateUrl: 'accept-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: AcceptAgreementsComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: AcceptAgreementsComponent, multi: true }
  ]
})
export class AcceptAgreementsComponent extends BaseFormFieldComponent<string[]> implements Validator, OnInit {
  @Input() agreements: Agreement[];
  agreementsControl: FormArray;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private formBuilder: FormBuilder
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();

    const initialIds: string[] = this.formControl.value || [];
    const agreements = this.agreements || [];
    const initialValue = agreements.map(a => initialIds.includes(a.id));
    this.agreementsControl = this.formBuilder.array(initialValue);

    this.addSub(
      this.agreementsControl.valueChanges.subscribe((flags: boolean[]) => {
        const accepted = agreements.filter((_, i) => flags[i]);
        this.setValue(accepted.map(a => a.id));
      })
    );
  }

  get acceptedAgreements(): Agreement[] {
    const acceptedIds = this.value || [];
    return this.agreements.filter(a => acceptedIds.includes(a.id));
  }

  protected getFocusableControl() {
    throw new Error('Method not implemented.');
  }

  protected getDisabledValue(): string {
    return this.acceptedAgreements
      .map(a => a.name)
      .sort()
      .join(', ');
  }

  /**
   * Make sure that al required agreements are accepted
   */
  validate(control: AbstractControl): ValidationErrors {
    const required = (this.agreements || []).filter(a => a.required);
    if (required.length > 0) {
      const ids = (control.value || []) as string[];
      for (const agreement of required) {
        if (!ids.includes(agreement.id)) {
          return {
            required: true
          };
        }
      }
    }
    return null;
  }
}
