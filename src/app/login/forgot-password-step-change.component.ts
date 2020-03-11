import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataForChangeForgottenPassword } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Forgot password step: display the user principals and change password
 */
@Component({
  selector: 'forgot-password-step-change',
  templateUrl: 'forgot-password-step-change.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordStepChangeComponent
  extends BaseComponent {

  @Input() data: DataForChangeForgottenPassword;
  @Input() form: FormGroup;

  constructor(injector: Injector) {
    super(injector);
  }

}
