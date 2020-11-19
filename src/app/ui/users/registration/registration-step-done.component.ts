import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { LoginService } from 'app/ui/core/login.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';

/**
 * Public registration step: done
 */
@Component({
  selector: 'registration-step-done',
  templateUrl: 'registration-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepDoneComponent
  extends BaseComponent implements OnInit {

  @Input() result: UserRegistrationResult;

  messageHtml: string;
  principalsHtml: string;
  passwordsMessage: string;

  constructor(
    injector: Injector,
    public login: LoginService,
    private userHelper: UserHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const manager = !!this.dataForFrontendHolder.user;
    this.messageHtml = this.userHelper.registrationMessageHtml(this.result, manager);
    this.principalsHtml = this.userHelper.registrationPrincipalsHtml(this.result);
    this.passwordsMessage = this.userHelper.registrationPasswordsMessage(this.result);
  }
}
