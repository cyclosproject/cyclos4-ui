import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { PrivacySettingsService } from 'app/api/services';
import { PrivacySettingsData } from 'app/api/models';
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

  private user: string;

  ngOnInit() {
    super.ngOnInit();
    const userParam = this.route.snapshot.params.user;
    this.user = this.authHelper.isSelf(userParam)
      ? this.ApiHelper.SELF
      : userParam;

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
}
