import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsentState } from 'app/consent/consent-state';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { validateBeforeSubmit } from 'app/shared/helper';

/**
 * Display the consent form
 */
@Component({
  selector: 'consent-form',
  templateUrl: 'consent-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsentFormComponent implements OnInit {

  form: FormGroup;

  constructor(
    @Inject(I18nInjectionToken) public i18n: I18n,
    private formBuilder: FormBuilder,
    public state: ConsentState,
  ) {
  }

  ngOnInit() {
    const data = this.state.data;
    this.form = this.formBuilder.group({
      user: [data.loginHint || '', Validators.required],
      password: ['', Validators.required]
    });
  }

  get data() {
    return this.state.data;
  }

  get singleScope(): string {
    return this.data.scopes.length === 1 ? this.data.scopes[0] : null;
  }

  authorize() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const form = this.form.value;
    this.state.authorize(form.user, form.password);
  }
}
