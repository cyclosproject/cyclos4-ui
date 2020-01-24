import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { PrivacySettingsService } from 'app/api/services';
import { PrivacySettingsData, PrivacyControl } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { HeadingAction } from 'app/shared/action';

@Component({
  selector: 'view-privacy-settings',
  templateUrl: 'view-privacy-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewPrivacySettingsComponent extends BasePageComponent<PrivacySettingsData> implements OnInit {
  constructor(injector: Injector,
    private privacySettingsService: PrivacySettingsService) {
    super(injector);
  }

  self: boolean;
  private user: string;

  ngOnInit() {
    super.ngOnInit();
    const userParam = this.route.snapshot.params.user;
    this.self = this.authHelper.isSelf(userParam);
    this.user = this.self ? this.ApiHelper.SELF : userParam;

    this.privacySettingsService.getPrivacySettingsData({ user: this.user }).subscribe(data => this.data = data);
  }

  onDataInitialized(data: PrivacySettingsData) {
    if (data.canEdit) {
      this.headingActions = [
        new HeadingAction('edit', this.i18n.general.edit, () =>
          this.router.navigate(['/users', this.user, 'privacy-settings', 'edit']), true)
      ];
    }
  }

  resolveMenu(data: PrivacySettingsData) {
    return this.authHelper.userMenu(data.user, Menu.PRIVACY_SETTINGS);
  }

  fieldDisplay(field: string): string {
    return this.fieldHelper.fieldDisplay(field, this.data.customFields);
  }

  isSelectedControl(control: PrivacyControl): boolean {
    return !!(this.data.selectedControls || []).find(c => control.id === c || control.internalName === c);
  }
}
