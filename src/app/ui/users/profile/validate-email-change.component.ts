import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ValidationService } from 'app/api/services/validation.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

/**
 * Component shown after the user clicks the received link to
 * validate a new e-mail
 */
@Component({
  selector: 'validate-email-change',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidateEmailChangeComponent
  extends BasePageComponent<boolean>
  implements OnInit {

  get userId() {
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
    this.addSub(this.validationService.validateEmailChange({ key }).subscribe(() => {
      this.notification.snackBar(this.i18n.user.newEmailConfirmed);
      this.router.navigate(['/users', 'self', 'profile']);
    }));
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }

  resolveMenu() {
    return this.menu.homeMenu();
  }
}
