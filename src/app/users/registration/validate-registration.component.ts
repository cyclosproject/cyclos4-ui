import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from 'app/api/services';

/**
 * Component shown after the user clicks the received link to
 * validate the user registration
 */
@Component({
  selector: 'validate-registration',
  templateUrl: 'validate-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidateRegistrationComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);
  result = new BehaviorSubject<UserRegistrationResult>(null);

  constructor(
    injector: Injector,
    private usersService: UsersService
  ) {
    super(injector);
  }

  ngOnInit() {
    const key = this.route.snapshot.params.key;
    this.usersService.validateUserRegistration({ key: key }).subscribe(result => {
      this.loaded.next(true);
      this.result.next(result);
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
