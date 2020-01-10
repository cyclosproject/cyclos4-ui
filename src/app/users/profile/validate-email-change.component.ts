import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ValidationService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Component shown after the user clicks the received link to
 * validate a new e-mail
 */
@Component({
  selector: 'validate-email-change',
  templateUrl: 'validate-email-change.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidateEmailChangeComponent
  extends BasePageComponent<string>
  implements OnInit {

  get userId() {
    return this.data;
  }

  constructor(
    injector: Injector,
    private validationService: ValidationService
  ) {
    super(injector);
  }

  ngOnInit() {
    const key = this.route.snapshot.params.key;
    this.addSub(this.validationService.validateEmailChange(key).subscribe(() => {
      if (this.login.user) {
        // Was logged-in as a different user
        this.login.logout();
        this.notification.info(this.i18n.user.newEmailConfirmed);
      } else {
        // Show the page normally
        this.data = '';
      }
    }));
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }

  resolveMenu() {
    return this.authHelper.homeMenu();
  }
}
