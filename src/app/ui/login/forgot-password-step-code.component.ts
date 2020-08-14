import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Forgot password step: input the code received by e-mail / SMS
 */
@Component({
  selector: 'forgot-password-step-code',
  templateUrl: 'forgot-password-step-code.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordStepCodeComponent
  extends BaseComponent {

  @Input() form: FormGroup;

  constructor(injector: Injector) {
    super(injector);
  }

}
