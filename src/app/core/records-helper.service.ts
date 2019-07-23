import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { RecordType, RecordTypeDetailed, RecordCustomField, User } from 'app/api/models';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, ActiveMenu } from 'app/shared/menu';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { Observable } from 'rxjs';


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
  * Returns the record types from the logged user permissions
  */
  ownerRecordTypes(): RecordType[] {
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth || {};
    const permissions = auth.permissions || {};
    const records = permissions.records || {};
    const types = records.user || [];
    return types.map(t => t.type);
  }

  /**
   * Returns a record type from the logged user permissions by internal name or id
   */
  ownerRecordType(key: string): RecordType {
    return this.ownerRecordTypes().find(t => t.id === key || t.internalName === key);
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
