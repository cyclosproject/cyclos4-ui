import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { GeneralMessages } from 'app/messages/general-messages';
import { LoginService } from 'app/core/login.service';
import { DataForLogin } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup } from '@angular/forms';

/**
 * Displays the login form
 */
@Component({
  selector: 'login-form',
  templateUrl: 'login-form.component.html',
  styleUrls: ['login-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent extends BaseComponent {

  @Input()
  dataForLogin: DataForLogin;

  @Input()
  showActions: boolean;

  @Input()
  loginForm: FormGroup;

  @Output()
  submit = new EventEmitter<void>();

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  /**
   * Emits the current login data
   */
  emit(): void {
    this.submit.emit();
  }
}
