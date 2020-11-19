import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { WebshopSettingsView } from 'app/api/models';
import { WebshopSettingsService } from 'app/api/services/webshop-settings.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Displays the configured settings for webshop products
 */
@Component({
  selector: 'view-webshop-settings',
  templateUrl: 'view-webshop-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewWebshopSettingsComponent extends BaseViewPageComponent<WebshopSettingsView> implements OnInit {
  constructor(
    injector: Injector,
    private webshopSettingsService: WebshopSettingsService) {
    super(injector);
  }

  user: string;
  self: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.webshopSettingsService.viewWebshopSettings({ user: this.user }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: WebshopSettingsView) {
    this.self = this.authHelper.isSelfOrOwner(data.user);
    const actions = [];

    if (data.canEdit) {
      actions.push(
        new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () =>
          this.router.navigate(['/marketplace', this.user, 'webshop-settings', 'edit']), true,
        ));

      this.headingActions = actions;
    }
  }

  resolveMenu(data: WebshopSettingsView) {
    return this.menu.userMenu(data.user, Menu.WEBSHOP_SETTINGS);
  }

}
