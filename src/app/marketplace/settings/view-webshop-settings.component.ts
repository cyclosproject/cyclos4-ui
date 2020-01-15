import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { WebshopSettingsView } from 'app/api/models';
import { WebshopSettingsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { Menu } from 'app/shared/menu';

/**
 * Displays the configured settings for webshop products
 */
@Component({
  selector: 'view-webshop-settings',
  templateUrl: 'view-webshop-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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

    // TODO missing data.edit
    actions.push(
      new HeadingAction('edit', this.i18n.general.edit, () =>
        this.router.navigate(['/marketplace', this.user, 'webshop-settings', 'edit']), true
      ));

    this.headingActions = actions;
  }

  resolveMenu(data: WebshopSettingsView) {
    return this.authHelper.userMenu(data.user, Menu.WEBSHOP_SETTINGS);
  }

  /**
 * Resolves the label generated or manual product number
 */
  resolveGenerationTypeLabel(): string {
    return this.data.productNumberGenerated ?
      this.i18n.ad.generated : this.i18n.ad.manual;
  }

}
