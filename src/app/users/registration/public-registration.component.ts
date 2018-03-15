import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import {
  FormGroup, FormBuilder, Validators, ValidatorFn, AsyncValidatorFn,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { GroupForRegistration } from 'app/api/models/group-for-registration';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiHelper } from 'app/shared/api-helper';
import { UsersService } from 'app/api/services/users.service';
import { UserDataForNew } from 'app/api/models';
import { LinearStepperControlComponent } from 'app/shared/linear-stepper-control.component';
import { TdStepComponent } from '@covalent/core';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { timer as observableTimer } from 'rxjs/observable/timer';
import { map } from 'rxjs/operators/map';
import { switchMap } from 'rxjs/operators/switchMap';
import { UserNew } from 'app/api/models/user-new';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { copyProperties, empty, getAllErrors } from 'app/shared/helper';
import { UserRegistrationResult } from 'app/api/models/user-registration-result';
import { AvailabilityEnum } from 'app/api/models/availability-enum';

/** Validator function that ensures password and confirmation match */
const PASSWORDS_MATCH_VAL: ValidatorFn = control => {
  const currVal = control.value;
  if (control.touched && currVal != null && currVal !== '') {
    const parent = control.parent;
    const origVal = parent.get('value') == null ? '' : parent.get('value').value;
    if (origVal !== currVal) {
      return {
        passwordsMatch: true
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
        required: true
      };
    }
  }
  return null;
};

@Component({
  selector: 'public-registration',
  templateUrl: './public-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicRegistrationComponent extends BaseUsersComponent implements AfterViewInit {
  loaded = new BehaviorSubject(false);

  @ViewChild('stepperControl')
  stepperControl: LinearStepperControlComponent;

  // Group step
  @ViewChild('groupStep') groupStep: TdStepComponent;
  groups: GroupForRegistration[];
  group = new BehaviorSubject<GroupForRegistration>(null);
  groupForm: FormGroup;

  // Fields step
  data = new BehaviorSubject<UserDataForNew>(null);
  @ViewChild('fieldsStep') fieldsStep: TdStepComponent;
  user: UserNew = {};
  fieldsForm: FormGroup;
  addressForm: FormGroup;
  fieldsValid = new BehaviorSubject(false);
  counter = new BehaviorSubject(0);

  // Confirmation step
  @ViewChild('confirmStep') confirmStep: TdStepComponent;
  confirmForm: FormGroup;

  // done step
  @ViewChild('doneStep') doneStep: TdStepComponent;
  result = new BehaviorSubject<UserRegistrationResult>(null);

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private usersService: UsersService) {
    super(injector);

    // Form for group selection
    this.groupForm = formBuilder.group({
      group: [null, Validators.required]
    });
    this.subscriptions.push(this.groupForm.valueChanges.subscribe(value =>
      this.group.next(value.group)));

    // Form for field (fully dynamic)
    this.fieldsForm = formBuilder.group({
    });

    // Form for address (fully dynamic)
    // As the address is optionally defined, this confuses validations if the address is set to not defined
    // Hence we use a separated form
    this.addressForm = formBuilder.group({
    });

    // Update the valid status whenever either form status changes
    const updateValidity = () => this.updateFieldsValid();
    this.subscriptions.push(this.fieldsForm.statusChanges.subscribe(updateValidity));
    this.subscriptions.push(this.addressForm.statusChanges.subscribe(updateValidity));
    this.subscriptions.push(this.addressForm.valueChanges.subscribe(updateValidity));

    // Form for confirmation (fully dynamic)
    this.confirmForm = formBuilder.group({
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.groups = (this.dataForUiHolder.dataForUi.publicRegistrationGroups || []);
    if (this.groups.length === 0) {
      // No groups for registration!
      this.notification.error(this.usersMessages.registrationErrorNoGroups());
    } else if (this.groups.length === 1) {
      // There is a single group - select it
      const group = this.groups[0];
      this.group.next(group);
      this.groupForm.patchValue({
        group: group
      });
      // After getting the registration data for this group, will mark as loaded
      this.nextFromGroup();
    } else {
      // The page is fully loaded
      this.loaded.next(true);
    }
  }

  ngAfterViewInit() {
    if (this.groups.length > 0) {
      this.stepperControl.activate(this.groupStep);
    }
  }

  private get groupId(): string {
    return this.group.value.id;
  }

  nextFromGroup() {
    this.usersService.getUserDataForNew({ group: this.groupId })
      .subscribe(data => {
        this.prepareFieldsForm(data);
      });
  }

  private prepareFieldsForm(data: UserDataForNew) {
    const user = data.user;

    // Full name
    const nameActions = data.profileFieldActions.name;
    if (nameActions && nameActions.edit) {
      this.fieldsForm.setControl('name',
        this.formBuilder.control(user.name, Validators.required, this.serverSideValidator('name'))
      );
    }
    // Login name
    const usernameActions = data.profileFieldActions.username;
    if (usernameActions && usernameActions.edit && !data.generatedUsername) {
      this.fieldsForm.setControl('username',
        this.formBuilder.control(user.username, Validators.required, this.serverSideValidator('username'))
      );
    }
    // E-mail
    const emailActions = data.profileFieldActions.username;
    if (emailActions && emailActions.edit) {
      const val = [];
      if (data.emailRequired) {
        val.push(Validators.required);
      }
      val.push(Validators.email);
      this.fieldsForm.setControl('email',
        this.formBuilder.control(user.email, val, this.serverSideValidator('email'))
      );
    }

    // Phones
    const phoneConfiguration = data.phoneConfiguration;

    // Land-line
    const landLineAvailability = phoneConfiguration.landLineAvailability;
    if (landLineAvailability !== AvailabilityEnum.DISABLED) {
      const val = landLineAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.landLinePhone;
      const landLineForm = this.formBuilder.group({
        number: [phone.number, val, this.serverSideValidator('landLinePhone')],
        hidden: phone.hidden
      });
      if (phoneConfiguration.extensionEnabled) {
        landLineForm.setControl('extension', this.formBuilder.control(phone.extension));
      }
      this.fieldsForm.setControl('landLinePhone', landLineForm);
    }

    // Mobile
    const mobileAvailability = phoneConfiguration.mobileAvailability;
    if (mobileAvailability !== AvailabilityEnum.DISABLED) {
      const val = mobileAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.mobilePhone;
      const mobileForm = this.formBuilder.group({
        number: [phone.number, val, this.serverSideValidator('mobilePhone')],
        hidden: phone.hidden
      });
      this.fieldsForm.setControl('mobilePhone', mobileForm);
    }

    // Address
    const addressConfiguration = data.addressConfiguration;
    const addressAvailability = addressConfiguration.availability;
    if (addressAvailability !== AvailabilityEnum.DISABLED) {
      const address = addressConfiguration.address;

      this.addressForm = this.formBuilder.group({
        hidden: address.hidden
      });
      const addressDefined = this.formBuilder.control(
        addressAvailability === AvailabilityEnum.REQUIRED);
      this.fieldsForm.setControl('addressDefined', addressDefined);
      for (const field of addressConfiguration.enabledFields) {
        const val = addressConfiguration.requiredFields.includes(field) ? Validators.required : null;
        this.addressForm.setControl(field, this.formBuilder.control(address[field], val));
      }
    }

    // Custom fields
    this.fieldsForm.setControl('customValues',
      ApiHelper.customValuesFormGroup(this.formBuilder, data.customFields,
        cf => this.serverSideValidator(cf.internalName)));

    // Hidden fields (both basic and custom)
    this.fieldsForm.setControl('hiddenFields',
      this.formBuilder.control(user.hiddenFields));

    this.data.next(data);

    if (!this.loaded.value) {
      // If there is a single group, just now we will finish loading
      this.loaded.next(true);
    }

    this.stepperControl.activate(this.fieldsStep);
  }

  previousFromFields() {
    this.stepperControl.activate(this.groupStep);
  }

  nextFromFields() {
    this.prepareConfirmForm();
  }

  private prepareConfirmForm() {
    const data = this.data.value;

    // Passwords
    const passwordControls: FormGroup[] = [];
    for (const pt of data.passwordTypes) {
      passwordControls.push(this.formBuilder.group({
        type: ApiHelper.internalNameOrId(pt),
        checkConfirmation: true,
        value: ['', Validators.required],
        confirmationValue: ['', [Validators.required, PASSWORDS_MATCH_VAL]]
      }));
    }
    this.confirmForm.setControl('passwords', this.formBuilder.array(passwordControls));

    // Security question
    if (data.securityQuestions != null && data.securityQuestions.length > 0) {
      this.confirmForm.setControl('securityQuestion', this.formBuilder.control(''));
      this.confirmForm.setControl('securityAnswer', this.formBuilder.control('', SEGURITY_ANSWER_VAL));
    }

    // Agreements
    if (data.agreements != null && data.agreements.length > 0) {
      this.confirmForm.setControl('acceptAgreement',
        this.formBuilder.control(false, Validators.requiredTrue));
    }

    // Captcha
    if (data.captchaType != null) {
      this.confirmForm.setControl('captcha',
        ApiHelper.captchaFormGroup(this.formBuilder));
    }

    this.stepperControl.activate(this.confirmStep);
  }

  previousFromConfirm() {
    this.stepperControl.activate(this.fieldsStep);
  }

  nextFromConfirm() {
    const user = this.userNew;
    this.usersService.createUser(user)
      .subscribe(result => {
        this.result.next(result);
        this.stepperControl.complete();
      });
  }

  private get userNew(): UserNew {
    const data = this.data.value;

    const user: UserNew = {};

    // Set the group
    user.group = this.groupId;

    // Copy the basic fields
    copyProperties(this.fieldsForm.value, user, ['landLinePhone', 'mobilePhone', 'addressDefined']);

    // Set the land line phone
    if (data.phoneConfiguration.landLineAvailability !== AvailabilityEnum.DISABLED) {
      const landLinePhone = { ...data.phoneConfiguration.landLinePhone };
      copyProperties(this.fieldsForm.value.landLinePhone, landLinePhone);
      if (!empty(landLinePhone.number)) {
        user.landLinePhones = [landLinePhone];
      }
    }

    // Set the mobile phone
    if (data.phoneConfiguration.mobileAvailability !== AvailabilityEnum.DISABLED) {
      const mobilePhone = { ...data.phoneConfiguration.mobilePhone };
      copyProperties(this.fieldsForm.value.mobilePhone, mobilePhone);
      if (!empty(mobilePhone.number)) {
        user.mobilePhones = [mobilePhone];
      }
    }

    // Set the address
    if (data.addressConfiguration.availability !== AvailabilityEnum.DISABLED) {
      // But only if defined
      if (this.fieldsForm.value.addressDefined) {
        const address = { ...data.addressConfiguration.address };
        copyProperties(this.addressForm.value, address);
        user.addresses = [address];
      }
    }

    // Copy the fields in the confirmation form
    copyProperties(this.confirmForm.value, user);
    return user;
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  private updateFieldsValid() {
    let valid = false;
    if (this.fieldsForm.valid) {
      const addressDefinedControl = this.fieldsForm.get('addressDefined');
      const addressDefined = addressDefinedControl != null && addressDefinedControl.value === true;
      valid = !addressDefined || this.addressForm.valid;
    }
    if (this.fieldsValid.value !== valid) {
      this.fieldsValid.next(valid);
      this.counter.next(this.counter.value + 1);
    }
  }

  get errors() {
    return {
      fields: getAllErrors(this.fieldsForm),
      address: getAllErrors(this.addressForm)
    };
  }

  private serverSideValidator(field: string): AsyncValidatorFn {
    return (c: AbstractControl): Observable<ValidationErrors | null> => {
      let val = c.value;
      if (empty(val) || !c.dirty) {
        // Don't validate empty value (will fail validation required), nor fields that haven't been modified yet
        return observableOf(null);
      }

      // Multi selections hold the value as array, but we must pass it as pipe-separated
      if (val instanceof Array) {
        val = val.join('|');
      }

      return observableTimer(ApiHelper.DEBOUNCE_TIME).pipe(
        switchMap(() => {
          return this.usersService.validateUserRegistrationField({
            group: this.groupId, field: field, value: val
          });
        }),
        map(msg => {
          return msg ? { message: msg } : null;
        })
      );
    };
  }

}
