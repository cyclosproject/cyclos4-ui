import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { UserRegistrationResult } from 'app/api/models';
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
  extends BaseComponent
  implements OnInit {

  @Input() result: UserRegistrationResult;

  constructor(injector: Injector) {
    super(injector);
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
      return this.i18n('You can use your {{principal}} ({{value}}) on {{channels}}', {
        principal: principal.type.name,
        value: principal.value,
        channels: principal.channels.map(c => c.name).join(', ')
      });
    }
    const buf: string[] = [];
    buf.push(this.i18n('You can login with the following data:'));
    buf.push('<ul>');
    for (const principal of principals) {
      buf.push('<li>');
      buf.push(this.i18n('<b>{{principal}}</b> ({{value}}): can be used on {{channels}}', {
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
      return this.i18n('You can now login with the password you have informed');
    } else if (passwords.length === 1) {
      const password = passwords[0];
      return this.i18n('You will receive an e-mail shortly with your generated {{type}}', {
        type: password.name
      });
    } else {
      return this.i18n('You will receive an e-mail shortly with the following generated passwords: {{types}}', {
        types: passwords.map(p => p.name).join(', ')
      });
    }
  }
}
