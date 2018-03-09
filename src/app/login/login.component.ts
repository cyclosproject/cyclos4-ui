import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { DataForLogin, GroupForRegistration } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { Menu } from 'app/shared/menu';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiInterceptor } from '../core/api.interceptor';
import { NextRequestState } from 'app/core/next-request-state';
import { RegistrationGroupsResolve } from '../registration-groups.resolve';
import { AuthService } from '../api/services';

/**
 * Component used to show a login form.
 * Also has a link to public registration.
 */
@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent extends BaseComponent {

  loginForm: FormGroup;

  loaded = new BehaviorSubject(false);
  dataForLogin: DataForLogin;
  registrationGroups: GroupForRegistration[];

  get canRegister(): boolean {
    return this.registrationGroups != null && this.registrationGroups.length > 0;
  }

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    private authService: AuthService,
    private nextRequestState: NextRequestState,
    private registrationGroupsResolve: RegistrationGroupsResolve
  ) {
    super(injector);
    this.loginForm = formBuilder.group({
      principal: '',
      password: ''
    });
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.nextRequestState.sessionToken != null) {
      this.router.navigateByUrl(this.login.redirectUrl || '');
    } else {
      this.registrationGroups = this.route.snapshot.data.registrationGroups;
      this.authService.getDataForLogin().subscribe(dataForLogin => {
        this.dataForLogin = dataForLogin;
        this.loaded.next(true);
      });
    }
  }

  /**
   * Performs the login
   */
  doLogin(): void {
    // When using the external login button there's no data, so we assume it comes from the login form
    if (!this.loginForm.valid) {
      return;
    }

    const value = this.loginForm.value;
    this.login.login(value.principal, value.password)
      .subscribe(u => {
        // Redirect to the correct URL
        this.router.navigateByUrl(this.login.redirectUrl || '');
      });
  }

  register(): void {
    this.router.navigate(['/users', 'registration']);
  }
}
