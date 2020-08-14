import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { PrivacySettingsData } from 'app/api/models';
import { PrivacySettingsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * View the user privacy settings
 */
@Component({
  selector: 'view-privacy-settings',
  templateUrl: 'view-privacy-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPrivacySettingsComponent
  extends BasePageComponent<PrivacySettingsData>
  implements OnInit {

  user: string;

  constructor(
    injector: Injector,
    private privacySettingsService: PrivacySettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.privacySettingsService.getPrivacySettingsData({ user: this.user ? this.user : ApiHelper.SELF })
      .subscribe(data => {
        if (data.canEdit) {
          this.router.navigate(['/users', this.user, 'privacy-settings', 'edit'], { replaceUrl: true });
        }
        this.data = data;
      }));
  }

  fields(): Array<string> {
    return this.data.controlledFields.map(field => this.fieldHelper.fieldDisplay(field, this.data.customFields));
  }

  resolveMenu() {
    return this.authHelper.isSelf(this.user) ? Menu.PRIVACY_SETTINGS : this.menu.searchUsersMenu();
  }
}
