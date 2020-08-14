import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CustomFieldTypeEnum, PhysicalTokenTypeEnum, RoleEnum, TokenResult, TokenStatusEnum, UserTokensListData } from 'app/api/models';
import { TokensService } from 'app/api/services/tokens.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { CreateTokenComponent } from 'app/ui/users/tokens/create-token.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * List a user tokens
 */
@Component({
  selector: 'list-token',
  templateUrl: 'list-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListTokenComponent
  extends BasePageComponent<UserTokensListData>
  implements OnInit {

  user: string;
  type: string;
  self: boolean;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private userHelper: UserHelperService,
    private tokenService: TokensService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.type = this.route.snapshot.params.type;
    this.addSub(this.tokenService.getUserTokens({ user: this.user, type: this.type }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserTokensListData) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelf(data.user);
    if (this.canCreate() && data.type.physicalType !== PhysicalTokenTypeEnum.NFC_TAG) {
      this.headingActions = [new HeadingAction('add', this.i18n.general.add, () => {
        this.modal.show(CreateTokenComponent, {
          class: 'modal-form',
          initialState: { type: data.type, user: data.user, required: true, updateAction: () => this.reload() },
        });
      }, true)];
    }

    if (this.canActivate()) {
      this.headingActions = [new HeadingAction('how_to_reg', this.i18n.token.action.activate, () => {
        this.notification.confirm({
          title: this.i18n.token.action.activate,
          customFields: [{
            internalName: 'value',
            name: this.i18n.token.value,
            type: CustomFieldTypeEnum.STRING,
            pattern: data.type.mask,
            required: true
          }],
          callback: params =>
            this.tokenService.activateToken({ user: this.user, type: this.type, body: params.customValues.value })
              .subscribe(() => {
                this.notification.snackBar(this.i18n.token.action.done.expiryChanged);
                this.reload();
              })
        });
      }, true)];
    }
  }

  isNfc() {
    return this.data.type.physicalType === PhysicalTokenTypeEnum.NFC_TAG;
  }

  canCreate(): boolean {
    if (!this.self) {
      return this.dataForUiHolder.auth.permissions.tokens.user.find(p => p.type.id === this.type)?.create;
    }
    return false;
  }

  canActivate(): boolean {
    if (this.self) {
      return this.dataForUiHolder.auth.permissions.tokens.my.find(p => p.type.id === this.type)?.activate;
    }
    return false;
  }

  statusDisplay(status: TokenStatusEnum) {
    return this.userHelper.tokenStatus(status);
  }

  view(token: TokenResult) {
    return ['/users', 'tokens', 'view', token.id];
  }

  resolveMenu(data: UserTokensListData) {
    if (this.authHelper.isSelf(data.user)) {
      return new ActiveMenu(Menu.MY_TOKENS, { tokenType: data.type });
    }
    if (data.user.user && this.authHelper.isSelf(data.user.user)) {
      return Menu.MY_OPERATORS;
    }
    if (this.dataForUiHolder.role === RoleEnum.BROKER) {
      return Menu.MY_BROKERED_USERS;
    }
    return Menu.SEARCH_USERS;
  }
}
