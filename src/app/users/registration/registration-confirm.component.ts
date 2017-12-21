import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { UserDataForNew } from 'app/api/models';
import { FormGroup, FormArray } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { empty } from 'app/shared/helper';

/**
 * Provides the input for the password, captcha and agreement
 */
@Component({
  selector: 'registration-confirm',
  templateUrl: 'registration-confirm.component.html',
  styleUrls: ['registration-confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationConfirmComponent extends BaseUsersComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  form: FormGroup;

  @Input()
  data: UserDataForNew;

  passwordsForm(i: number) {
    const passwords = this.form.get('passwords');
    if (passwords instanceof FormArray) {
      return passwords.controls[i];
    }
    throw new Error('No such password form');
  }

  get requiredSecurityAnswer(): BehaviorSubject<boolean> {
    const question = this.form.get('securityQuestion');
    const subj = new BehaviorSubject(!empty(question.value));
    this.subscriptions.push(question.valueChanges.subscribe(value => {
      subj.next(!empty(value));
    }));
    return subj;
  }
}
