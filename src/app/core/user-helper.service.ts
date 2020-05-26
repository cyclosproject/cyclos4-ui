import { Injectable } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  AvailabilityEnum, BasicUserDataForNew, OperatorDataForNew, OperatorGroupAccountAccessEnum,
  ProfileFieldActions, User, UserBasicData, UserDataForNew, UserStatusEnum,
} from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { LoginService } from 'app/core/login.service';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';

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

/**
 * Helper for user-related data
 */
@Injectable({
  providedIn: 'root',
})
export class UserHelperService {

  constructor(
    private fieldHelper: FieldHelperService,
    private i18n: I18n,
    private formBuilder: FormBuilder,
    private login: LoginService) {
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
  setupRegistrationForm(form: FormGroup, data: UserDataForNew | OperatorDataForNew,
                        serverSideValidator?: (name: string) => AsyncValidatorFn): [FormGroup, FormGroup] {
    serverSideValidator = serverSideValidator || (() => null);
    const user = data['operator'] || data.user;

    // Full name
    const nameActions = data.profileFieldActions.name;
    if (nameActions && nameActions.edit) {
      form.setControl('name',
        this.formBuilder.control(user.name, Validators.required, serverSideValidator('name')),
      );
    }
    // Login name
    const usernameActions = data.profileFieldActions.username;
    if (usernameActions && usernameActions.edit && !data.generatedUsername) {
      form.setControl('username',
        this.formBuilder.control(user.username, Validators.required, serverSideValidator('username')),
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
        this.formBuilder.control(user.email, val, serverSideValidator('email')),
      );
      if (data.allowSetSendActivationEmail) {
        form.setControl('skipActivationEmail', this.formBuilder.control(user.skipActivationEmail));
      }
    }

    // Custom fields
    form.setControl('customValues',
      this.fieldHelper.customValuesFormGroup(data.customFields, {
        asyncValProvider: cf => serverSideValidator(cf.internalName),
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
        number: [phone.number, val, serverSideValidator('mobilePhone')],
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
        number: [phone.number, val, serverSideValidator('landLinePhone')],
        hidden: phone.hidden,
      });
      if (phoneConfiguration.extensionEnabled) {
        landLineForm.setControl('extension', this.formBuilder.control(phone.extension));
      }
    }

    return [mobileForm, landLineForm];
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

}
