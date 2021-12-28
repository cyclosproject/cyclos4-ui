import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PrivacySettingsData } from 'app/api/models';
import { PrivacySettingsService } from 'app/api/services/privacy-settings.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';

/**
 * Manages the user privacy settings
 */
@Component({
  selector: 'edit-privacy-settings',
  templateUrl: 'edit-privacy-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPrivacySettingsComponent
  extends BasePageComponent<PrivacySettingsData>
  implements OnInit {

  user: string;
  form: FormGroup;

  constructor(
    injector: Injector,
    private privacySettingsService: PrivacySettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.privacySettingsService.getPrivacySettingsData({ user: this.user ? this.user : ApiHelper.SELF })
      .subscribe(data => this.data = data));
  }

  fields(): Array<string> {
    return this.data.controlledFields.map(field => this.fieldHelper.fieldDisplay(field, this.data.customFields));
  }

  onDataInitialized(data: PrivacySettingsData) {
    this.form = this.formBuilder.group({ enabled: data.enabled });
    data.availableControls.forEach(control =>
      this.form.addControl(control.id, this.formBuilder.control({
        value: data.selectedControls.includes(control.id) || control.fieldsAlwaysVisible,
        disabled: control.fieldsAlwaysVisible
      })));
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const values = cloneDeep(this.form.value);
    const enabled = values.enabled;
    delete values.enabled;
    const params = { enabled, selectedControls: [] };
    this.data.availableControls.forEach(control => {
      if (values[control.id]) {
        params.selectedControls.push(control.id);
      }
    });

    this.addSub(this.privacySettingsService.savePrivacySettings({ user: this.user ? this.user : ApiHelper.SELF, body: params })
      .subscribe(() => this.notification.snackBar(this.i18n.privacySettings.saved)));
  }

  resolveMenu() {
    return this.authHelper.isSelf(this.user) ? Menu.PRIVACY_SETTINGS : this.menu.searchUsersMenu();
  }
}
