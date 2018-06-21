import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ContactInfosService, ImagesService } from 'app/api/services';
import { ContactInfoDataForEdit, ContactInfoDataForNew, Image } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { copyProperties, empty } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';

/**
 * Either create or edit an additional contact information
 */
@Component({
  selector: 'contact-info-form',
  templateUrl: 'contact-info-form.component.html',
  styleUrls: ['contact-info-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactInfoFormComponent extends BaseComponent {

  form: FormGroup;
  id: string;
  title: string;
  image = new BehaviorSubject<Image>(null);
  imageModified = false;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ContactInfoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactInfoDataForNew | ContactInfoDataForEdit,
    public countriesResolve: CountriesResolve,
    private contactInfosService: ContactInfosService,
    private imagesService: ImagesService) {
    super(injector);

    this.id = data['id'];
    const contactInfo = data.contactInfo;

    if (this.id) {
      // Details
      this.title = this.messages.contactInfoDetails();
      this.image.next((data as ContactInfoDataForEdit).image);
    } else {
      // New
      this.title = this.messages.contactInfoNew();
    }

    this.form = formBuilder.group({
      name: [contactInfo.name, Validators.required],
      email: contactInfo.email,
      landLinePhone: contactInfo.landLinePhone,
      mobilePhone: contactInfo.mobilePhone,
      address: contactInfo.address,
      hidden: contactInfo.hidden
    });
    if (data.phoneConfiguration.extensionEnabled) {
      this.form.setControl('landLineExtension', formBuilder.control(contactInfo.landLineExtension));
    }
    if (data.confirmationPasswordInput) {
      this.form.setControl('confirmationPassword', formBuilder.control(null, Validators.required));
    }
    if (!empty(data.customFields)) {
      this.form.setControl('customValues',
        ApiHelper.customValuesFormGroup(formBuilder, data.customFields));
    }
  }

  save() {
    if (!this.form.valid) {
      return;
    }
    copyProperties(this.form.value, this.data.contactInfo, ['confirmationPassword']);
    if (this.id == null) {
      // Creating a new contactInfo
      this.contactInfosService.createContactInfo({
        user: ApiHelper.SELF,
        contactInfo: this.data.contactInfo,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      // Saving an existing contactInfo
      this.contactInfosService.updateContactInfo({
        id: this.id,
        contactInfo: this.data.contactInfo,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  uploadImage(file: File | FileList) {
    if (file instanceof FileList) {
      file = file.item(0);
    }
    this.imagesService.uploadContactInfoImage({
      id: this.id,
      name: file.name,
      image: file
    }).subscribe(imageId => {
      // Now get the image details
      this.imagesService.viewImage({
        id: imageId
      }).subscribe(image => {
        this.image.next(image);
        this.imageModified = true;
        this.notification.snackBar(this.messages.contactInfoImageUploaded());
      });
    });
  }

  removeImage() {
    const image = this.image.value;
    if (image) {
      this.notification.yesNo(this.messages.contactInfoRemoveImageConfirm()).subscribe(answer => {
        if (answer) {
          this.imagesService.deleteImage(image.id).subscribe(() => {
            this.image.next(null);
            this.notification.snackBar(this.messages.contactInfoImageRemoved());
          });
        }
      });
    }
  }
}
