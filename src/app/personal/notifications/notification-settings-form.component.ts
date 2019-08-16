import { BasePageComponent } from 'app/shared/base-page.component';
import { OnInit, Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { NotificationSettingsDataForEdit, RoleEnum } from 'app/api/models';
import { empty } from 'app/shared/helper';
import { NotificationSettingsService } from 'app/api/services';
import { Menu } from 'app/shared/menu';

@Component({
  selector: 'notification-settings-form',
  templateUrl: 'notification-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationSettingsFormComponent
  extends BasePageComponent<NotificationSettingsDataForEdit>
  implements OnInit {

  user: string;
  adminSettings: boolean;

  constructor(
    injector: Injector,
    private notificationSettingsService: NotificationSettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.user = this.route.snapshot.params.user;

    this.addSub(this.notificationSettingsService.getNotificationSettingsDataForEdit({ user: this.user })
      .subscribe(data => this.data = data));
  }

  onDataInitialized(data: NotificationSettingsDataForEdit) {
    this.adminSettings = data.role === RoleEnum.ADMINISTRATOR;

    if (this.adminSettings && !this.hasSettings(data)) {
      // Display a notification when there aren't any admin settings to show
      this.notification.info(this.i18n.notificationSettings.notAvailableSettings);
      return;
    }

  }

  save() {
  }

  protected hasSettings(data: NotificationSettingsDataForEdit) {
    return !empty(data.settings.notifications) &&
      (this.adminSettings ? !empty(data.messageCategories) : true);
  }

  resolveMenu() {
    return this.adminSettings || this.user === this.ApiHelper.SELF ?
      Menu.NOTIFICATIONS_SETTINGS : this.authHelper.searchUsersMenu();
  }
}
