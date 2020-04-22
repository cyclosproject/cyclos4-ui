import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UserIdentityProvider, UserIdentityProvidersListData, UserIdentityProviderStatusEnum } from 'app/api/models';
import { IdentityProvidersService } from 'app/api/services';
import { Action } from 'app/shared/action';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';

/**
 * Displays a list with the identity providers and actions to manage them
 */
@Component({
  selector: 'user-identity-providers',
  templateUrl: 'user-identity-providers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserIdentityProvidersComponent
  extends BasePageComponent<UserIdentityProvidersListData>
  implements OnInit {

  param: string;
  self: boolean;

  multiple: boolean;
  title: string;
  mobileTitle: string;

  securityAnswer: FormGroup;

  constructor(
    injector: Injector,
    private identityProvidersService: IdentityProvidersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.identityProvidersService.getUserIdentityProvidersListData({ user: this.param })
      .subscribe(data => {
        this.data = data;
      }));
  }

  onDataInitialized(data: UserIdentityProvidersListData) {
    this.self = this.authHelper.isSelf(data.user);
    this.title = this.self
      ? this.i18n.identityProvider.title.manageSelf
      : this.i18n.identityProvider.title.manageUser;
    this.mobileTitle = this.self
      ? this.i18n.identityProvider.mobileTitle.manageSelf
      : this.i18n.identityProvider.mobileTitle.manageUser;
  }

  actions(uip: UserIdentityProvider): Action[] {
    const actions: Action[] = [];
    if (uip.status !== UserIdentityProviderStatusEnum.LINKED && this.data.canLink) {
      actions.push(new Action(this.i18n.identityProvider.action.connect, () => {
        this.connect(uip);
      }));
    }
    if (uip.status === UserIdentityProviderStatusEnum.LINKED && this.data.canEdit) {
      actions.push(new Action(this.i18n.identityProvider.action.disconnect, () => {
        this.disconnect(uip);
      }));
    }
    return actions;
  }

  private connect(uip: UserIdentityProvider) {
    this.addSub(this.authHelper.identityProviderPopup(uip.identityProvider, 'link').subscribe(callback => {
      this.notification.snackBar(this.i18n.identityProvider.action.connectDone({
        name: callback.name,
        provider: callback.identityProvider.name,
      }));
      this.reload();
    }));
  }

  private disconnect(uip: UserIdentityProvider) {
    this.notification.confirm({
      title: this.i18n.identityProvider.action.disconnect,
      message: this.i18n.identityProvider.action.disconnectConfirm(uip.identityProvider.name),
      callback: () => this.doDisconnect(uip),
    });
  }

  private doDisconnect(uip: UserIdentityProvider) {
    const idp = uip.identityProvider;
    this.addSub(this.identityProvidersService.deleteUserIdentityProvider({
      user: this.param,
      identityProvider: idp.internalName,
      disable: true,
    }).subscribe(() => {
      this.notification.info(this.i18n.identityProvider.action.disconnectDone(idp.name));
      this.reload();
    }));
  }

  resolveMenu(data: UserIdentityProvidersListData) {
    return this.authHelper.userMenu(data.user, Menu.IDENTITY_PROVIDERS);
  }
}
