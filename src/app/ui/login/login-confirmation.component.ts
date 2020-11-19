import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CreateDeviceConfirmation, DeviceConfirmationTypeEnum, PasswordInput } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { LoginState } from 'app/ui/core/login-state';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Component shown if the user should confirm the login, either with a secondary password or trusted device
 */
@Component({
  selector: 'login-confirmation',
  templateUrl: 'login-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginConfirmationComponent
  extends BasePageComponent<PasswordInput>
  implements OnInit {

  ConfirmationMode = ConfirmationMode;

  control = new FormControl(null, Validators.required);
  canConfirm: boolean;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  get passwordInput() {
    return this.data;
  }

  constructor(
    injector: Injector,
    private authService: AuthService,
    private loginState: LoginState,
  ) {
    super(injector);
  }

  ngOnInit() {
    const auth = this.dataForFrontendHolder.auth || {};
    if (!auth.pendingSecondaryPassword) {
      this.router.navigate(['']);
      return;
    }
    super.ngOnInit();
    this.addSub(this.authService.getSecondaryPasswordInput().subscribe(input => this.data = input));
    this.createDeviceConfirmation = () => {
      return { type: DeviceConfirmationTypeEnum.SECONDARY_LOGIN };
    };
  }

  onDataInitialized(input: PasswordInput) {
    this.canConfirm = this.authHelper.canConfirm(input);
  }

  submit(value: string = null) {
    if (!value && !validateBeforeSubmit(this.control)) {
      return;
    }
    this.addSub(this.authService.validateSecondaryPassword({
      body: value || this.control.value
    }).subscribe(() => this.reload()));
  }

  reload() {
    this.dataForFrontendHolder.reload().pipe(first()).subscribe(() => this.router.navigateByUrl(this.loginState.redirectUrl || ''));
  }

  cancel() {
    // Logout and return to the login page
    this.login.logout();
  }

  resolveMenu() {
    return Menu.DASHBOARD;
  }
}
