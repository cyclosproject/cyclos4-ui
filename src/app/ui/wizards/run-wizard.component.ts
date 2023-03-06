import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AddressNew, AvailabilityEnum, BasicProfileFieldEnum, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, IdentityProvider, IdentityProviderCallbackStatusEnum,
  PhoneKind,
  PhoneNew, UserNew, WizardActionEnum, WizardExecutionData, WizardKind, WizardResultTypeEnum, WizardStepKind, WizardStepTransition
} from 'app/api/models';
import { WizardsService } from 'app/api/services/wizards.service';
import { CaptchaHelperService } from 'app/core/captcha-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { empty, focusFirstInvalid, mergeValidity, validateBeforeSubmit } from 'app/shared/helper';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { WizardStorageKey } from 'app/ui/users/registration/user-registration.component';
import Cookies from 'js-cookie';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Runs a custom wizard
 */
@Component({
  selector: 'run-wizard',
  templateUrl: 'run-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunWizardComponent
  extends BasePageComponent<WizardExecutionData>
  implements OnInit {

  WizardStepKind = WizardStepKind;
  WizardResultTypeEnum = WizardResultTypeEnum;
  WizardActionEnum = WizardActionEnum;

  // private self = false;

  key: string;

  group: FormControl;
  user: FormGroup;
  mobilePhone: FormGroup;
  landLinePhone: FormGroup;
  defineAddress: FormControl;
  address: FormGroup;
  customValues: FormGroup;
  emailValidation: FormControl;
  smsValidation: FormControl;
  verificationCode: FormControl;

  updating$ = new BehaviorSubject(false);

  informationText: string;
  showBack: boolean;
  singleTransition: WizardStepTransition;
  transitions: WizardStepTransition[];

  registrationMessage: string;
  registrationPrincipals: string;
  registrationPasswords: string;

  resultMessage: string;
  private createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(
    injector: Injector,
    private userHelper: UserHelperService,
    private captchaHelper: CaptchaHelperService,
    private nextRequestState: NextRequestState,
    private wizardsService: WizardsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    const key = route.params.key;
    const user = route.params.user;
    const menu = route.params.menu;
    const wizard = route.params.wizard;
    let request: Observable<WizardExecutionData>;

    if (key) {
      // Already in an execution. Maybe the data was cached before?
      const cacheKey = `wizard-execution-${key}`;
      const existing: WizardExecutionData = this.stateManager.getGlobal(cacheKey);
      if (existing) {
        this.stateManager.deleteGlobal(cacheKey);
        this.data = existing;
      } else {
        this.addSub(this.wizardsService.getCurrentWizardExecution({ key }).subscribe(data => this.data = data));
      }
    } else {
      // Start a new execution
      if (user) {
        request = this.wizardsService.startUserWizard({ user, key: wizard });
      } else if (menu) {
        request = this.wizardsService.startMenuWizard({ menu });
      } else {
        request = this.wizardsService.startWizard({
          key: wizard,
          inviteToken: localStorage.getItem('inviteToken') || Cookies.get('inviteToken'),
          userAgentId: this.login.getUserAgentId(),
          externalPaymentToken: this.route.snapshot.params.externalPaymentToken
        });
      }
      this.addSub(request.subscribe(data => {
        this.stateManager.setGlobal(`wizard-execution-${data.key}`, data);
        this.data = data;
      }));
    }
  }

  onDataInitialized(data: WizardExecutionData) {
    this.createDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.RUN_WIZARD,
      wizard: this.data.wizard.id
    });

    const route = this.route.snapshot;
    if (route.params.key !== data.key) {
      // Redirect to the execution with the current key
      this.breadcrumb.pop();
      this.router.navigate(['/wizards', 'run', data.key], { replaceUrl: true });
      return;
    }
    this.key = data.key;
    this.data$.subscribe(d => this.update(d));
  }

  private update(data: WizardExecutionData) {
    this.updating$.next(true);
    data = data || {};
    this.showBack = (data.path || []).length > 0;

    // Calculate the state regarding the possible transitions
    if (data.step) {
      const transitions = data.transitions || [];
      this.singleTransition = transitions.length === 1 ? transitions[0] : null;
      this.transitions = transitions.length > 1 ? transitions : null;
      if (data.action === WizardActionEnum.ALREADY_EXECUTED) {
        this.informationText = this.i18n.wizard.alreadyExecuted;
      } else {
        this.informationText = data.step.informationText;
      }

      setTimeout(() => {
        // Initialize the forms
        this.setupForms(data);
        this.updating$.next(false);
      });
    } else if (data.resultType) {
      this.informationText = null;
      switch (data.resultType) {
        case WizardResultTypeEnum.REGISTRATION:
          const result = data.registrationResult;
          this.registrationMessage = this.userHelper.registrationMessageHtml(result, false);
          if (this.login.user == null && result.status == 'active') {
            this.registrationPrincipals = this.userHelper.registrationPrincipalsHtml(result);
            this.registrationPasswords = this.userHelper.registrationPasswordsMessage(result);
          }
          localStorage.removeItem('inviteToken');
          Cookies.remove('inviteToken', { path: '/' });
          break;
        case WizardResultTypeEnum.PLAIN_TEXT:
          this.resultMessage = (data.result || '').split('\n').join('<br>');
          break;
        case WizardResultTypeEnum.RICH_TEXT:
          this.resultMessage = (data.result || '');
          break;
      }
    }
  }

  setupForms(data: WizardExecutionData) {
    // First clear all forms and controls
    this.group = null;
    this.user = null;
    this.emailValidation = null;
    this.smsValidation = null;
    this.mobilePhone = null;
    this.landLinePhone = null;
    this.customValues = null;
    this.address = null;
    this.defineAddress = null;
    this.verificationCode = null;

    // Then, according to the current step, initialize the corresponding ones
    if (data.step != null) {
      const step = data.step;
      switch (step.kind) {
        case WizardStepKind.GROUP:
          this.group = this.formBuilder.control(data.params.group || data.step.groups[0].internalName || data.step.groups[0].id, Validators.required);
          break;
        case WizardStepKind.FORM_FIELDS:
          // Wizard custom fields
          this.customValues = this.fieldHelper.customValuesFormGroup(step.customFields || [], {
            currentValues: (data.params || {}).customValues
          });

          // User registration
          if (data.wizard.kind === WizardKind.REGISTRATION) {
            const dataForNew = step.dataForNew;
            const user = data.params.user;
            dataForNew.user = user;

            this.user = this.formBuilder.group({
              group: user.group,
              hiddenFields: [user.hiddenFields || []],
            });
            // The profile fields and phones are handled by the helper
            [this.mobilePhone, this.landLinePhone] = this.userHelper.setupRegistrationForm(
              this.user, dataForNew, true);

            if (data.step.fields?.find(f => f.basicProfileField === BasicProfileFieldEnum.EMAIL && f.requireVerification)) {
              this.emailValidation = new FormControl(null);
              if (dataForNew.emailRequired) {
                this.emailValidation.addValidators(Validators.required);
              } else {
                this.addSub(this.user.controls.email?.valueChanges.subscribe(() => {
                  if (this.user.controls.email.value) {
                    this.emailValidation.addValidators(Validators.required);
                  } else {
                    this.emailValidation.removeValidators(Validators.required);
                  }
                }));
              }
            }
            if (data.step.fields?.find(f => f.phoneKind === PhoneKind.MOBILE && f.requireVerification)) {
              this.smsValidation = new FormControl(null);
              if (dataForNew.phoneConfiguration.mobileAvailability === AvailabilityEnum.REQUIRED) {
                this.smsValidation.addValidators(Validators.required);
              } else {
                this.addSub(this.mobilePhone.controls.number?.valueChanges.subscribe(() => {
                  if (this.mobilePhone.controls.number.value) {
                    this.smsValidation.addValidators(Validators.required);
                  } else {
                    this.smsValidation.removeValidators(Validators.required);
                  }
                }));
              }
            }

            if (dataForNew.phoneConfiguration) {
              if (!empty(user.mobilePhones)) {
                dataForNew.phoneConfiguration.mobilePhone = user.mobilePhones[0];
              }
              if (!empty(user.landLinePhones)) {
                dataForNew.phoneConfiguration.landLinePhone = user.landLinePhones[0];
              }
            }
            if (dataForNew.addressConfiguration) {
              if (!empty(user.addresses)) {
                dataForNew.addressConfiguration.address = user.addresses[0];
              }
            }
            const imageAvailability = dataForNew.imageConfiguration.availability;
            if (imageAvailability !== AvailabilityEnum.DISABLED) {
              this.user.addControl('images', new FormControl(user.images,
                imageAvailability === AvailabilityEnum.REQUIRED ? Validators.required : null));
            }

            // Address
            let addressSubs: Subscription[];
            [this.address, this.defineAddress, addressSubs] = this.userHelper.registrationAddressForm(dataForNew.addressConfiguration);
            if (this.defineAddress && !empty(user.addresses)) {
              this.defineAddress.setValue(true);
            }
            addressSubs.forEach(s => this.addSub(s));

            // Passwords
            const passwordControls = this.userHelper.passwordRegistrationForms(dataForNew);
            this.user.addControl('passwords', this.formBuilder.array(passwordControls));

            // Security question
            if (!empty(dataForNew.securityQuestions)) {
              this.user.setControl('securityQuestion', this.formBuilder.control(user.securityQuestion));
              this.user.setControl('securityAnswer', this.formBuilder.control(user.securityAnswer,
                this.userHelper.securityAnswerValidation));
            }

            // Agreements
            if (!empty(dataForNew.agreements)) {
              this.user.setControl('acceptAgreements', this.formBuilder.control(user.acceptAgreements));
            }

            // Captcha
            if (dataForNew.captchaInput) {
              this.user.setControl('captcha', this.captchaHelper.captchaFormGroup(dataForNew.captchaInput));
            }
          }
          break;
        case WizardStepKind.EMAIL_VERIFICATION:
        case WizardStepKind.PHONE_VERIFICATION:
          this.verificationCode = new FormControl(null, Validators.required);
          break;
      }
    }
  }

  resolveMenu(data: WizardExecutionData) {
    const wizard = data.wizard;
    const kind = wizard.kind;
    switch (kind) {
      case WizardKind.REGISTRATION:
        return Menu.RUN_REGISTRATION_WIZARD;
      case WizardKind.SYSTEM:
        return new ActiveMenu(this.menu.menuForWizard(wizard), { wizard });
      case WizardKind.USER:
        return this.menu.userMenu(data.user,
          new ActiveMenu(this.menu.menuForWizard(wizard), { wizard }));
      case WizardKind.MENU:
        const menu = this.ApiHelper.internalNameOrId(data.menuItem);
        return this.menu.contentPageEntry(menu)?.activeMenu;
    }
  }

  back() {
    this.addSub(this.wizardsService.backWizardExecution({ key: this.key }).subscribe(data => this.data = data));
  }

  transition(transition: WizardStepTransition, confirmationPassword?: string) {
    const params = this.data.params;
    params.confirmationPassword = confirmationPassword;
    this.validateAndSubmit(() => {
      this.addSub(this.wizardsService.transitionWizardExecution({
        key: this.key,
        transition: transition ? transition.id : null,
        body: params
      }
      ).subscribe(data => {
        this.confirmation.hide();
        if (this.data.wizard.kind === WizardKind.REGISTRATION) {
          if (transition) {
            localStorage.setItem(WizardStorageKey, this.data.key);
          } else {
            localStorage.removeItem(WizardStorageKey);
          }
        }
        this.data = data;
      }));
    });
  }

  externalRedirect() {
    this.validateAndSubmit(() =>
      this.addSub(this.wizardsService.redirectWizardExecution({
        key: this.key,
        body: this.data.params
      }).subscribe(url => {
        // Indicate that we will redirect
        this.nextRequestState.willExternalRedirect();
        window.location.assign(url);
      })));
  }

  resolveSubmitAction(): Function {
    switch (this.data.action) {
      case WizardActionEnum.FINISH:
        if (this.data.confirmationPasswordInput) {
          return () => this.confirmation.confirm({
            title: this.data.wizard.name,
            createDeviceConfirmation: this.createDeviceConfirmation,
            passwordInput: this.data.confirmationPasswordInput,
            callback: conf => this.transition(null, conf.confirmationPassword),
          });
        } else {
          return () => this.transition(null);
        }
      case WizardActionEnum.ALREADY_EXECUTED:
      case WizardActionEnum.STEP:
        if (this.singleTransition) {
          return () => this.transition(this.singleTransition);
        } else {
          return null;
        }
      case WizardActionEnum.EXTERNAL_REDIRECT:
        return () => this.externalRedirect();
    }
  }

  private validateAndSubmit(proceed: () => any) {
    const params = this.data.params;

    switch (this.data.step.kind) {
      case WizardStepKind.GROUP:
        if (!validateBeforeSubmit(this.group)) {
          focusFirstInvalid();
          return;
        }
        params.group = this.group.value;
        proceed();
        break;
      case WizardStepKind.IDENTITY_PROVIDER:
        // The transition in the IdP step is actually to skip the IdP.
        proceed();
        break;
      case WizardStepKind.FORM_FIELDS:
        // Create a full form only for validation
        const fullForm = new FormGroup({});
        if (this.customValues) {
          fullForm.addControl('customValues', this.customValues);
        }
        if (this.data.wizard.kind === WizardKind.REGISTRATION) {
          if (this.user) {
            fullForm.addControl('user', this.user);
          }
          if (this.emailValidation && this.user.contains('email') && !this.emailAlreadyVerified) {
            fullForm.addControl('emailValidation', this.emailValidation);
          }
          if (this.mobilePhone && !this.smsAlreadyVerified) {
            fullForm.addControl('mobilePhone', this.mobilePhone);
          }
          if (this.smsValidation && this.mobilePhone && !this.smsAlreadyVerified) {
            fullForm.addControl('smsValidation', this.smsValidation);
          }
          if (this.landLinePhone) {
            fullForm.addControl('landLinePhone', this.landLinePhone);
          }
          if (this.address && this.defineAddress.value) {
            fullForm.addControl('address', this.address);
          }
        }

        const nonValid = validateBeforeSubmit(fullForm, true) as FormControl[];
        this.addSub(mergeValidity(nonValid).subscribe(isValid => {
          if (isValid) {
            params.customValues = this.customValues ? this.customValues.value : null;
            if (this.data.wizard.kind === WizardKind.REGISTRATION) {
              const user = (this.user ? { ...this.user.value } : {}) as UserNew;
              if (this.mobilePhone) {
                const mobile = (this.mobilePhone.value || {}) as PhoneNew;
                if (mobile.number) {
                  user.mobilePhones = [mobile];
                }
              }
              if (this.landLinePhone) {
                const landLine = (this.landLinePhone.value || {}) as PhoneNew;
                if (landLine.number) {
                  user.landLinePhones = [landLine];
                }
              }
              if (this.address) {
                const address = (this.defineAddress && this.defineAddress.value ? this.address.value : null) as AddressNew;
                if (address) {
                  user.addresses = [address];
                }
              }
              params.user = user;
              if (this.emailValidation && !this.emailAlreadyVerified) {
                params.emailVerification = this.emailValidation.value;
              }
              if (this.smsValidation && !this.smsAlreadyVerified) {
                params.smsVerification = this.smsValidation.value;
              }
            }
            proceed();
          } else {
            focusFirstInvalid();
          }
        }));
        break;
      case WizardStepKind.EMAIL_VERIFICATION:
        if (validateBeforeSubmit(this.verificationCode)) {
          params.emailVerification = this.verificationCode.value;
          proceed();
        }
        break;
      case WizardStepKind.PHONE_VERIFICATION:
        if (validateBeforeSubmit(this.verificationCode)) {
          params.smsVerification = this.verificationCode.value;
          proceed();
        }
        break;
    }
  }

  /**
   * Returns whether the current e-mail address as already verified
   */
  get emailAlreadyVerified() {
    if (!this.user || !this.data.step) {
      return false;
    }
    const verified = this.data.step.verifiedEmail;
    const email = this.user.value.email;
    return !empty(verified) && verified === email;
  }

  /**
   * Returns whether the current mobile phone number was already verified by sms
   */
  get smsAlreadyVerified() {
    if (!this.mobilePhone || !this.data.step) {
      return false;
    }
    const verified = this.data.step.verifiedSms;
    const mobile = this.mobilePhone.value.number;
    return !empty(verified) && this.userHelper.phoneNumberMatches(verified, mobile);
  }

  continueWithProvider(idp: IdentityProvider) {
    this.authHelper.identityProviderPopup(idp, 'wizard', null, this.key).pipe(first()).subscribe(callback => {
      switch (callback.status) {
        case IdentityProviderCallbackStatusEnum.WIZARD:
          this.data = callback.wizardExecutionData;
          break;
        default:
          this.notification.error(callback.errorMessage || this.i18n.error.general);
          break;
      }
    });
  }

  get resultTitle() {
    if (this.data.resultType === WizardResultTypeEnum.REGISTRATION) {
      return this.i18n.user.title.registrationDone;
    } else {
      return this.data.resultTitle;
    }
  }

  get mobileResultTitle() {
    if (this.data.resultType === WizardResultTypeEnum.REGISTRATION) {
      return this.i18n.user.mobileTitle.registrationDone;
    } else {
      return this.data.resultTitle;
    }
  }
}
