import { Inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  AddressConfigurationForUserProfile, AvailabilityEnum, BasicUserDataForNew, OperatorDataForNew,
  OperatorGroupAccountAccessEnum, ProfileFieldActions, TokenStatusEnum, User,
  UserBasicData, UserDataForNew, UserRegistrationResult, UserRegistrationStatusEnum, UserStatusEnum
} from 'app/api/models';
import { UsersService } from 'app/api/services/users.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { LoginService } from 'app/ui/core/login.service';
import { Observable, of, Subscription, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

/** Validator function that ensures password and confirmation match */
const PASSWORDS_MATCH_VAL: ValidatorFn = control => {
  const currVal = control.value;
  if (control.touched && !empty(currVal)) {
    const parent = control.parent;
    const origVal = parent.get('value') == null ? '' : parent.get('value').value;
    if (origVal !== currVal) {
      return {
        passwordsMatch: true,
      };
    }
  }
  return null;
};

/** Validator function that ensures password and confirmation match */
const SEGURITY_ANSWER_VAL: ValidatorFn = control => {
  if (control.touched) {
    const parent = control.parent;
    const question = parent.get('securityQuestion') == null ? '' : parent.get('securityQuestion').value;
    const answer = control.value;
    if (question != null && question !== '' && (answer == null || answer === '')) {
      return {
        required: true,
      };
    }
  }
  return null;
};

/**
 * Helper for user-related data
 */
@Injectable({
  providedIn: 'root',
})
export class UserHelperService {

  constructor(
    private fieldHelper: FieldHelperService,
    @Inject(I18nInjectionToken) private i18n: I18n,
    private formBuilder: FormBuilder,
    private addressHelper: AddressHelperService,
    private login: LoginService,
    private usersService: UsersService) {
  }

  /**
   * Indicates whether the given user reference is an operator
   * @param user The user to test
   */
  isOperator(user: User): boolean {
    return user && !!user.user;
  }

  /**
   * Sets the form fields which are common for user / operator registration
   * @returns An array with both mobile and land-line forms
   */
  setupRegistrationForm(
    form: FormGroup, data: UserDataForNew | OperatorDataForNew,
    validateServerSide: boolean): [FormGroup, FormGroup] {

    const group = form.controls.group.value;
    const user = data['operator'] || data.user;

    // Full name
    const nameActions = data.profileFieldActions.name;
    if (nameActions && nameActions.edit) {
      form.setControl('name',
        this.formBuilder.control(user.name, Validators.required,
          validateServerSide ? this.serverSideValidator(group, 'name') : null),
      );
    }
    // Login name
    const usernameActions = data.profileFieldActions.username;
    if (usernameActions && usernameActions.edit && !data.generatedUsername) {
      form.setControl('username',
        this.formBuilder.control(user.username, Validators.required,
          validateServerSide ? this.serverSideValidator(group, 'username') : null),
      );
    }
    // E-mail
    const emailActions = data.profileFieldActions.email;
    if (emailActions && emailActions.edit) {
      const val = [];
      if (data.emailRequired) {
        val.push(Validators.required);
      }
      val.push(Validators.email);
      form.setControl('email',
        this.formBuilder.control(user.email, val,
          validateServerSide ? this.serverSideValidator(group, 'email') : null),
      );
      if (data.allowSetSendActivationEmail) {
        form.setControl('skipActivationEmail', this.formBuilder.control(user.skipActivationEmail));
      }
    }

    // Custom fields
    form.setControl('customValues',
      this.fieldHelper.customValuesFormGroup(data.customFields, {
        asyncValProvider: validateServerSide ? cf => this.serverSideValidator(group, cf.internalName) : null,
      }));

    // Phones
    const phoneConfiguration = data.phoneConfiguration;

    // Mobile
    const mobileAvailability = phoneConfiguration.mobileAvailability;
    let mobileForm: FormGroup = null;
    if (mobileAvailability !== AvailabilityEnum.DISABLED) {
      const val = mobileAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.mobilePhone;
      mobileForm = this.formBuilder.group({
        name: phone.name,
        number: [phone.number, val, validateServerSide ? this.serverSideValidator(group, 'mobilePhone') : null],
        hidden: phone.hidden,
      });
    }

    // Land-line
    const landLineAvailability = phoneConfiguration.landLineAvailability;
    let landLineForm: FormGroup = null;
    if (landLineAvailability !== AvailabilityEnum.DISABLED) {
      const val = landLineAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.landLinePhone;
      landLineForm = this.formBuilder.group({
        name: phone.name,
        number: [phone.number, val, validateServerSide ? this.serverSideValidator(group, 'landLinePhone') : null],
        hidden: phone.hidden,
      });
      if (phoneConfiguration.extensionEnabled) {
        landLineForm.setControl('extension', this.formBuilder.control(phone.extension));
      }
    }

    return [mobileForm, landLineForm];
  }

  /**
   * Returns an async validator for a given registration field in a given group
   */
  private serverSideValidator(group: string, field: string): AsyncValidatorFn {
    if (this.login.user) {
      // These async providers only work for guests
      return null;
    }
    return (c: AbstractControl): Observable<ValidationErrors | null> => {
      let val = c.value;
      if (empty(val) || !c.dirty) {
        // Don't validate empty value (will fail validation required), nor fields that haven't been modified yet
        return of(null);
      }

      // Multi selections hold the value as array, but we must pass it as pipe-separated
      if (val instanceof Array) {
        val = val.join('|');
      }

      return timer(ApiHelper.DEBOUNCE_TIME).pipe(
        switchMap(() => {
          return this.usersService.validateUserRegistrationField({
            group, field, value: val,
          });
        }),
        map(msg => {
          return msg ? { message: msg } : null;
        }),
      );
    };
  }

  /**
   * Returns both a FormGroup for the address fields and a control indicating whether the address is defined,
   * according to the given configuration. When the configuration disables addresses, both are null.
   * Also returns an array of subscriptions, which should be unsubscribed when the calling component is disposed.
   */
  registrationAddressForm(configuration: AddressConfigurationForUserProfile): [FormGroup, FormControl, Subscription[]] {
    const addressAvailability = configuration.availability;
    let addressForm: FormGroup = null;
    let defineControl: FormControl = null;
    const subscriptions: Subscription[] = [];
    if (addressAvailability !== AvailabilityEnum.DISABLED) {
      defineControl = this.formBuilder.control(addressAvailability === AvailabilityEnum.REQUIRED);
      addressForm = this.addressHelper.addressFormGroup(configuration);
      const address = configuration.address;
      addressForm.patchValue(address);
      // When any of the fields change, clear the location
      for (const field of configuration.enabledFields) {
        let previous = address[field] || null;
        subscriptions.push(addressForm.get(field).valueChanges.subscribe(newVal => {
          if (previous !== newVal) {
            addressForm.get('location').patchValue({ latitude: null, longitude: null });
          }
          previous = newVal;
        }));
      }
    }
    return [addressForm, defineControl, subscriptions];
  }

  /**
   * Returns an array of FormGroups for each password that is set for registration
   */
  passwordRegistrationForms(data: UserDataForNew | OperatorDataForNew): FormGroup[] {
    const passwordControls: FormGroup[] = [];
    const isDefined = this.login.user == null;
    for (const pt of data.passwordTypes) {
      const group = this.formBuilder.group({
        type: ApiHelper.internalNameOrId(pt),
        checkConfirmation: true,
        defined: isDefined,
        forceChange: false,
        value: ['', isDefined ? Validators.required : null],
        confirmationValue: ['', isDefined
          ? Validators.compose([Validators.required, PASSWORDS_MATCH_VAL]) : null],
      });
      group.controls.defined.valueChanges.subscribe(defined => {
        if (defined) {
          group.controls.value.setValidators(Validators.required);
          group.controls.confirmationValue.setValidators(Validators.compose([Validators.required, PASSWORDS_MATCH_VAL]));
        } else {
          group.controls.value.setErrors(null);
          group.controls.value.setValidators(null);
          group.controls.confirmationValue.setErrors(null);
          group.controls.confirmationValue.setValidators(null);
        }
      });
      passwordControls.push(group);
    }
    return passwordControls;
  }

  /** Returns a validation for the security answer */
  get securityAnswerValidation() {
    return SEGURITY_ANSWER_VAL;
  }

  /**
   * Returns the field names marked for a given action
   * @param data The user data
   */
  fieldNamesByAction(data: UserBasicData, action: keyof ProfileFieldActions): Set<string> {
    const fields = new Set<string>();
    const generatedUsername = (data as BasicUserDataForNew).generatedUsername;
    for (const name of Object.keys(data.profileFieldActions)) {
      if (name === 'username' && generatedUsername) {
        // No actions on username on registration if generated
        continue;
      }
      const actions = data.profileFieldActions[name];
      if (actions[action]) {
        fields.add(name);
      }
    }
    return fields;
  }

  /**
   * Returns the options with all user statuses
   */
  statusOptions(): FieldOption[] {
    const statuses = Object.values(UserStatusEnum) as UserStatusEnum[];
    return statuses.map(s => ({ value: s, text: this.userStatus(s) } as FieldOption));
  }

  /**
   * Returns the user status display
   */
  userStatus(status: UserStatusEnum): string {
    switch (status) {
      case UserStatusEnum.ACTIVE:
        return this.i18n.userStatus.active;
      case UserStatusEnum.BLOCKED:
        return this.i18n.userStatus.blocked;
      case UserStatusEnum.DISABLED:
        return this.i18n.userStatus.disabled;
      case UserStatusEnum.PENDING:
        return this.i18n.userStatus.pending;
      case UserStatusEnum.PURGED:
        return this.i18n.userStatus.purged;
      case UserStatusEnum.REMOVED:
        return this.i18n.userStatus.removed;
    }
  }

  /**
   * Returns the operator group access display
   */
  operatorGroupAccountAccess(access: OperatorGroupAccountAccessEnum): string {
    switch (access) {
      case OperatorGroupAccountAccessEnum.FULL:
        return this.i18n.operatorGroup.accountAccessFull;
      case OperatorGroupAccountAccessEnum.INCOMING:
        return this.i18n.operatorGroup.accountAccessIncoming;
      case OperatorGroupAccountAccessEnum.OUTGOING:
        return this.i18n.operatorGroup.accountAccessOutgoing;
      case OperatorGroupAccountAccessEnum.OWN:
        return this.i18n.operatorGroup.accountAccessOwn;
      case OperatorGroupAccountAccessEnum.NONE:
        return this.i18n.operatorGroup.accountAccessNone;
    }
  }

  /**
   * Returns the token status display
   */
  tokenStatus(status: TokenStatusEnum): string {
    switch (status) {
      case TokenStatusEnum.ACTIVATION_EXPIRED:
        return this.i18n.token.status.activationExpired;
      case TokenStatusEnum.ACTIVE:
        return this.i18n.token.status.active;
      case TokenStatusEnum.BLOCKED:
        return this.i18n.token.status.blocked;
      case TokenStatusEnum.CANCELED:
        return this.i18n.token.status.canceled;
      case TokenStatusEnum.EXPIRED:
        return this.i18n.token.status.expired;
      case TokenStatusEnum.PENDING:
        return this.i18n.token.status.pending;
      case TokenStatusEnum.UNASSIGNED:
        return this.i18n.token.status.unassigned;
    }
  }

  /**
   * Returns a HTML message that is displayed for a successful registration
   */
  registrationMessageHtml(result: UserRegistrationResult, manager: boolean): string {
    const user = result.user.display;
    switch (result.status) {
      case UserRegistrationStatusEnum.ACTIVE:
        return manager ? this.i18n.user.registration.activeManager(user) : this.i18n.user.registration.activePublic;
      case UserRegistrationStatusEnum.INACTIVE:
        return manager ? this.i18n.user.registration.inactiveManager(user) : this.i18n.user.registration.inactivePublic;
      case UserRegistrationStatusEnum.EMAIL_VALIDATION:
        return manager ? this.i18n.user.registration.pendingManager(user) : this.i18n.user.registration.pendingPublic;
    }
  }

  /**
   * Returns a HTML message for the principals and channels
   */
  registrationPrincipalsHtml(result: UserRegistrationResult): string {
    const principals = result.principals;
    if (principals == null || principals.length === 0) {
      return '';
    }
    if (principals.length === 1) {
      const principal = principals[0];
      return this.i18n.user.registration.principalSingle({
        principal: principal.type.name,
        value: principal.value,
        channels: principal.channels.map(c => c.name).join(', '),
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
        channels: principal.channels.map(c => c.name).join(', '),
      }));
      buf.push('</li>');
    }
    buf.push('</ul>');
    return buf.join('');
  }

  /**
   * Returns a message for generated passwords which is displayed on registration
   */
  registrationPasswordsMessage(result: UserRegistrationResult): string {
    const passwords = result.generatedPasswords;
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

  /**
   * Returns whether the 2 given phone numbers match
   */
  phoneNumberMatches(a: string, b: string): boolean {
    const length = 7;
    a = (a || '').replace(/[^0-9]/g, '');
    b = (b || '').replace(/[^0-9]/g, '');
    a = a.substring(a.length - length);
    b = b.substring(b.length - length);
    return a === b;
  }

}
