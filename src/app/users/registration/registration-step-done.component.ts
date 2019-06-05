import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { UserRegistrationResult, UserRegistrationStatusEnum } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';

/**
 * Public registration step: done
 */
@Component({
  selector: 'registration-step-done',
  templateUrl: 'registration-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationStepDoneComponent
  extends BaseComponent {

  @Input() result: UserRegistrationResult;

  constructor(
    injector: Injector) {
    super(injector);
  }

  get messageHtml(): string {
    const manager = !!this.login.user;
    const user = this.result.user.display;
    switch (this.result.status) {
      case UserRegistrationStatusEnum.ACTIVE:
        return manager ? this.i18n.user.registration.activeManager(user) : this.i18n.user.registration.activePublic;
      case UserRegistrationStatusEnum.INACTIVE:
        return manager ? this.i18n.user.registration.inactiveManager(user) : this.i18n.user.registration.inactivePublic;
      case UserRegistrationStatusEnum.EMAIL_VALIDATION:
        return manager ? this.i18n.user.registration.pendingManager(user) : this.i18n.user.registration.pendingPublic;
    }
  }

  /**
   * Returns the message regarding principals, HTML-formatted
   */
  get principalsHtml(): string {
    const principals = this.result.principals;
    if (principals == null || principals.length === 0) {
      return '';
    }
    if (principals.length === 1) {
      const principal = principals[0];
      return this.i18n.user.registration.principalSingle({
        principal: principal.type.name,
        value: principal.value,
        channels: principal.channels.map(c => c.name).join(', ')
      });
    }
    const buf: string[] = [];
    buf.push(this.i18n.user.registration.principalMultiplePreface);
    buf.push('<ul>');
    for (const principal of principals) {
      buf.push('<li>');
      buf.push(this.i18n.user.registration.principalMultipleItem({
        principal: principal.type.name,
        value: principal.value,
        channels: principal.channels.map(c => c.name).join(', ')
      }));
      buf.push('</li>');
    }
    buf.push('</ul>');
    return buf.join('');
  }

  get passwordsMessage(): string {
    const passwords = this.result.generatedPasswords;
    if (empty(passwords)) {
      return this.i18n.user.registration.generatedPasswordsNone;
    } else if (passwords.length === 1) {
      const password = passwords[0];
      return this.i18n.user.registration.generatedPasswordsSingle(password.name);
    } else {
      return this.i18n.user.registration.generatedPasswordsMultiple(
        passwords.map(p => p.name).join(', '));
    }
  }
}
