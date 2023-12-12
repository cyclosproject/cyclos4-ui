import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
import { ValidationService } from 'app/api/services/validation.service';
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

  public result: UserRegistrationResult;

  constructor(
    injector: Injector,
    private validationService: ValidationService,
  ) {
    super(injector);
  }

  ngOnInit() {
    this.result = this.stateManager.getGlobal('result');
    const key = this.route.snapshot.params.key;
    if (key) {
      this.addSub(this.validationService.validateUserRegistration({ key }).subscribe(result => {
        this.stateManager.setGlobal('result', result);
        this.router.navigate(['/users', 'validate-registration']);
      }));
    } else if (this.result) {
      this.data = this.result;
    } else {
      this.goToLogin();
    }
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }

  resolveMenu() {
    return this.menu.homeMenu();
  }
}
