import { Injectable } from '@angular/core';
import { UserStatusEnum } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';

/**
 * Helper for user-related data
 */
@Injectable({
  providedIn: 'root'
})
export class UserHelperService {

  constructor(private i18n: I18n) {
  }

  /**
   * Returns the user status display
   */
  userStatus(status: UserStatusEnum): string {
    switch (status) {
      case UserStatusEnum.ACTIVE:
        return this.i18n.userStatus.active;
      case UserStatusEnum.BLOCKED:
        return this.i18n.userStatus.blocked;
      case UserStatusEnum.DISABLED:
        return this.i18n.userStatus.disabled;
      case UserStatusEnum.PENDING:
        return this.i18n.userStatus.pending;
      case UserStatusEnum.PURGED:
        return this.i18n.userStatus.purged;
      case UserStatusEnum.REMOVED:
        return this.i18n.userStatus.removed;
    }
  }

}

