import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { RecordType, RecordTypeDetailed, RecordCustomField, User, RecordPermissions, RecordLayoutEnum } from 'app/api/models';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, ActiveMenu } from 'app/shared/menu';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { Observable } from 'rxjs';
import { ApiHelper } from 'app/shared/api-helper';


/**
 * Helper service for records functions
 */
@Injectable({
  providedIn: 'root'
})
export class RecordHelperService {

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private layout: LayoutService,
    private authHelper: AuthHelperService
  ) { }

  /**
  * Returns the record types within the according permissions for the logged user  */
  ownerRecordPermissions(): RecordPermissions[] {
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth || {};
    const permissions = auth.permissions || {};
    const records = permissions.records || {};
    return records.user;
  }

  resolvePath(type: RecordType, singleRecordId: string = null, owner: string, canCreate: boolean): string {
    const pathFunction = (id: string) => {
      let path = null;
      if (type.layout === RecordLayoutEnum.SINGLE) {
        if (singleRecordId) {
          path = `view/${id}`;
        } else if (canCreate) {
          path = `${owner}/${ApiHelper.internalNameOrId(type)}/new`;
        }
      } else {
        path = `${owner}/${ApiHelper.internalNameOrId(type)}/${type.layout}`;
      }
      return `/records/${path}`;
    };
    if (type.layout === RecordLayoutEnum.SINGLE && singleRecordId == null) {
      // Search single record dinamically
      for (const record of this.ownerRecordPermissions()) {
        if (type.id === record.type.id) {
          return pathFunction(record.singleId);
        }
      }
    } else {
      return pathFunction(singleRecordId);
    }
  }

  isColumnLayout(type: RecordTypeDetailed): boolean {
    return type.fieldColumns > 1 && this.layout.gtxs;
  }

  resolveColumnClass(field: RecordCustomField, type: RecordTypeDetailed): String {
    const colspan = field != null && field.colspan != null ? ' colspan-' + field.colspan : '';
    return this.isColumnLayout(type) ? 'pr-3 columns-' + type.fieldColumns + colspan : '';
  }

  menuForRecordType(user: User, type: RecordType): Menu | ActiveMenu | Observable<Menu> {
    if (this.authHelper.isSelf(user)) {
      return new ActiveMenu(Menu.SEARCH_RECORDS, { recordType: type });
    } else {
      return this.authHelper.searchUsersMenu(user);
    }
  }

}
