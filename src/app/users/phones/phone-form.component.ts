import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BaseComponent } from 'app/shared/base.component';
import { PhonesService } from 'app/api/services';
import { PhoneDataForEdit, PhoneDataForNew, PhoneKind } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { copyProperties } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Either create or edit a phone
 */
@Component({
  selector: 'phone-form',
  templateUrl: 'phone-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneFormComponent extends BaseComponent {

  form: FormGroup;
  id: string;
  title: string;
  managePrivacy = false;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<PhoneFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhoneDataForNew | PhoneDataForEdit,
    private phonesService: PhonesService) {
    super(injector);

    this.id = data['id'];
    const phone = data.phone;

    this.managePrivacy = (data as PhoneDataForEdit).managePrivacy;
    if (this.id) {
      // Details
      this.title = this.data.type === PhoneKind.MOBILE
        ? this.messages.phoneDetailsMobile()
        : this.messages.phoneDetailsLandLine();
    } else {
      // New
      this.title = this.data.type === PhoneKind.MOBILE
        ? this.messages.phoneNewMobile()
        : this.messages.phoneNewLandLine();
    }

    this.form = formBuilder.group({
      name: [phone.name, Validators.required],
      number: [phone.number, Validators.required]
    });
    if (this.managePrivacy) {
      this.form.setControl('hidden', formBuilder.control(phone.hidden));
    }
    if (data.extensionEnabled) {
      this.form.setControl('extension', formBuilder.control(phone.extension));
    }
    if (data.confirmationPasswordInput) {
      this.form.setControl('confirmationPassword', formBuilder.control(null, Validators.required));
    }
  }

  save() {
    if (!this.form.valid) {
      return;
    }
    copyProperties(this.form.value, this.data.phone, ['confirmationPassword']);
    if (this.id == null) {
      // Creating a new phone
      this.phonesService.createPhone({
        user: ApiHelper.SELF,
        phone: this.data.phone,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      // Saving an existing phone
      this.phonesService.updatePhone({
        id: this.id,
        phone: this.data.phone,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
