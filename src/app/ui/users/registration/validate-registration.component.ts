import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
import { ValidationService } from 'app/api/services';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

/**
 * Component shown after the user clicks the received link to
 * validate the user registration
 */
@Component({
  selector: 'validate-registration',
  templateUrl: 'validate-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidateRegistrationComponent
  extends BasePageComponent<UserRegistrationResult>
  implements OnInit {

  get result() {
    return this.data;
  }

  constructor(
    injector: Injector,
    private validationService: ValidationService,
  ) {
    super(injector);
  }

  ngOnInit() {
    const key = this.route.snapshot.params.key;
    this.addSub(this.validationService.validateUserRegistration({ key }).subscribe(result => {
      this.data = result;
    }));
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }

  resolveMenu() {
    return this.menu.homeMenu();
  }
}
