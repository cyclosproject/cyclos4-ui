import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UserDataForNew, Image, AvailabilityEnum, CustomField, CustomFieldDetailed, GeographicalCoordinate } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';
import { ImagesService } from 'app/api/services';
import { debounceTime } from 'rxjs/operators';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Public registration step: fill in the profile fields
 */
@Component({
  selector: 'registration-step-fields',
  templateUrl: 'registration-step-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationStepFieldsComponent
  extends BaseComponent
  implements OnInit {

  @Input() data: UserDataForNew;
  @Input() form: FormGroup;
  @Input() mobileForm: FormGroup;
  @Input() landLineForm: FormGroup;
  @Input() addressForm: FormGroup;
  @Input() defineAddress: FormControl;
  @Output() imageUploaded = new EventEmitter<Image>();
  @Output() imageRemoved = new EventEmitter<Image>();

  editableFields: Set<string>;
  managePrivacyFields: Set<string>;
  userCustomFields: Map<string, CustomFieldDetailed>;

  image$ = new BehaviorSubject<Image>(null);
  get image(): Image {
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

  constructor(
    injector: Injector,
    private imagesService: ImagesService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editableFields = new Set();
    this.managePrivacyFields = new Set();
    this.userCustomFields = new Map();

    // Cache the field actions to avoid having to calculate every time
    const fieldActions = this.data.profileFieldActions;
    for (const name in fieldActions) {
      if (!fieldActions.hasOwnProperty(name)) {
        continue;
      }
      const actions = fieldActions[name];
      if (actions.edit) {
        this.editableFields.add(name);
      }
      if (actions.managePrivacy) {
        this.managePrivacyFields.add(name);
      }
      const customField = this.data.customFields.find(cf => cf.internalName === name);
      if (customField) {
        this.userCustomFields.set(name, customField);
      }
    }

    // Whenever the form changes, geocode the location
    this.addSub(this.addressForm.valueChanges.pipe(debounceTime(ApiHelper.DEBOUNCE_TIME)).subscribe(value => {
      this.addSub(this.maps.geocode(value).subscribe(location => {
        this.addressForm.patchValue({ location: location }, { emitEvent: false });
        this.location = location;
      }));
    }));
  }

  get mobileAvailability(): AvailabilityEnum {
    return this.data.phoneConfiguration.mobileAvailability;
  }

  get landLineAvailability(): AvailabilityEnum {
    return this.data.phoneConfiguration.landLineAvailability;
  }

  get addressAvailability(): AvailabilityEnum {
    return this.data.addressConfiguration.availability;
  }

  get imageAvailability(): AvailabilityEnum {
    return this.data.imageConfiguration.availability;
  }

  onUploadDone(image: Image) {
    this.removeImage();
    this.image = image;
    this.imageUploaded.emit(this.image);
  }

  removeImage() {
    if (this.image) {
      this.imagesService.deleteImage(this.image.id).subscribe(() => {
        this.imageRemoved.emit(this.image);
        this.image = null;
      });
    }
  }

  canEdit(field: string | CustomField): boolean {
    return this.editableFields.has(this.fieldName(field));
  }

  canManagePrivacy(field: string | CustomField): boolean {
    return this.managePrivacyFields.has(this.fieldName(field));
  }

  private fieldName(field: string | CustomField): string {
    if (typeof field === 'string') {
      return field;
    } else {
      return field.internalName;
    }
  }
}
