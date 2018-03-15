import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { UserRegistrationResult } from 'app/api/models';
import { escapeHtml } from 'app/shared/helper';

/**
 * Provides the input for the password, captcha and agreement
 */
@Component({
  selector: 'registration-done',
  templateUrl: 'registration-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationDoneComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  result: UserRegistrationResult;

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
      return this.messages.registrationDoneActiveSinglePrincipal(
        escapeHtml(principal.channels.map(c => c.name).join(', ')),
        escapeHtml(principal.type.name),
        escapeHtml(principal.value)
      );
    }
    const buf: string[] = [];
    buf.push(this.messages.registrationDoneActiveMultiplePrincipals());
    buf.push('<ul>');
    for (const principal of principals) {
      buf.push('<li>');
      buf.push(this.messages.registrationDoneActiveMultiplePrincipalsTemplate(
        escapeHtml(principal.channels.map(c => c.name).join(', ')),
        escapeHtml(principal.type.name),
        escapeHtml(principal.value)
      ));
      buf.push('</li>');
    }
    buf.push('</ul>');
    return buf.join('');
  }

  get passwordsMessage(): string {
    const passwords = this.result.generatedPasswords;
    if (passwords == null || passwords.length === 0) {
      return this.messages.registrationDoneActiveNoGeneratedPasswords();
    }
    if (passwords.length === 1) {
      const password = passwords[0];
      return this.messages.registrationDoneActiveSingleGeneratedPassword(password.name);
    }
    return this.messages.registrationDoneActiveMultipleGeneratedPasswords(
      passwords.map(p => p.name).join(', '));
  }
}
