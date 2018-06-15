import { Component, ChangeDetectionStrategy, Injector, Input } from '@angular/core';

import { BaseComponent } from 'app/shared/base.component';
import { UserManage, UserDataForNew, PhoneConfigurationForUserRegistration } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { UserBasicData } from '../../api/models/user-basic-data';
import { AvailabilityEnum } from '../../api/models/availability-enum';

/**
 * Form used to edit basic profile fields, plus phones (in case of registration).
 * The input form is manipulated to add / remove the fields.
 * Fields which are read-only are shown as a `label-value`, whereas editable fields have their corresponding editing widget.
 */
@Component({
  selector: 'user-fields-form',
  templateUrl: 'user-fields-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFieldsFormComponent extends BaseComponent {

  @Input() form: FormGroup;
  @Input() data: UserBasicData;
  @Input() user: UserManage;
  hasReadOnlyFields = false;

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.readOnly('name') && this.user.name
      || this.readOnly('username') && this.user.username
      || this.readOnly('email') && this.user.email) {
      this.hasReadOnlyFields = true;
    }
    if (!this.hasReadOnlyFields) {
      for (const cf of this.data.customFields) {
        if (this.readOnly(cf.internalName) && this.user.customValues[cf.internalName] != null) {
          this.hasReadOnlyFields = true;
          break;
        }
      }
    }
  }

  readOnly(field: string): boolean {
    if (this.user == null) {
      // Only when editing a profile fields can be shown as read-only
      return false;
    }
    const actions = this.data.profileFieldActions[field];
    return actions && !actions.edit;
  }

  editable(field: string): boolean {
    const actions = this.data.profileFieldActions[field];
    return actions && actions.edit;
  }

  managePrivacy(field: string): boolean {
    const actions = this.data.profileFieldActions[field];
    return actions != null && actions.managePrivacy;
  }

  get hasLandLinePhone(): boolean {
    const avail = this.phoneConfiguration.landLineAvailability;
    return avail != null && avail !== AvailabilityEnum.DISABLED;
  }

  get hasExtension(): boolean {
    return this.phoneConfiguration.extensionEnabled;
  }

  get hasMobilePhone(): boolean {
    const avail = this.phoneConfiguration.mobileAvailability;
    return avail != null && avail !== AvailabilityEnum.DISABLED;
  }

  get mobilePhoneRequired(): boolean {
    return this.phoneConfiguration.mobileAvailability === AvailabilityEnum.REQUIRED;
  }

  get landLinePhoneRequired(): boolean {
    return this.phoneConfiguration.landLineAvailability === AvailabilityEnum.REQUIRED;
  }
  /**
   * This will return an empty object when editing the profile
   */
  private get phoneConfiguration(): PhoneConfigurationForUserRegistration {
    const data = this.data as UserDataForNew;
    return data.phoneConfiguration || {};
  }
}
