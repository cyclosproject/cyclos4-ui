import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  AddressNew, AvailabilityEnum, Group, GroupForRegistration, GroupKind,
  IdentityProvider, IdentityProviderCallbackStatusEnum, Image, PhoneNew, RoleEnum, StoredFile,
  UserDataForNew, UserNew, UserRegistrationResult,
} from 'app/api/models';
import { ImagesService, UsersService } from 'app/api/services';
import { AddressHelperService } from 'app/core/address-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { UserHelperService } from 'app/core/user-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import {
  blank, copyProperties, empty, focusFirstField, focusFirstInvalid,
  mergeValidity, scrollTop, setRootSpinnerVisible, validateBeforeSubmit,
} from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject, Observable, of, Subscription, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

export type RegistrationStep = 'group' | 'idp' | 'fields' | 'confirm' | 'done';

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
 * User registration. Works for guest, by admin and by broker
 */
@Component({
  selector: 'user-registration',
  templateUrl: 'user-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRegistrationComponent
  extends BasePageComponent<UserDataForNew>
  implements OnInit, OnDestroy {

  groupSets: Group[];
  groups: GroupForRegistration[];
  steps: RegistrationStep[] = ['group', 'idp', 'fields', 'confirm', 'done'];
  group: FormControl;
  form: FormGroup;
  mobileForm: FormGroup;
  landLineForm: FormGroup;
  defineAddress: FormControl;
  addressForm: FormGroup;
  confirmForm: FormGroup;
  image: Image;
  validationSub: Subscription;
  customImages: Image[] = [];
  customFiles: StoredFile[] = [];
  private identityProviderRequestId: string;

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
    private usersService: UsersService,
    private userHelper: UserHelperService,
    private imagesService: ImagesService,
    private addressHelper: AddressHelperService,
    private nextRequestState: NextRequestState) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const auth = this.login.auth || {};
    const role = auth.role;

    if (role == null) {
      // When guest, the possible groups are obtained from DataForUi
      this.initializeGroups(this.dataForUiHolder.dataForUi.publicRegistrationGroups);
    } else {
      // When admin / broker, fetch the possible registration groups from data, as they are more complete
      this.addSub(this.usersService.getUserDataForSearch({
        broker: role === RoleEnum.BROKER ? ApiHelper.SELF : null,
        fields: ['groupsForRegistration'],
      }).subscribe(data => {
        this.groupSets = data.groupsForRegistration.filter(g => g.kind === GroupKind.GROUP_SET);
        const hasRootGroups = data.groupsForRegistration.find(g => g.kind !== GroupKind.GROUP_SET && g.groupSet == null);
        if (hasRootGroups) {
          this.groupSets.unshift(null);
        }
        this.initializeGroups(data.groupsForRegistration.filter(g => g.kind !== GroupKind.GROUP_SET));
      }));
    }
  }

  private initializeGroups(groups: (GroupForRegistration | Group)[]) {
    if (this.groups != null) {
      // Already initialized
      return;
    }
    this.groups = groups;
    if (empty(this.groups)) {
      // No possible registration groups - navigate to home
      this.router.navigateByUrl('/');
    } else {
      // Initialize the group value
      this.group = new FormControl(groups[0].id, Validators.required);
      if (groups.length === 1) {
        // When there's a single group, fetch the data already
        this.steps = this.steps.filter(s => s !== 'group');
        this.showIdentityProviders();
      } else {
        // Initialize on the groups step
        this.step = 'group';
      }
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.image) {
      // When a temp image was uploaded, revoke its URL...
      URL.revokeObjectURL(this.image.url);

      // ... and remove it server-side
      this.errorHandler.requestWithCustomErrorHandler(() => {
        this.addSub(this.imagesService.deleteImage({ idOrKey: this.image.id }).subscribe());
      });
    }
  }

  showIdentityProviders() {
    this.addSub(this.usersService.getUserDataForNew({ group: this.group.value })
      .subscribe(data => {
        this.data = data;
        if (empty(data.identityProviders)) {
          this.showFields();
        } else {
          this.step = 'idp';
        }
      }));
  }

  continueWithProvider(idp: IdentityProvider) {
    if (idp) {
      this.authHelper.identityProviderPopup(idp, 'register', this.group.value).pipe(first()).subscribe(callback => {
        switch (callback.status) {
          case IdentityProviderCallbackStatusEnum.REGISTRATION_DONE:
            // Already registered and logged-in
            this.nextRequestState.replaceSession(callback.sessionToken).pipe(first()).subscribe(() => {
              setRootSpinnerVisible(true);
              this.dataForUiHolder.initialize().subscribe(auth => {
                setRootSpinnerVisible(false);
                // Redirect to the home URL
                if (!ApiHelper.isRestrictedAccess(auth)) {
                  this.router.navigateByUrl('');
                }
              });
            });
            break;
          case IdentityProviderCallbackStatusEnum.REGISTRATION_DATA:
            // Data for the registration form
            this.identityProviderRequestId = callback.requestId;
            // No captcha is needed when using an identity provider
            this.data.captchaType = null;
            // Fill in the user fields
            const user = this.data.user;
            if (callback.name) {
              user.name = callback.name;
            }
            if (callback.username) {
              user.username = callback.username;
            }
            if (callback.email) {
              user.email = callback.email;
            }
            if (callback.mobilePhone) {
              user.mobilePhones = [{ number: callback.mobilePhone }];
            }
            if (callback.landLinePhone) {
              user.landLinePhones = [{ number: callback.landLinePhone, extension: callback.landLineExtension }];
            }
            if (callback.customValues) {
              if (!user.customValues) {
                user.customValues = {};
              }
              for (const key of Object.keys(callback.customValues)) {
                user.customValues[key] = callback.customValues[key];
              }
            }
            if (callback.image) {
              user.images = [callback.image.id];
              this.image = callback.image;
            }
            this.showFields();
            break;
          default:
            this.notification.error(callback.errorMessage || this.i18n.error.general);
            break;
        }
      });
    } else {
      this.showFields();
    }
  }

  showFields() {
    this.prepareForms(this.data);
    focusFirstField();
  }

  backToGroup() {
    this.form = null;
    this.data = null;
    this.step = 'group';
  }

  backToIdentityProviders() {
    if (this.data && !empty(this.data.identityProviders)) {
      this.step = 'idp';
    } else {
      this.backToGroup();
    }
  }

  backToFields() {
    this.confirmForm = null;
    this.step = 'fields';
  }

  private prepareForms(data: UserDataForNew) {
    const user = data.user;

    this.form = this.formBuilder.group({
      group: this.group.value,
      hiddenFields: [user.hiddenFields || []],
    });

    // The profile fields and phones are handled by the helper
    [this.mobileForm, this.landLineForm] = this.userHelper.setupRegistrationForm(
      this.form, data, (name) => this.serverSideValidator(name));

    // Address
    const addressConfiguration = data.addressConfiguration;
    const addressAvailability = addressConfiguration.availability;
    if (addressAvailability !== AvailabilityEnum.DISABLED) {
      this.defineAddress = this.formBuilder.control(addressAvailability === AvailabilityEnum.REQUIRED);
      this.addressForm = this.addressHelper.addressFormGroup(addressConfiguration);
      const address = data.addressConfiguration.address;
      this.addressForm.patchValue(address);
      // When any of the fields change, clear the location
      for (const field of addressConfiguration.enabledFields) {
        let previous = address[field] || null;
        this.addSub(this.addressForm.get(field).valueChanges.subscribe(newVal => {
          if (previous !== newVal) {
            this.addressForm.get('location').patchValue({ latitude: null, longitude: null });
          }
          previous = newVal;
        }));
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
            group: this.group.value, field, value: val,
          });
        }),
        map(msg => {
          return msg ? { message: msg } : null;
        }),
      );
    };
  }

  showConfirm() {
    // Build a full form, so it can all be validated once
    const fullForm = new FormGroup({
      user: this.form,
    });
    if (this.mobileForm) {
      fullForm.setControl('mobile', this.mobileForm);
    }
    if (this.landLineForm) {
      fullForm.setControl('landLine', this.landLineForm);
    }
    if (this.addressForm && this.defineAddress.value) {
      fullForm.setControl('address', this.addressForm);
    }
    const nonValid = validateBeforeSubmit(fullForm, true) as FormControl[];
    this.addSub(mergeValidity(nonValid).subscribe(isValid => {
      if (isValid) {
        this.doShowConfirm();
      } else {
        focusFirstInvalid();
      }
    }));
  }

  private doShowConfirm() {
    const data = this.data;

    // Setup the confirmation form
    this.confirmForm = this.formBuilder.group({
    });

    // Passwords
    const passwordControls = this.userHelper.passwordRegistrationForms(data);
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
    const nonValid = validateBeforeSubmit(this.confirmForm, true) as FormControl[];
    this.addSub(mergeValidity(nonValid).subscribe(isValid => {
      if (isValid) {
        // Perform the registration
        this.addSub(this.usersService.createUser({ body: this.userNew })
          .subscribe(result => {
            this.result = result;
            this.image = null;
            this.step = 'done';
          }));
      } else {
        focusFirstInvalid();
      }
    }));
  }

  get userNew(): UserNew {
    const user: UserNew = this.form.value;
    user.identityProviderRequestId = this.identityProviderRequestId;
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
    this.login.goToLoginPage('');
  }

  viewProfile() {
    const result = this.result;
    if (result) {
      this.router.navigate(['users', result.user.id, 'profile']);
    }
  }

  addCustomImages(images: Image[]) {
    this.customImages = [...this.customImages, ...images];
  }

  addCustomFiles(files: StoredFile[]) {
    this.customFiles = [...this.customFiles, ...files];
  }

  resolveMenu() {
    switch (this.dataForUiHolder.role) {
      case RoleEnum.ADMINISTRATOR:
        return Menu.ADMIN_REGISTRATION;
      case RoleEnum.BROKER:
        return Menu.BROKER_REGISTRATION;
      default:
        return Menu.PUBLIC_REGISTRATION;
    }
  }

}
