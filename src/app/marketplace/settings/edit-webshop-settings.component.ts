import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { WebshopSettingsDetailed, WebshopSettingsView } from 'app/api/models';
import { WebshopSettingsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';

/**
 * Edit settings for webshop products
 */
@Component({
  selector: 'edit-webshop-settings',
  templateUrl: 'edit-webshop-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditWebshopSettingsComponent
  extends BasePageComponent<WebshopSettingsDetailed>
  implements OnInit {

  user: string;
  self: boolean;
  form: FormGroup;

  constructor(
    injector: Injector,
    private webshopSettingsService: WebshopSettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.webshopSettingsService.viewWebshopSettings({ user: this.user }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: WebshopSettingsView) {
    this.self = this.authHelper.isSelfOrOwner(data.user);
    this.form = this.formBuilder.group({});
  }

  /**
   * Saves or edits the current settings
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    this.addSub(this.webshopSettingsService.updateWebshopSettings({ user: this.user, body: this.form.value }).subscribe(id => {
      this.notification.snackBar(this.i18n.ad.webshopSettingsSaved);
      this.router.navigate(['/marketplace', this.user, 'webshop-settings', 'view']);
    }));
  }

  resolveMenu(data: WebshopSettingsView) {
    return this.authHelper.userMenu(data.user, Menu.WEBSHOP_SETTINGS);
  }

}
