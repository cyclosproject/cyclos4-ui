import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Component shown after the user clicks the received link to
 * validate the user registration
 */
@Component({
  selector: 'validate-registration',
  templateUrl: 'validate-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidateRegistrationComponent
  extends BasePageComponent<UserRegistrationResult>
  implements OnInit {

  get result() {
    return this.data;
  }

  constructor(
    injector: Injector,
    private usersService: UsersService
  ) {
    super(injector);
  }

  ngOnInit() {
    const key = this.route.snapshot.params.key;
    this.addSub(this.usersService.validateUserRegistration({ key: key }).subscribe(result => {
      this.data = result;
    }));
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }
}
