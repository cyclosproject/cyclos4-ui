import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { PrivacySettingsService } from 'app/api/services';
import { PrivacySettingsData } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';

@Component({
  selector: 'edit-privacy-settings',
  templateUrl: 'edit-privacy-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class EditPrivacySettingsComponent extends BasePageComponent<PrivacySettingsData> implements OnInit {
  constructor(injector: Injector,
    private privacySettingsService: PrivacySettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const user = this.route.snapshot.params.user;
    this.privacySettingsService.getPrivacySettingsData({ user }).subscribe(data => this.data = data);
  }

  resolveMenu(data: PrivacySettingsData) {
    return this.authHelper.userMenu(data.user, Menu.PRIVACY_SETTINGS);
  }
}
