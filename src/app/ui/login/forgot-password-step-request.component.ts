import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataForLogin, PrincipalTypeInput } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Forgot password step: send the request
 */
@Component({
  selector: 'forgot-password-step-request',
  templateUrl: 'forgot-password-step-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordStepRequestComponent
  extends BaseComponent implements OnInit {

  @Input() data: DataForLogin;
  @Input() form: FormGroup;

  principalTypes: PrincipalTypeInput[];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.principalTypes = [
      ...(this.data.extraForgotPasswordPrincipalTypes || []),
      ...(this.data.principalTypes || []),
    ];
  }

}
