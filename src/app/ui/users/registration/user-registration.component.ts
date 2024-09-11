import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AddressNew,
  AvailabilityEnum,
  Group,
  GroupForRegistration,
  GroupKind,
  IdentityProvider,
  IdentityProviderCallbackStatusEnum,
  Image,
  PhoneNew,
  RoleEnum,
  StoredFile,
  UserDataForNew,
  UserNew,
  UserRegistrationResult,
  Wizard
} from 'app/api/models';
import { ImagesService } from 'app/api/services/images.service';
import { UsersService } from 'app/api/services/users.service';
import { CaptchaHelperService } from 'app/core/captcha-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ApiHelper } from 'app/shared/api-helper';
import {
  blank,
  copyProperties,
  empty,
  focusFirstField,
  focusFirstInvalid,
  mergeValidity,
  scrollTop,
  setRootSpinnerVisible,
  validateBeforeSubmit
} from 'app/shared/helper';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ConfirmResumeWizardComponent } from 'app/ui/users/registration/confirm-resume-wizard.component';
import Cookies from 'js-cookie';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

export type RegistrationStep = 'group' | 'idp' | 'fields' | 'confirm' | 'done';
export const WizardStorageKey = 'publicRegistrationExecution';

/**
 * User registration. Works for guest, by admin and by broker
 */
@Component({
  selector: 'user-registration',
  templateUrl: 'user-registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserRegistrationComponent extends BasePageComponent<UserDataForNew> implements OnInit, OnDestroy {
  groupSets: Group[];
  groups: GroupForRegistration[];
  steps: RegistrationStep[] = ['group', 'idp', 'fields', 'confirm', 'done'];
  group: FormControl;
  form: FormGroup;
  imageControl: FormControl;
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
  asyncValidatorsEnabled = false;

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
    private captchaHelper: CaptchaHelperService,
    private imagesService: ImagesService,
    private nextRequestState: NextRequestState,
    private modal: BsModalService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const auth = this.login.auth || {};
    const role = auth.role;

    if (role == null) {
      const dataForUi = this.dataForFrontendHolder.dataForUi;

      // Maybe a wizard should be used instead of the regular registration form?
      let wizard: Wizard;
      if (this.layout.ltmd) {
        wizard = dataForUi.smallScreenRegistrationWizard;
      } else if (this.layout.md) {
        wizard = dataForUi.mediumScreenRegistrationWizard;
      } else {
        wizard = dataForUi.largeScreenRegistrationWizard;
      }
      if (wizard) {
        // Redirect to the wizard execution page
        // But first check whether the user wants to resume any previous registration or start a new one
        const previousKey = localStorage.getItem(WizardStorageKey);
        if (previousKey) {
          const ref = this.modal.show(ConfirmResumeWizardComponent, {
            ignoreBackdropClick: true
          });
          const component = ref.content as ConfirmResumeWizardComponent;
          this.addSub(
            component.select.subscribe(answer => {
              if (answer) {
                this.router.navigate(['/wizards', 'run', previousKey]);
              } else {
                localStorage.removeItem(WizardStorageKey);
                this.goToWizard(wizard);
              }
            })
          );
        } else {
          this.goToWizard(wizard);
        }
        return;
      }

      // When guest, the possible groups are obtained from DataForFrontend
      this.initializeGroups(dataForUi.publicRegistrationGroups);
    } else {
      // When admin / broker, fetch the possible registration groups from data, as they are more complete
      this.addSub(
        this.usersService
          .getUserDataForSearch({
            broker: role === RoleEnum.BROKER ? ApiHelper.SELF : null,
            fields: ['groupsForRegistration']
          })
          .subscribe(data => {
            this.groupSets = data.groupsForRegistration.filter(g => g.kind === GroupKind.GROUP_SET);
            const hasRootGroups = data.groupsForRegistration.find(
              g => g.kind !== GroupKind.GROUP_SET && g.groupSet == null
            );
            if (hasRootGroups) {
              this.groupSets.unshift(null);
            }
            this.initializeGroups(data.groupsForRegistration.filter(g => g.kind !== GroupKind.GROUP_SET));
          })
      );
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
        this.addSub(this.imagesService.deleteImage({ id: this.image.id }).subscribe());
      });
    }
  }

  showIdentityProviders() {
    this.addSub(
      this.usersService
        .getUserDataForNew({
          group: this.group.value,
          inviteToken: localStorage.getItem('inviteToken') || Cookies.get('inviteToken'),
          externalPaymentToken: this.route.snapshot.params.externalPaymentToken,
          fields: ['-agreements.content']
        })
        .subscribe(data => {
          this.data = data;
          if (empty(data.identityProviders)) {
            this.showFields();
          } else {
            this.step = 'idp';
          }
        })
    );
  }

  continueWithProvider(idp: IdentityProvider) {
    if (idp) {
      this.authHelper
        .identityProviderPopup(idp, 'register', this.group.value, null, this.login.getUserAgentId())
        .pipe(first())
        .subscribe(callback => {
          switch (callback.status) {
            case IdentityProviderCallbackStatusEnum.REGISTRATION_DONE:
              // Already registered and logged-in
              this.nextRequestState
                .replaceSession(callback.sessionToken)
                .pipe(first())
                .subscribe(() => {
                  setRootSpinnerVisible(true);
                  this.dataForFrontendHolder
                    .initialize()
                    .pipe(first())
                    .subscribe(data => {
                      setRootSpinnerVisible(false);
                      // Redirect to the home URL
                      if (!ApiHelper.isRestrictedAccess(data)) {
                        this.router.navigateByUrl('');
                      }
                    });
                });
              break;
            case IdentityProviderCallbackStatusEnum.REGISTRATION_DATA:
              // Data for the registration form
              this.identityProviderRequestId = callback.requestId;
              // No captcha is needed when using an identity provider
              this.data.captchaInput = null;
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
      hiddenFields: [user.hiddenFields || []]
    });

    const imageAvailability = data.imageConfiguration.availability;
    if (imageAvailability !== AvailabilityEnum.DISABLED) {
      this.imageControl = new FormControl(
        null,
        imageAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null
      );
    }

    // The profile fields and phones are handled by the helper
    [this.mobileForm, this.landLineForm] = this.userHelper.setupRegistrationForm(this.form, data, !this.login.user);

    // Address
    let addressSubs: Subscription[];
    [this.addressForm, this.defineAddress, addressSubs] = this.userHelper.registrationAddressForm(
      data.addressConfiguration
    );
    addressSubs.forEach(s => this.addSub(s));

    this.data = data;

    // Put the page on the fields step
    this.step = 'fields';
  }

  showConfirm() {
    // Build a full form, so it can all be validated once
    const fullForm = new FormGroup({
      user: this.form
    });
    if (this.data.imageConfiguration.availability === AvailabilityEnum.REQUIRED) {
      fullForm.setControl('image', this.imageControl);
    }
    if (this.mobileForm) {
      fullForm.setControl('mobile', this.mobileForm);
    }
    if (this.landLineForm) {
      fullForm.setControl('landLine', this.landLineForm);
    }
    if (this.addressForm && this.defineAddress.value) {
      fullForm.setControl('address', this.addressForm);
    }
    this.asyncValidatorsEnabled = true;
    const nonValid = validateBeforeSubmit(fullForm, true) as FormControl[];
    this.addSub(
      mergeValidity(nonValid).subscribe(isValid => {
        this.asyncValidatorsEnabled = false;
        if (isValid) {
          this.doShowConfirm();
        } else {
          focusFirstInvalid();
        }
      })
    );
  }

  private doShowConfirm() {
    const data = this.data;

    // Setup the confirmation form
    this.confirmForm = this.formBuilder.group({});

    // Passwords
    const passwordControls = this.userHelper.passwordRegistrationForms(data);
    this.confirmForm.setControl('passwords', this.formBuilder.array(passwordControls));

    // Security question
    if (!empty(data.securityQuestions)) {
      this.confirmForm.setControl('securityQuestion', this.formBuilder.control(''));
      this.confirmForm.setControl(
        'securityAnswer',
        this.formBuilder.control('', this.userHelper.securityAnswerValidation)
      );
    }

    // Agreements
    if (!empty(data.agreements)) {
      this.confirmForm.setControl('acceptAgreements', this.formBuilder.control([]));
    }

    // Captcha
    if (data.captchaInput) {
      this.confirmForm.setControl('captcha', this.captchaHelper.captchaFormGroup(data.captchaInput));
    }

    this.step = 'confirm';

    scrollTop();
  }

  register() {
    const nonValid = validateBeforeSubmit(this.confirmForm, true) as FormControl[];
    this.addSub(
      mergeValidity(nonValid).subscribe(isValid => {
        if (isValid) {
          // Perform the registration
          this.addSub(
            this.usersService.createUser({ body: this.userNew }).subscribe(result => {
              this.result = result;
              this.image = null;
              localStorage.removeItem('inviteToken');
              Cookies.remove('inviteToken', { path: '/' });
              this.step = 'done';
            })
          );
        } else {
          focusFirstInvalid();
        }
      })
    );
  }

  get userNew(): UserNew {
    const user: UserNew = this.form.value;
    user.identityProviderRequestId = this.identityProviderRequestId;
    const mobile: PhoneNew = (this.mobileForm || ({} as FormGroup)).value;
    const landLine: PhoneNew = (this.landLineForm || ({} as FormGroup)).value;
    const address: AddressNew = (this.addressForm || ({} as FormGroup)).value;
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

    // The inviteToken isn't stored in the form, but in a cookie
    user.inviteToken = Cookies.get('inviteToken');

    user.externalPaymentToken = this.route.snapshot.params.externalPaymentToken;
    user.userAgentId = this.login.getUserAgentId();
    return user;
  }

  fromExternalPayment(): boolean {
    return !!this.route.snapshot.params.externalPaymentToken;
  }

  goToLogin() {
    this.login.goToLoginPage('');
  }

  viewProfile() {
    const result = this.result;
    if (result) {
      this.router.navigate(['/users', result.user.id, 'profile']);
    }
  }

  addCustomImages(images: Image[]) {
    this.customImages = [...this.customImages, ...images];
  }

  addCustomFiles(files: StoredFile[]) {
    this.customFiles = [...this.customFiles, ...files];
  }

  resolveMenu() {
    switch (this.dataForFrontendHolder.role) {
      case RoleEnum.ADMINISTRATOR:
        return Menu.ADMIN_REGISTRATION;
      case RoleEnum.BROKER:
        return Menu.BROKER_REGISTRATION;
      default:
        return Menu.PUBLIC_REGISTRATION;
    }
  }

  private goToWizard(wizard: Wizard) {
    const externalPaymentToken = this.route.snapshot.params.externalPaymentToken;
    let wizardUrl = `/wizards/registration/${ApiHelper.internalNameOrId(wizard)}`;
    if (externalPaymentToken) {
      wizardUrl += `/${externalPaymentToken}`;
    }
    this.router.navigateByUrl(wizardUrl, { replaceUrl: true });
  }
}
