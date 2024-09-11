import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Injector,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  AvailabilityEnum,
  BasicProfileFieldEnum,
  CustomFieldBinaryValues,
  CustomFieldDetailed,
  GeographicalCoordinate,
  Image,
  PhoneKind,
  SendMediumEnum,
  StoredFile,
  TempImageTargetEnum,
  UserDataForNew,
  WizardExecutionData,
  WizardKind,
  WizardStepDetailed,
  WizardStepField,
  WizardStepFieldKind
} from 'app/api/models';
import { ImagesService } from 'app/api/services/images.service';
import { WizardsService } from 'app/api/services/wizards.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
import { empty, focusFirstInvalid, mergeValidity, validateBeforeSubmit } from 'app/shared/helper';
import { MapsService } from 'app/ui/core/maps.service';
import { RunWizardComponent } from 'app/ui/wizards/run-wizard.component';
import { BehaviorSubject, Observable, of } from 'rxjs';

/**
 * A single field in a custom wizard - form fields execution
 */
@Component({
  selector: '0,run-wizard-step-field',
  templateUrl: 'run-wizard-step-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunWizardStepFieldComponent extends BaseComponent implements OnInit {
  @HostBinding('class.any-label-value') anyLabelValueClass = true;
  @HostBinding('class.d-flex') dFlexClass = true;
  @HostBinding('class.flex-column') flexColumnClass = true;
  @HostBinding('class.keep-margins') keepMarginsClass = true;

  WizardStepFieldKind = WizardStepFieldKind;
  BasicProfileFieldEnum = BasicProfileFieldEnum;
  PhoneKind = PhoneKind;
  AvailabilityEnum = AvailabilityEnum;
  TempImageTargetEnum = TempImageTargetEnum;
  empty = empty;

  @Input() data: WizardExecutionData;
  @Input() field: WizardStepField;
  private _user: FormGroup;
  @Input() get user(): FormGroup {
    return this._user;
  }
  set user(user: FormGroup) {
    this._user = user;
    this.customProfileValues = user ? (user.controls.customValues as FormGroup) : null;
  }
  @Input() mobilePhone: FormGroup;
  @Input() landLinePhone: FormGroup;
  @Input() defineAddress: FormControl;
  @Input() address: FormGroup;
  @Input() defineContactInfo: FormControl;
  @Input() contactInfo: FormGroup;
  @Input() customValues: FormGroup;
  @Input() emailValidation: FormControl;
  @Input() smsValidation: FormControl;
  @Input() submitAction: Function;

  @Output() imageUploaded = new EventEmitter<Image>();
  @Output() imageRemoved = new EventEmitter<Image>();
  @Output() customImagesUploaded = new EventEmitter<Image[]>();
  @Output() customFilesUploaded = new EventEmitter<StoredFile[]>();

  customProfileValues: FormGroup;

  dataForNew: UserDataForNew;
  step: WizardStepDetailed;

  formControl: AbstractControl;
  privacyControl: AbstractControl;
  privacyField: string;
  label: string;
  required: boolean;
  customField: CustomFieldDetailed;
  binaryValues: CustomFieldBinaryValues;
  basicOrPhone: boolean;

  image$ = new BehaviorSubject<Image>(null);
  @Input() get image(): Image {
    return this.image$.value;
  }
  set image(image: Image) {
    this.image$.next(image);
  }

  location$ = new BehaviorSubject<GeographicalCoordinate>(null);
  get location(): GeographicalCoordinate {
    return this.location$.value;
  }
  set location(location: GeographicalCoordinate) {
    this.location$.next(location);
  }

  locatingAddress$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private changeDetector: ChangeDetectorRef,
    private imagesService: ImagesService,
    public maps: MapsService,
    private wizardsService: WizardsService,
    public fieldHelper: FieldHelperService,
    public runWizard: RunWizardComponent
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.step = this.data.step;
    if (this.field.wizardField) {
      this.customField = this.step.customFields?.find(cf => cf.internalName === this.field.wizardField);
      this.label = this.customField.name;
      this.formControl = this.customValues.controls[this.customField.internalName];
      this.binaryValues = this.data.binaryValues;
    }
    if (this.data.wizard.kind === WizardKind.REGISTRATION) {
      this.dataForNew = this.step.dataForNew || {};
      const profileField = this.field.basicProfileField || this.field.customProfileField;
      const actions = this.dataForNew.profileFieldActions[profileField];
      const managePrivacy = actions?.managePrivacy;
      if (this.field.customProfileField) {
        this.customField = this.dataForNew.customFields?.find(cf => cf.internalName === this.field.customProfileField);
        this.label = this.customField.name;
        const customValues = this.user.controls.customValues as FormGroup;
        this.formControl = customValues.controls[this.customField.internalName];
        this.privacyControl = managePrivacy ? this.user.controls.hiddenFields : null;
        this.privacyField = managePrivacy ? this.customField.internalName : null;
        this.binaryValues = this.dataForNew.binaryValues;
      } else {
        this.basicOrPhone = [
          BasicProfileFieldEnum.NAME,
          BasicProfileFieldEnum.USERNAME,
          BasicProfileFieldEnum.EMAIL,
          BasicProfileFieldEnum.PHONE
        ].includes(this.field.basicProfileField);
        switch (this.field.basicProfileField) {
          case BasicProfileFieldEnum.IMAGE:
            this.label = this.i18n.user.title.image;
            break;
          case BasicProfileFieldEnum.NAME:
            this.label = this.dataForNew.nameLabel || this.i18n.user.name;
            this.formControl = this.user.controls.name;
            this.required = true;
            break;
          case BasicProfileFieldEnum.USERNAME:
            this.label = this.i18n.user.username;
            this.formControl = this.user.controls.username;
            this.required = true;
            break;
          case BasicProfileFieldEnum.EMAIL:
            this.label = this.i18n.user.email;
            this.formControl = this.user.controls.email;
            this.required = this.dataForNew.emailRequired;
            if (managePrivacy) {
              this.privacyControl = this.user.controls.hiddenFields;
              this.privacyField = BasicProfileFieldEnum.EMAIL;
            }
            break;
          case BasicProfileFieldEnum.ADDRESS:
            this.label = this.i18n.address.address;
            break;
          case BasicProfileFieldEnum.PHONE:
            switch (this.field.phoneKind) {
              case PhoneKind.LAND_LINE:
                this.label = this.i18n.phone.landLine;
                this.formControl = this.landLinePhone.controls.number;
                this.required = this.dataForNew.phoneConfiguration.landLineAvailability === AvailabilityEnum.REQUIRED;
                if (managePrivacy) {
                  this.privacyControl = this.landLinePhone.controls.hidden;
                }
                break;
              case PhoneKind.MOBILE:
                this.label = this.i18n.phone.mobile;
                this.formControl = this.mobilePhone.controls.number;
                this.required = this.dataForNew.phoneConfiguration.mobileAvailability === AvailabilityEnum.REQUIRED;
                if (managePrivacy) {
                  this.privacyControl = this.mobilePhone.controls.hidden;
                }
                break;
            }
            break;
        }
      }
    }
  }

  onUploadDone(image: Image) {
    // First remove any previous image, then emit that a new image is uploaded
    this.addSub(
      this.doRemoveImage().subscribe(() => {
        this.image = image;
        this.imageUploaded.emit(this.image);
        this.changeDetector.detectChanges();
      })
    );
  }

  removeImage() {
    this.addSub(this.doRemoveImage().subscribe());
  }

  private doRemoveImage(): Observable<Image> {
    if (this.image) {
      const result = this.image;
      return this.errorHandler.requestWithCustomErrorHandler(() => {
        return new Observable(obs => {
          this.imagesService.deleteImage({ id: this.image.id }).subscribe(() => {
            this.imageRemoved.emit(this.image);
            this.image = null;
            this.changeDetector.detectChanges();
            obs.next(result);
          });
        });
      });
    } else {
      return of(null);
    }
  }

  locateAddress() {
    const value = this.address.value;
    this.locatingAddress$.next(true);
    this.addSub(
      this.maps.geocode(value).subscribe(
        coords => {
          this.address.patchValue({ location: coords });
          this.changeDetector.detectChanges();
        },
        () => this.mapShown()
      )
    );
  }

  mapShown() {
    this.locatingAddress$.next(false);
    this.changeDetector.detectChanges();
  }

  passwordForm(index: number): FormGroup {
    const passwords = this.user ? (this.user.controls.passwords as FormArray) : null;
    return passwords ? (passwords.controls[index] as FormGroup) : null;
  }

  sendEmailCode(button: CountdownButtonComponent) {
    const email = this.user.controls.email;
    this.doSendCode(button, email, SendMediumEnum.EMAIL);
  }

  sendSmsCode(button: CountdownButtonComponent) {
    const mobile = this.mobilePhone.controls.number;
    this.doSendCode(button, mobile, SendMediumEnum.SMS);
  }

  get codeSentMessage() {
    return () => this.i18n.wizard.codeSent;
  }

  private doSendCode(button: CountdownButtonComponent, control: AbstractControl, medium: SendMediumEnum) {
    const nonValid = validateBeforeSubmit(control, true) as FormControl[];
    mergeValidity(nonValid).subscribe(isValid => {
      const to = control.value;
      if (isValid) {
        this.addSub(
          this.wizardsService
            .sendWizardVerificationCode({
              key: this.data.key,
              body: { medium, to }
            })
            .subscribe(() => {
              this.notification.snackBar(this.i18n.general.sentCodeTo(to));
            })
        );
      } else {
        button.reenable();
        focusFirstInvalid();
      }
    });
  }

  isContactInfoReadonly(): boolean {
    return this.step.fields.find(f => f.kind === WizardStepFieldKind.CONTACT_INFO)?.readOnly;
  }
}
