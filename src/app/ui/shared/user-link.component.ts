import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AccountWithOwner, User } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';

/**
 * Shows a link to a user profile, and a popup on hover with more details.
 * Can also take an account, showing the link to the user if the account is of
 * kind `user`, or shows the account type name if no user is there (a system account).
 */
@Component({
  selector: 'user-link',
  templateUrl: 'user-link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLinkComponent extends BaseComponent implements OnInit {

  constructor(
    injector: Injector,
    private authHelper: AuthHelperService) {
    super(injector);
  }

  @Input()
  user: User;

  private _hideLink: boolean | string = false;
  @Input() get hideLink() {
    return this._hideLink;
  }
  set hideLink(hideLink: boolean | string) {
    this._hideLink = truthyAttr(hideLink);
  }

  @Input()
  account: AccountWithOwner;

  path: string;

  display: string;

  operator: boolean;

  ngOnInit() {
    super.ngOnInit();
    if (this.account != null && this.user == null) {
      this.user = this.account.user;
    }
    this.operator = this.user ? !!this.user.user : false;
    if (this.user != null && this.user.id != null && !this.hideLink) {
      const param = this.authHelper.isSelf(this.user) ? this.ApiHelper.SELF : this.user.id;
      this.path = `/users/${param}/profile`;
    }
    if (this.user != null) {
      this.display = this.user.display;
    } else if (this.account != null) {
      this.display = (this.account.type || {}).name;
    }
  }

  canViewProfile(): boolean {
    return this.authHelper.isSelfOrOwner(this.user) || (((this.dataForFrontendHolder.auth || {}).permissions || {}).users || {}).viewProfile
      && (this.operator || !!this.user.id);
  }

}
