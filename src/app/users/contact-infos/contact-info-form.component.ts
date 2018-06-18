import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { ContactInfosService } from 'app/api/services';
import { ContactInfoDataForEdit, ContactInfoDataForNew } from 'app/api/models';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactInfoFormComponent extends BaseComponent {

  form: FormGroup;
  id: string;
  title: string;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ContactInfoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactInfoDataForNew | ContactInfoDataForEdit,
    public countriesResolve: CountriesResolve,
    private contactInfosService: ContactInfosService) {
    super(injector);

    this.id = data['id'];
    const contactInfo = data.contactInfo;

    if (this.id) {
      // Details
      this.title = this.messages.contactInfoDetails();
    } else {
      // New
      this.title = this.messages.contactInfoNew();
    }

    this.form = formBuilder.group({
      name: [contactInfo.name, Validators.required],
      email: contactInfo.email,
      landLinePhone: contactInfo.landLinePhone,
      mobilePhone: contactInfo.mobilePhone,
      address: contactInfo.address
    });

    if (data.phoneConfiguration.extensionEnabled) {
      this.form.setControl('landLineExtension', formBuilder.control(contactInfo.landLineExtension));
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
    copyProperties(this.form.value, this.data.contactInfo);
    if (this.id == null) {
      // Creating a new contactInfo
      this.contactInfosService.createContactInfo({
        user: ApiHelper.SELF,
        contactInfo: this.data.contactInfo
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      // Saving an existing contactInfo
      this.contactInfosService.updateContactInfo({
        id: this.id,
        contactInfo: this.data.contactInfo
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
