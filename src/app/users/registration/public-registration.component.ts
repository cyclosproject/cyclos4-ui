import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  AddressNew, AvailabilityEnum, GroupForRegistration, Image, PhoneNew,
  UserDataForNew, UserNew, UserRegistrationResult
} from 'app/api/models';
import { ImagesService, UsersService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { blank, copyProperties, empty, focusFirstField, scrollTop, validateBeforeSubmit } from 'app/shared/helper';
import { BehaviorSubject, Observable, of, Subscription, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FieldHelperService } from 'app/core/field-helper.service';
import { AuthHelperService } from 'app/core/auth-helper.service';

export type RegistrationStep = 'group' | 'fields' | 'confirm' | 'done';


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

/**
 * User registration from guest
 */
@Component({
  selector: 'public-registration',
  templateUrl: 'public-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicRegistrationComponent
  extends BasePageComponent<UserDataForNew>
  implements OnInit, OnDestroy {

  steps: RegistrationStep[] = ['group', 'fields', 'confirm', 'done'];
  group: FormControl;
  form: FormGroup;
  mobileForm: FormGroup;
  landLineForm: FormGroup;
  defineAddress: FormControl;
  addressForm: FormGroup;
  confirmForm: FormGroup;
  image: Image;
  validationSub: Subscription;

  step$ = new BehaviorSubject<RegistrationStep>(null);
  get step(): RegistrationStep {
    return this.step$.value;
  }
  set step(step: RegistrationStep) {
    this.step$.next(step);
  }

  result$ = new BehaviorSubject<UserRegistrationResult>(null);
  get result(): UserRegistrationResult {
    return this.result$.value;
  }
  set result(result: UserRegistrationResult) {
    this.result$.next(result);
  }

  constructor(
    injector: Injector,
    i18n: I18n,
    private fieldHelper: FieldHelperService,
    private authHelper: AuthHelperService,
    private usersService: UsersService,
    private imagesService: ImagesService) {
    super(injector, i18n);
  }

  get groups(): GroupForRegistration[] {
    return this.dataForUiHolder.dataForUi.publicRegistrationGroups;
  }

  ngOnInit() {
    super.ngOnInit();

    const groups = this.groups;

    if (this.login.user || empty(groups)) {
      // This component is only for guests. Also, there must be registration groups
      this.router.navigateByUrl('/');
      return;
    }

    // Initialize the group value
    this.group = new FormControl(groups[0].id, Validators.required);
    if (groups.length === 1) {
      // When there's a single group, fetch the data already
      this.steps = this.steps.filter(s => s !== 'group');
      this.showFields();
    } else {
      // Initialize on the groups step
      this.step = 'group';
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.image) {
      // When a temp image was uploaded, immediately remove it
      this.errorHandler.requestWithCustomErrorHandler(() => {
        this.imagesService.deleteImage(this.image.id).subscribe();
      });
    }
  }

  showFields() {
    this.usersService.getUserDataForNew({ group: this.group.value })
      .subscribe(data => {
        this.data = data;
        this.prepareForms(data);
        focusFirstField();
      });
  }

  backToGroup() {
    this.form = null;
    this.data = null;
    this.step = 'group';
  }

  backToFields() {
    this.confirmForm = null;
    this.step = 'fields';
  }

  private prepareForms(data: UserDataForNew) {
    const user = data.user;

    this.form = this.formBuilder.group({
      group: this.group.value,
      hiddenFields: [user.hiddenFields || []]
    });

    // Full name
    const nameActions = data.profileFieldActions.name;
    if (nameActions && nameActions.edit) {
      this.form.setControl('name',
        this.formBuilder.control(user.name, Validators.required, this.serverSideValidator('name'))
      );
    }
    // Login name
    const usernameActions = data.profileFieldActions.username;
    if (usernameActions && usernameActions.edit && !data.generatedUsername) {
      this.form.setControl('username',
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
      this.form.setControl('email',
        this.formBuilder.control(user.email, val, this.serverSideValidator('email'))
      );
    }

    // Custom fields
    this.form.setControl('customValues',
      this.fieldHelper.customValuesFormGroup(data.customFields, {
        asyncValProvider: cf => this.serverSideValidator(cf.internalName)
      }));

    // Phones
    const phoneConfiguration = data.phoneConfiguration;

    // Mobile
    const mobileAvailability = phoneConfiguration.mobileAvailability;
    if (mobileAvailability !== AvailabilityEnum.DISABLED) {
      const val = mobileAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.mobilePhone;
      this.mobileForm = this.formBuilder.group({
        name: phone.name,
        number: [phone.number, val, this.serverSideValidator('mobilePhone')],
        hidden: phone.hidden
      });
    } else {
      this.mobileForm = null;
    }

    // Land-line
    const landLineAvailability = phoneConfiguration.landLineAvailability;
    if (landLineAvailability !== AvailabilityEnum.DISABLED) {
      const val = landLineAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null;
      const phone = phoneConfiguration.landLinePhone;
      this.landLineForm = this.formBuilder.group({
        name: phone.name,
        number: [phone.number, val, this.serverSideValidator('landLinePhone')],
        hidden: phone.hidden
      });
      if (phoneConfiguration.extensionEnabled) {
        this.landLineForm.setControl('extension', this.formBuilder.control(phone.extension));
      }
    } else {
      this.landLineForm = null;
    }

    // Address
    const addressConfiguration = data.addressConfiguration;
    const addressAvailability = addressConfiguration.availability;
    if (addressAvailability !== AvailabilityEnum.DISABLED) {
      this.defineAddress = this.formBuilder.control(addressAvailability === AvailabilityEnum.REQUIRED);
      const address = addressConfiguration.address;
      this.addressForm = this.formBuilder.group({
        name: address.name,
        hidden: address.hidden
      });
      for (const field of addressConfiguration.enabledFields) {
        const val = addressConfiguration.requiredFields.includes(field) ? Validators.required : null;
        this.addressForm.setControl(field, this.formBuilder.control(address[field], val));
      }
    } else {
      this.addressForm = null;
      this.defineAddress = null;
    }

    this.data = data;

    // Put the page on the fields step
    this.step = 'fields';
  }

  private serverSideValidator(field: string): AsyncValidatorFn {
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
            group: this.group.value, field: field, value: val
          });
        }),
        map(msg => {
          return msg ? { message: msg } : null;
        })
      );
    };
  }

  showConfirm() {
    // Build a full form, so it can all be validated once
    const fullForm = new FormGroup({
      user: this.form
    });
    if (this.mobileForm) {
      fullForm.setControl('mobile', this.mobileForm);
    }
    if (this.landLineForm && !validateBeforeSubmit(this.landLineForm)) {
      fullForm.setControl('landLine', this.landLineForm);
    }
    if (this.addressForm && this.defineAddress.value) {
      fullForm.setControl('address', this.addressForm);
    }
    if (validateBeforeSubmit(fullForm)) {
      // The form is already valid
      this.doShowConfirm();
    } else {
      // It might be either invalid or pending (this form has server-side validations)
      if (fullForm.status === 'PENDING') {
        this.validationSub = fullForm.statusChanges.subscribe(status => {
          if (status === 'PENDING') {
            // Still pending...
            return;
          }
          this.validationSub.unsubscribe();
          if (status === 'VALID') {
            this.doShowConfirm();
          }
        });
      }
    }
  }

  private doShowConfirm() {
    const data = this.data;

    // Setup the confirmation form
    this.confirmForm = this.formBuilder.group({
    });

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
    if (!empty(data.securityQuestions)) {
      this.confirmForm.setControl('securityQuestion', this.formBuilder.control(''));
      this.confirmForm.setControl('securityAnswer', this.formBuilder.control('', SEGURITY_ANSWER_VAL));
    }

    // Agreements
    if (data.agreements != null && data.agreements.length > 0) {
      this.confirmForm.setControl('acceptAgreement', this.formBuilder.control(false, Validators.requiredTrue));
    }

    // Captcha
    if (data.captchaType != null) {
      this.confirmForm.setControl('captcha', this.authHelper.captchaFormGroup());
    }

    this.step = 'confirm';

    scrollTop();
  }

  register() {
    if (!validateBeforeSubmit(this.confirmForm)) {
      return;
    }
    this.usersService.createUser(this.userNew)
      .subscribe(result => {
        this.result = result;
        this.step = 'done';
      });
  }

  get userNew(): UserNew {
    const user: UserNew = this.form.value;
    const mobile: PhoneNew = (this.mobileForm || {} as FormGroup).value;
    const landLine: PhoneNew = (this.landLineForm || {} as FormGroup).value;
    const address: AddressNew = (this.addressForm || {} as FormGroup).value;
    if (this.image) {
      user.images = [this.image.id];
    }
    if (mobile && !blank(mobile.number)) {
      user.mobilePhones = [mobile];
    }
    if (landLine && !blank(landLine.number)) {
      user.landLinePhones = [landLine];
    }
    if (address && this.defineAddress.value) {
      user.addresses = [address];
    }

    // Copy the fields in the confirmation form
    copyProperties(this.confirmForm.value, user);

    return user;
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
