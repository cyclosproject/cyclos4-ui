import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AddressManage, AvailabilityEnum, ContactInfoManage, CreateDeviceConfirmation,
  CustomField, CustomFieldDetailed, DataForEditFullProfile, DeviceConfirmationTypeEnum,
  FullProfileEdit, Image, PhoneEditWithId, PhoneKind, PhoneManage
} from 'app/api/models';
import { ImagesService, PhonesService, UsersService } from 'app/api/services';
import { AddressHelperService } from 'app/core/address-helper.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { empty, isTouched, locateControl, scrollTop, validateBeforeSubmit } from 'app/shared/helper';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { VerifyPhoneComponent } from 'app/users/profile/verify-phone.component';
import { cloneDeep } from 'lodash';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Menu } from 'app/shared/menu';

const IMAGE_MANAGED_TIMEOUT = 6_000;

const BASIC_FIELDS = ['name', 'username', 'email'];
export type Availability = 'disabled' | 'single' | 'multiple';

let modelIndex = 0;

/**
 * Edits the full user profile
 */
@Component({
  selector: 'edit-profile',
  templateUrl: 'edit-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProfileComponent
  extends BasePageComponent<DataForEditFullProfile>
  implements OnInit, OnDestroy {

  ConfirmationMode = ConfirmationMode;
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  byManager: boolean;
  param: string;

  ready$ = new BehaviorSubject(false);
  operatorOfManagedUser: boolean;
  enabledFields: Set<string>;
  editableFields: Set<string>;
  managePrivacyFields: Set<string>;
  userCustomFields: Map<string, CustomFieldDetailed>;
  canConfirm: boolean;

  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

  // Forms which will be submitted. Need to keep track in order to match the validation errors
  user: FormGroup;
  createLandLinePhones: FormGroup[] = [];
  modifyLandLinePhones: FormGroup[] = [];
  createMobilePhones: FormGroup[] = [];
  modifyMobilePhones: FormGroup[] = [];
  createAddresses: FormGroup[] = [];
  modifyAddresses: FormGroup[] = [];
  createContactInfos: FormGroup[] = [];
  modifyContactInfos: FormGroup[] = [];

  // Additional form controls
  confirmationPassword: FormControl;
  defineSingleAddress: FormControl;
  singleMobile: FormGroup;
  singleLandLine: FormGroup;
  singleAddress: FormGroup;

  // Single models
  singleMobileManage: PhoneManage;
  singleLandLineManage: PhoneManage;
  singleAddressManage: PhoneManage;

  // Arrays to keep the visible models
  images: Image[];
  uploadedImages: Image[];
  phones: PhoneManage[];
  addresses: AddressManage[];
  locatedAddresses: AddressManage[];
  contactInfos: ContactInfoManage[];
  reorderImages: string[];

  // These keep track of removed models
  removedPhones: string[];
  removedAddresses: string[];
  removedContactInfos: string[];
  removedImages: string[];

  constructor(
    injector: Injector,
    private usersService: UsersService,
    private imagesService: ImagesService,
    private phonesService: PhonesService,
    private addressHelper: AddressHelperService,
    private modal: BsModalService,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || ApiHelper.SELF;

    this.createDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.EDIT_PROFILE
    });

    this.headingActions = [
      new HeadingAction('search', this.i18n.general.view, () =>
        this.router.navigate(['users', this.param, 'profile']),
        true)
    ];

    this.addSub(this.usersService.getDataForEditFullProfile({ user: this.param }).subscribe(data => {
      this.data = data;

      const role = data.userConfiguration.role;
      const user = data.userConfiguration.details;

      const self = this.authHelper.isSelf(user);
      this.byManager = !this.authHelper.isSelfOrOwner(user);
      this.operatorOfManagedUser = role === 'operator' && !this.authHelper.isSelf(user.user);

      if (self) {
        // Update the current user to reflect any changes if editing own profile
        this.login.user$.next({
          id: this.login.user.id,
          display: data.userConfiguration.details.display,
          image: empty(data.images) ? null : data.images[0]
        });
      }

      this.initialize(data);

      // Handle the case that the confirmation password cannot be used
      this.canConfirm = this.authHelper.canConfirm(data.confirmationPasswordInput);
      if (!this.canConfirm) {
        this.notification.warning(this.authHelper.getConfirmationMessage(data.confirmationPasswordInput));
        this.router.navigate(['users', 'profile']);
      }

      this.ready$.next(true);
    }));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.removeAllTempImages();
  }

  locateControl(locator: FormControlLocator): AbstractControl {
    // As we have the submitted forms with the same names as FullProfileEdit, we can locate directly
    return locateControl(this, locator);
  }

  hasField(name: string): boolean {
    return this.enabledFields.has(name);
  }

  isRequired(name: string): boolean {
    if (!this.canEdit(name)) {
      return false;
    }
    if (name === 'name' || name === 'username') {
      return true;
    } else if (name === 'email') {
      return this.data.userConfiguration.emailRequired;
    } else {
      const customField = this.userCustomFields.get(name);
      return customField && customField.required;
    }
  }

  private fieldName(field: string | CustomField): string {
    if (typeof field === 'string') {
      return field;
    } else {
      return field.internalName;
    }
  }

  isEmpty(field: string | CustomField): boolean {
    const name = this.fieldName(field);
    const user = this.user.value;
    return empty(user[name]) && empty((user.customValues || {})[name]);
  }

  canEdit(field: string | CustomField): boolean {
    return this.editableFields.has(this.fieldName(field));
  }

  canManagePrivacy(field: string | CustomField): boolean {
    return this.managePrivacyFields.has(this.fieldName(field));
  }

  get landLineAvailability(): Availability {
    const data = this.data.phoneConfiguration || {};
    return this.getAvailability(data.maxLandLines);
  }

  get mobileAvailability(): Availability {
    const data = this.data.phoneConfiguration || {};
    return this.getAvailability(data.maxMobiles);
  }

  get addressAvailability(): Availability {
    const data = this.data.addressConfiguration || {};
    return this.getAvailability(data.maxAddresses);
  }

  get contactInfoAvailability(): Availability {
    const data = this.data.contactInfoConfiguration || {};
    return this.getAvailability(data.maxContactInfos);
  }

  get imagesAvailability(): Availability {
    const data = this.data.imageConfiguration || {};
    return this.getAvailability(data.maxImages);
  }

  private getAvailability(max: number): Availability {
    return max == null || max <= 0 ? 'disabled' : max === 1 ? 'single' : 'multiple';
  }

  saveOrConfirm() {
    if (this.data.confirmationPasswordInput) {
      // A confirmation is required
      this.notification.confirm({
        title: this.i18n.user.title.confirmation,
        passwordInput: this.data.confirmationPasswordInput,
        createDeviceConfirmation: this.createDeviceConfirmation,
        callback: params => {
          this.save(params.confirmationPassword);
        }
      });
    } else {
      // Save directly
      this.save();
    }
  }

  save(confirmationPassword?: string) {
    const fullForm = new FormGroup({
      user: this.user,
      createLandLinePhones: new FormArray(this.createLandLinePhones),
      modifyLandLinePhones: new FormArray(this.modifyLandLinePhones),
      createMobilePhones: new FormArray(this.createMobilePhones),
      modifyMobilePhones: new FormArray(this.modifyMobilePhones),
      createAddresses: new FormArray(this.createAddresses),
      modifyAddresses: new FormArray(this.modifyAddresses),
      createContactInfos: new FormArray(this.createContactInfos),
      modifyContactInfos: new FormArray(this.modifyContactInfos)
    });
    if (!confirmationPassword && this.confirmationPassword) {
      fullForm.setControl('confirmationPassword', this.confirmationPassword);
      confirmationPassword = this.confirmationPassword.value;
    }
    if (!validateBeforeSubmit(fullForm)) {
      return;
    }

    this.addSub(this.usersService.saveUserFullProfile({
      user: this.param,
      confirmationPassword: confirmationPassword,
      body: this.editForSubmit()
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.user.profileSaved);
      this.uploadedImages = null;
      this.reload();
      scrollTop();
    }));
  }

  private editForSubmit(): FullProfileEdit {
    const edit: FullProfileEdit = {
      user: isTouched(this.user) ? this.user.value : null,
      createLandLinePhones: this.createLandLinePhones.map(f => f.value),
      modifyLandLinePhones: this.modifyLandLinePhones.map(f => f.value),
      createMobilePhones: this.createMobilePhones.map(f => f.value),
      modifyMobilePhones: this.modifyMobilePhones.map(f => f.value),
      removePhones: this.removedPhones,
      createAddresses: this.createAddresses.map(f => f.value),
      modifyAddresses: this.modifyAddresses.map(f => f.value),
      removeAddresses: this.removedAddresses,
      createContactInfos: this.createContactInfos.map(f => f.value),
      modifyContactInfos: this.modifyContactInfos.map(f => f.value),
      removeContactInfos: this.removedContactInfos,
      addImages: this.uploadedImages.map(i => i.id),
      removeImages: this.removedImages,
      reorderImages: this.reorderImages
    };

    // We just have to handle single phones / addresses, which can dynamically create / modify / remove models

    // Single mobile
    if (this.mobileAvailability === 'single') {
      const phone = this.singleMobile.value;
      const id = phone.id;
      if (id) {
        if (empty(phone.number)) {
          edit.removePhones.push(id);
        } else if (isTouched(this.singleMobile)) {
          edit.modifyMobilePhones = [phone];
        }
      } else if (!empty(phone.number)) {
        edit.createMobilePhones = [phone];
      }
    }

    // Single land-line
    if (this.landLineAvailability === 'single') {
      const phone = this.singleLandLine.value;
      const id = phone.id;
      if (id) {
        if (empty(phone.number)) {
          edit.removePhones.push(id);
        } else if (isTouched(this.singleLandLine)) {
          edit.modifyLandLinePhones = [phone];
        }
      } else if (!empty(phone.number)) {
        edit.createLandLinePhones = [phone];
      }
    }

    // Single address
    if (this.addressAvailability === 'single') {
      const address = this.singleAddress.value;
      const id = address.id;
      const defined = this.defineSingleAddress.value;
      if (id) {
        if (!defined) {
          edit.removeAddresses.push(id);
        } else if (isTouched(this.singleAddress)) {
          edit.modifyAddresses = [address];
        }
      } else if (defined) {
        edit.createAddresses = [address];
      }
    }

    return edit;
  }

  private initialize(data: DataForEditFullProfile) {
    this.userCustomFields = new Map();
    this.enabledFields = new Set();
    this.editableFields = new Set();
    this.managePrivacyFields = new Set();

    this.removedPhones = [];
    this.removedAddresses = [];
    this.removedContactInfos = [];
    this.removedImages = [];

    if (data.contactInfoConfiguration && data.contactInfoConfiguration.availability !== AvailabilityEnum.DISABLED) {
      // Additional contacts are enabled. Copy the fields to the address configuration
      data.addressConfiguration.contactInfoEnabled = true;
      data.addressConfiguration.contactInfoFields = data.contactInfoConfiguration.customFields;
    }

    // Cache the field actions to avoid having to calculate every time
    const fieldActions = data.userConfiguration.profileFieldActions;
    for (const name in fieldActions) {
      if (!fieldActions.hasOwnProperty(name)) {
        continue;
      }
      this.enabledFields.add(name);
      const actions = fieldActions[name];
      if (actions.edit) {
        this.editableFields.add(name);
      }
      if (actions.managePrivacy) {
        this.managePrivacyFields.add(name);
      }
      const customField = this.data.userConfiguration.customFields.find(cf => cf.internalName === name);
      if (customField) {
        this.userCustomFields.set(name, customField);
      }
    }

    // Initialize the forms
    this.user = this.buildUserForm();
    if (data.confirmationPasswordInput) {
      this.confirmationPassword = this.formBuilder.control('', Validators.required);
    }

    this.images = this.data.images.slice();
    this.uploadedImages = [];
    this.phones = [];

    // Prepare the mobile forms
    if (this.mobileAvailability === 'single') {
      this.singleMobileManage = empty(data.mobilePhones)
        ? data.phoneConfiguration.mobilePhone
        : data.mobilePhones[0];
      this.singleMobile = this.buildMobileForm(this.singleMobileManage);
    } else {
      (data.mobilePhones || []).forEach(p => {
        const form = this.buildMobileForm(p);
        if (this.mobileAvailability === 'multiple') {
          this.phones.push(p);
          this.addSub(form.valueChanges.subscribe(() => {
            if (!this.modifyMobilePhones.includes(form)) {
              this.modifyMobilePhones.push(form);
            }
          }));
        }
      });
    }

    // Prepare the land-line forms
    if (this.landLineAvailability === 'single') {
      this.singleLandLineManage = empty(data.landLinePhones)
        ? data.phoneConfiguration.landLinePhone
        : data.landLinePhones[0];
      this.singleLandLine = this.buildLandLineForm(this.singleLandLineManage);
    } else {
      (data.landLinePhones || []).forEach(p => {
        const form = this.buildLandLineForm(p);
        if (this.landLineAvailability === 'multiple') {
          this.phones.push(p);
          this.addSub(form.valueChanges.subscribe(() => {
            if (!this.modifyLandLinePhones.includes(form)) {
              this.modifyLandLinePhones.push(form);
            }
          }));
        }
      });
    }

    // Prepare the address forms
    if (this.addressAvailability === 'single') {
      this.defineSingleAddress = this.formBuilder.control(
        !empty(data.addresses) || data.addressConfiguration.availability === 'required');
      this.singleAddressManage = empty(data.addresses)
        ? data.addressConfiguration.address
        : data.addresses[0];
      this.singleAddress = this.buildAddressForm(this.singleAddressManage);
    } else {
      (data.addresses || []).forEach(p => {
        const form = this.buildAddressForm(p);
        if (this.addressAvailability === 'multiple') {
          this.addSub(form.valueChanges.subscribe(() => {
            if (!this.modifyAddresses.includes(form)) {
              this.modifyAddresses.push(form);
            }
          }));
        }
      });
      this.addresses = (data.addresses || []).slice();
    }

    // Prepare the contact-info forms
    (data.contactInfos || []).forEach(p => {
      const form = this.buildContactInfoForm(p);
      this.addSub(form.valueChanges.subscribe(() => {
        if (!this.modifyContactInfos.includes(form)) {
          this.modifyContactInfos.push(form);
        }
      }));
    });
    this.contactInfos = (data.contactInfos || []).slice();
  }

  private buildUserForm(): FormGroup {
    const data = this.data.userConfiguration;
    const user = this.data.user;

    const form = this.formBuilder.group({
      version: user.version,
      hiddenFields: [user.hiddenFields || []]
    });

    // Process the basic fields
    for (const field of BASIC_FIELDS) {
      if (this.hasField(field)) {
        form.setControl(field, this.formBuilder.control({
          value: user[field],
          disabled: !this.canEdit(field)
        }, this.isRequired(field) ? Validators.required : null));
      } else {
        form.removeControl(field);
      }
    }
    // Set the custom fields control
    form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      currentValues: user.customValues,
      disabledProvider: cf => !this.canEdit(cf.internalName)
    }));

    return form;
  }

  private stampDataAndInitForm(model: any, form: FormGroup) {
    model.idSuffix = `_${model.id || modelIndex++}`;
    model.form = form;
    form.patchValue(model);
  }

  private buildLandLineForm(phone: PhoneManage): FormGroup {
    phone['kind'] = PhoneKind.LAND_LINE;
    const data = this.data.phoneConfiguration;
    const single = data.maxLandLines === 1;
    const form = this.buildPhoneForm(single, data.landLineAvailability === AvailabilityEnum.REQUIRED);
    if (data.extensionEnabled) {
      form.setControl('extension', this.formBuilder.control(null));
    }
    this.stampDataAndInitForm(phone, form);
    return form;
  }

  private buildMobileForm(phone: PhoneManage): FormGroup {
    phone['kind'] = PhoneKind.MOBILE;
    const data = this.data.phoneConfiguration;
    const single = data.maxMobiles === 1;
    const form = this.buildPhoneForm(single, data.mobileAvailability === AvailabilityEnum.REQUIRED);
    if (data.smsEnabled) {
      form.setControl('verified', this.formBuilder.control(phone.verified));
      form.setControl('enabledForSms', this.formBuilder.control(phone.enabledForSms));
    }
    this.stampDataAndInitForm(phone, form);
    return form;
  }

  private buildPhoneForm(single: boolean, required: boolean): FormGroup {
    // When multiple phones, number is always required. Otherwise, is required when phones are required.
    const numberRequired = !single || required;
    return this.formBuilder.group({
      id: null,
      version: null,
      hidden: null,
      name: [null, Validators.required],
      number: [null, numberRequired ? Validators.required : null]
    });
  }

  private buildAddressForm(address: AddressManage): FormGroup {
    const data = this.data.addressConfiguration;
    const form = this.addressHelper.addressFormGroup(data);
    this.stampDataAndInitForm(address, form);
    for (const field of data.enabledFields) {
      let previous = address[field] || null;
      this.addSub(form.get(field).valueChanges.subscribe(newVal => {
        if (previous !== newVal) {
          form.get('location').patchValue({ latitude: null, longitude: null });
        }
        previous = newVal;
      }));
    }
    return form;
  }

  private buildContactInfoForm(contactInfo: ContactInfoManage): FormGroup {
    const data = this.data.contactInfoConfiguration;
    const form = this.formBuilder.group({
      id: null,
      version: null,
      hidden: null,
      name: [null, Validators.required],
      image: null,
      email: null,
      mobilePhone: null,
      landLinePhone: null,
      landLineExtension: null,
      address: null
    });
    form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields));
    this.stampDataAndInitForm(contactInfo, form);
    return form;
  }

  phoneNameLabel(phone: PhoneManage): string {
    if (phone['kind'] === PhoneKind.LAND_LINE) {
      return this.i18n.phone.nameLandLine;
    } else {
      return this.i18n.phone.nameMobile;
    }
  }

  phoneExample(phone: PhoneManage): string {
    if (phone['kind'] === PhoneKind.LAND_LINE) {
      return this.data.phoneConfiguration.landLineExample;
    } else {
      return this.data.phoneConfiguration.mobileExample;
    }
  }

  phoneNumberLabel(phone: PhoneManage): string {
    if (phone['kind'] === PhoneKind.LAND_LINE) {
      return this.i18n.phone.numberLandLine;
    } else {
      return this.i18n.phone.numberMobile;
    }
  }

  /**
   * A phone has the SMS field it the configuration alloes, the phone is a persistent mobile phone and its number is untouched
   */
  phoneHasSms(phone: PhoneManage): boolean {
    if (!this.data.phoneConfiguration.smsEnabled) {
      return false;
    }
    return phone['id'] && phone['kind'] === PhoneKind.MOBILE && phone.number === phone['form'].value.number;
  }

  hasExtension(phone: PhoneManage): boolean {
    return this.data.phoneConfiguration.extensionEnabled && phone['kind'] === PhoneKind.LAND_LINE;
  }

  get canCreateLandLine(): boolean {
    if (this.landLineAvailability !== 'multiple') {
      return false;
    }
    const max = this.data.phoneConfiguration.maxLandLines;
    const current = this.phones.filter(p => p['kind'] === PhoneKind.LAND_LINE).length;
    return current < max;
  }

  get canCreateMobile(): boolean {
    if (this.mobileAvailability !== 'multiple') {
      return false;
    }
    const max = this.data.phoneConfiguration.maxMobiles;
    const current = this.phones.filter(p => p['kind'] === PhoneKind.MOBILE).length;
    return current < max;
  }

  get canCreateAddress(): boolean {
    if (this.addressAvailability !== 'multiple') {
      return false;
    }
    const max = this.data.addressConfiguration.maxAddresses;
    const current = this.addresses.length;
    return current < max;
  }

  get canCreateContactInfo(): boolean {
    if (this.contactInfoAvailability !== 'multiple') {
      return false;
    }
    const max = this.data.contactInfoConfiguration.maxContactInfos;
    const current = this.contactInfos.length;
    return current < max;
  }

  get canUploadImages(): boolean {
    const max = this.data.imageConfiguration.maxImages;
    const current = this.images.length;
    return current < max;
  }

  addMobile() {
    const phone = cloneDeep(this.data.phoneConfiguration.mobilePhone);
    phone.name = '';
    this.createMobilePhones.push(this.buildMobileForm(phone));
    this.phones = [phone, ...this.phones];
    this.setFocus('phone_name', phone);
  }

  addLandLine() {
    const phone = cloneDeep(this.data.phoneConfiguration.landLinePhone);
    phone.name = '';
    this.createLandLinePhones.push(this.buildLandLineForm(phone));
    this.phones = [phone, ...this.phones];
    this.setFocus('phone_name', phone);
  }

  addAddress() {
    const address = cloneDeep(this.data.addressConfiguration.address);
    address.name = '';
    this.createAddresses.push(this.buildAddressForm(address));
    this.addresses = [address, ...this.addresses];
    this.setFocus('address_name', address);
  }

  addContactInfo() {
    const contactInfo = cloneDeep(this.data.contactInfoConfiguration.contactInfo);
    this.createContactInfos.push(this.buildContactInfoForm(contactInfo));
    this.contactInfos = [contactInfo, ...this.contactInfos];
    this.setFocus('contact-info_name', contactInfo);
  }

  removePhone(phone: PhoneManage) {
    this.phones = this.phones.filter(p => p !== phone);
    const id = phone['id'];
    if (id) {
      this.removedPhones.push(id);
    } else {
      const form = phone['form'];
      this.createMobilePhones = this.createMobilePhones.filter(f => f !== form);
      this.createLandLinePhones = this.createLandLinePhones.filter(f => f !== form);
    }
  }

  removeAddress(address: AddressManage) {
    this.addresses = this.addresses.filter(a => a !== address);
    const id = address['id'];
    if (id) {
      this.removedAddresses.push(id);
    } else {
      const form = address['form'];
      this.createAddresses = this.createAddresses.filter(f => f !== form);
    }
  }

  removeContactInfo(contactInfo: ContactInfoManage) {
    this.contactInfos = this.contactInfos.filter(ci => ci !== contactInfo);
    const id = contactInfo['id'];
    if (id) {
      this.removedContactInfos.push(id);
    } else {
      const form = contactInfo['form'];
      this.createContactInfos = this.createContactInfos.filter(f => f !== form);
    }
  }

  private setFocus(prefix: string, model: any) {
    const id = prefix + model.idSuffix;
    setTimeout(() => document.getElementById(id).focus(), 10);
  }

  public showEnableForSms(phoneForm: FormGroup) {
    if (!this.data.phoneConfiguration.smsEnabled) {
      return false;
    }
    if (this.byManager) {
      return phoneForm.value.verified;
    } else {
      return true;
    }
  }

  public maybeVerify(event: MouseEvent, id?: string) {
    // The verification popup is only for self
    if (this.byManager) {
      return;
    }
    let phone: PhoneManage;
    if (this.singleMobile) {
      phone = this.singleMobileManage;
    } else {
      phone = this.phones.find(p => p['id'] === id);
    }
    if (phone == null) {
      throw new Error(`Mobile phone not found: ${id}`);
    }
    if (!phone.verified) {
      // Need to verify this phone first
      this.verify(phone);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private verify(phone: PhoneEditWithId) {
    const ref = this.modal.show(VerifyPhoneComponent, {
      class: 'modal-form',
      initialState: {
        phone: phone
      }
    });
    const comp = ref.content as VerifyPhoneComponent;
    this.addSub(comp.verified.pipe(take(1)).subscribe(flag => {
      if (flag) {
        // As the phone has been modified, we have to fetch it again (the version have changed)
        this.phonesService.getPhoneDataForEdit({ id: phone.id, fields: ['phone'] }).subscribe(data => {
          const newPhone = data.phone as PhoneEditWithId;
          newPhone.id = phone.id;
          newPhone.enabledForSms = true;
          const form = this.buildMobileForm(newPhone);
          // Initially touch the form, because we've manually set the enabledForSms
          form.markAsTouched();
          const index = (this.phones || []).findIndex(p => p['id'] === phone.id);
          if (index >= 0) {
            // Update the phones list
            const phones = this.phones.slice();
            phones[index] = newPhone;
            this.phones = phones;
            // Update the modify forms
            const formIndex = this.modifyMobilePhones.findIndex(f => f.value.id === phone.id);
            const newForms = this.modifyMobilePhones.slice();
            if (formIndex >= 0) {
              // Was already modified
              newForms[formIndex] = form;
            } else {
              // Add to the modified list
              newForms.push(form);
            }
            this.modifyMobilePhones = newForms;
          }
          if (this.singleMobile) {
            this.singleMobile = form;
          }

          // Only now hide the modal
          ref.hide();

          this.changeDetector.detectChanges();
        });
      }
    }));
  }

  removeSingleImage() {
    this.removeAllTempImages();
    this.removeExistingImages();
    this.notification.snackBar(this.i18n.user.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
  }

  private removeAllTempImages() {
    (this.uploadedImages || []).forEach(img => {
      this.addSub(this.imagesService.deleteImage({ idOrKey: img.id }).subscribe());
    });
    this.uploadedImages = [];
  }

  private removeExistingImages() {
    if (empty(this.removedImages) && !empty(this.data.images)) {
      this.removedImages = (this.data.images || []).map(i => i.id);
    }
    this.images = [];
  }

  onUploadDone(images: Image[]) {
    if (this.imagesAvailability === 'single') {
      this.removeAllTempImages();
      this.removeExistingImages();

      // When there's a single image, we have to remove the existing one, if any
      this.images = images;
    } else {
      // Multiple images: append them
      this.images = [...this.images, ...images];
    }
    this.notification.snackBar(this.i18n.user.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
    this.uploadedImages = [...(this.uploadedImages || []), ...images];
    this.changeDetector.detectChanges();
  }

  manageImages() {
    const ref = this.modal.show(ManageImagesComponent, {
      class: 'modal-form',
      initialState: {
        images: this.images
      }
    });
    const component = ref.content as ManageImagesComponent;
    this.addSub(component.result.pipe(take(1)).subscribe(result => {
      const hasRemovedImages = !empty(result.removedImages);
      if (hasRemovedImages) {
        // At least one removed image
        for (const removed of result.removedImages) {
          if (!this.removedImages.includes(removed) && (this.data.images || []).find(i => i.id === removed) != null) {
            // This removed image is a previously existing image
            this.removedImages = [removed, ...this.removedImages];
          } else if (this.uploadedImages.find(i => i.id === removed) != null) {
            // This removed image is an uploaded temp image
            this.imagesService.deleteImage({ idOrKey: removed }).subscribe();
          }
        }
        // Update the images and uploaded images lists
        this.images = this.images.filter(i => !result.removedImages.includes(i.id));
        this.uploadedImages = this.uploadedImages.filter(i => !result.removedImages.includes(i.id));
      }
      const hasOrderChanged = !empty(result.order);
      if (hasOrderChanged) {
        // The order has changed
        this.reorderImages = result.order;
        this.images = this.reorderImages.map(id => {
          return this.images.find(i => i.id === id);
        });
      }
      if (hasRemovedImages || hasOrderChanged) {
        this.notification.snackBar(this.i18n.user.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
      }
      ref.hide();
    }));
  }

  fieldSize(cf: CustomFieldDetailed) {
    return this.fieldHelper.fieldSize(cf);
  }

  locateAddress(addressForm: FormGroup) {
    const value = addressForm.value;
    this.addSub(this.maps.geocode(value).subscribe(coords => {
      addressForm.patchValue({ location: coords });
      this.changeDetector.detectChanges();
    }));
  }

  resolveMenu(data: DataForEditFullProfile) {
    const user = data.userConfiguration.details;
    return this.authHelper.userMenu(user, Menu.EDIT_MY_PROFILE);
  }

}
