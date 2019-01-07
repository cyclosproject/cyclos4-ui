import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UsersService } from 'app/api/services';
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
    private usersService: UsersService
  ) {
    super(injector);
  }

  ngOnInit() {
    const key = this.route.snapshot.params.key;
    this.usersService.validateEmailChange(key).subscribe(result => {
      if (this.login.user && this.login.user.id !== result) {
        // Was logged-in as a different user
        this.login.logout();
        this.notification.info(this.messages.user.newEmailConfirmed);
      } else {
        // Show the page normally
        this.data = result;
      }
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
