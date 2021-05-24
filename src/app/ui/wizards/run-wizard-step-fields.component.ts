import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  AvailabilityEnum, CustomFieldDetailed, GeographicalCoordinate,
  Image, SendMediumEnum, StoredFile, TempImageTargetEnum, WizardExecutionData, WizardKind, WizardStepDetailed
} from 'app/api/models';
import { ImagesService } from 'app/api/services/images.service';
import { WizardsService } from 'app/api/services/wizards.service';
import { BaseComponent } from 'app/shared/base.component';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
import { empty, focusFirstInvalid, mergeValidity, validateBeforeSubmit } from 'app/shared/helper';
import { MapsService } from 'app/ui/core/maps.service';
import { RunWizardComponent } from 'app/ui/wizards/run-wizard.component';
import { BehaviorSubject, Observable, of } from 'rxjs';

/**
 * Step in a custom wizard - form fields
 */
@Component({
  selector: 'run-wizard-step-fields',
  templateUrl: 'run-wizard-step-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunWizardStepFieldsComponent
  extends BaseComponent
  implements OnInit {

  AvailabilityEnum = AvailabilityEnum;
  TempImageTargetEnum = TempImageTargetEnum;
  empty = empty;

  @Input() data: WizardExecutionData;
  private _user: FormGroup;
  @Input() get user(): FormGroup {
    return this._user;
  }
  set user(user: FormGroup) {
    this._user = user;
    this.customProfileValues = user ? user.controls.customValues as FormGroup : null;
  }
  @Input() mobilePhone: FormGroup;
  @Input() landLinePhone: FormGroup;
  @Input() defineAddress: FormControl;
  @Input() address: FormGroup;
  @Input() customValues: FormGroup;
  @Input() emailValidation: FormControl;
  @Input() smsValidation: FormControl;

  @Output() imageUploaded = new EventEmitter<Image>();
  @Output() imageRemoved = new EventEmitter<Image>();
  @Output() customImagesUploaded = new EventEmitter<Image[]>();
  @Output() customFilesUploaded = new EventEmitter<StoredFile[]>();

  customProfileValues: FormGroup;

  step: WizardStepDetailed;
  emailAvailability: AvailabilityEnum = AvailabilityEnum.DISABLED;
  emailPrivacy: boolean;
  mobileAvailability: AvailabilityEnum = AvailabilityEnum.DISABLED;
  landLineAvailability: AvailabilityEnum = AvailabilityEnum.DISABLED;
  phonePrivacy: boolean;
  addressAvailability: AvailabilityEnum = AvailabilityEnum.DISABLED;
  customProfileFields: CustomFieldDetailed[];

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
    public runWizard: RunWizardComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.step = this.data.step;
    if (this.data.wizard.kind === WizardKind.REGISTRATION) {
      const dataForNew = this.step.dataForNew || {};
      const profileFields = dataForNew.profileFieldActions || {};
      if (profileFields.email) {
        this.emailAvailability = dataForNew.emailRequired ? AvailabilityEnum.REQUIRED : AvailabilityEnum.OPTIONAL;
        this.emailPrivacy = profileFields.email.managePrivacy;
      }
      if (profileFields.phone && dataForNew.phoneConfiguration) {
        this.mobileAvailability = dataForNew.phoneConfiguration.mobileAvailability;
        this.landLineAvailability = dataForNew.phoneConfiguration.landLineAvailability;
        this.phonePrivacy = profileFields.phone.managePrivacy;
      }
      if (profileFields.address && dataForNew.addressConfiguration) {
        this.addressAvailability = dataForNew.addressConfiguration.availability;
      }
    }
  }

  onUploadDone(image: Image) {
    // First remove any previous image, then emit that a new image is uploaded
    this.addSub(this.doRemoveImage().subscribe(() => {
      this.image = image;
      this.imageUploaded.emit(this.image);
      this.changeDetector.detectChanges();
    }));
  }

  removeImage() {
    this.addSub(this.doRemoveImage().subscribe());
  }

  private doRemoveImage(): Observable<Image> {
    if (this.image) {
      const result = this.image;
      return this.errorHandler.requestWithCustomErrorHandler(() => {
        return new Observable(obs => {
          this.imagesService.deleteImage({ idOrKey: this.image.id }).subscribe(() => {
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
    this.addSub(this.maps.geocode(value).subscribe(coords => {
      this.address.patchValue({ location: coords });
      this.changeDetector.detectChanges();
    }, () => this.mapShown()));
  }

  mapShown() {
    this.locatingAddress$.next(false);
    this.changeDetector.detectChanges();
  }

  passwordForm(index: number): FormGroup {
    const passwords = this.user ? this.user.controls.passwords as FormArray : null;
    return passwords ? passwords.controls[index] as FormGroup : null;
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
        this.addSub(this.wizardsService.sendWizardVerificationCode({
          key: this.data.key,
          body: { medium, to }
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.general.sentCodeTo(to));
        }));
      } else {
        button.reenable();
        focusFirstInvalid();
      }
    });
  }

  fieldSize(cf: CustomFieldDetailed) {
    return this.fieldHelper.fieldSize(cf);
  }
}
