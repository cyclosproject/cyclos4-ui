import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { RecordType, RecordTypeDetailed, RecordCustomField, User, RecordPermissions, RecordLayoutEnum, RoleEnum } from 'app/api/models';
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


  /** Represents the path to general record search */
  static GENERAL_SEARCH = 'general';

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private layout: LayoutService,
    private authHelper: AuthHelperService
  ) { }

  /**
  * Returns the record types within the according permissions for the logged user or system based on the given flag
  */
  recordPermissions(system?: boolean, management?: boolean): RecordPermissions[] {
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth || {};
    const permissions = auth.permissions || {};
    const records = permissions.records || {};
    if (system) {
      return records.system || [];
    } else if (management) {
      return records.userManagement || [];
    } else {
      return records.user || [];
    }
  }
  /**
   * Resolves the path to the according record page either view, edit, or new
   */
  resolvePath(permission: RecordPermissions, owner: string, system: boolean = false): string {
    const type = permission.type;
    if (owner === RecordHelperService.GENERAL_SEARCH) {
      // Force list when doing a general search
      type.layout = RecordLayoutEnum.LIST;
    }
    const pathFunction = (id: string) => {
      let path = null;
      if (type.layout === RecordLayoutEnum.SINGLE) {
        if (permission.singleRecordId) {
          path = `view/${id}`;
        } else if (permission.create) {
          path = `${owner}/${ApiHelper.internalNameOrId(type)}/new`;
        }
      } else {
        path = `${owner}/${ApiHelper.internalNameOrId(type)}/${type.layout}`;
      }
      return `/records/${path}`;
    };
    if (type.layout === RecordLayoutEnum.SINGLE && permission.singleRecordId == null) {
      // Search single record dinamically
      for (const record of this.recordPermissions(system)) {
        if (type.id === record.type.id) {
          return pathFunction(record.singleRecordId);
        }
      }
    } else {
      return pathFunction(permission.singleRecordId);
    }
  }

  /**
   * Returns if the current record type should be displayed using more than a column
   */
  isColumnLayout(type: RecordTypeDetailed): boolean {
    return type.fieldColumns > 1 && this.layout.gtxs;
  }

  /**
   * Resolves the column style for the given field based on the colspan defined
   */
  resolveColumnClass(field: RecordCustomField, type: RecordTypeDetailed): string {
    const colspan = field != null && field.colspan != null ? ' colspan-' + field.colspan : '';
    return this.isColumnLayout(type) ? 'pr-3 columns-' + type.fieldColumns + colspan : '';
  }

  /**
   * Returns the active menu for the given record type
   */
  menuForRecordType(user: User, type: RecordType, userManagement: boolean = false): Menu | ActiveMenu | Observable<Menu> {
    if (this.authHelper.isSelf(user)) {
      let menu: Menu;
      if (userManagement) {
        const dataForUi = this.dataForUiHolder.dataForUi;
        const auth = dataForUi.auth || {};
        menu = auth.role === RoleEnum.ADMINISTRATOR ? Menu.SEARCH_ADMIN_RECORDS : Menu.SEARCH_BROKER_RECORDS;
      } else if (user == null) {
        menu = Menu.SEARCH_SYSTEM_RECORDS;
      } else {
        menu = Menu.SEARCH_USER_RECORDS;
      }
      return new ActiveMenu(menu, { recordType: type });
    } else {
      return this.authHelper.searchUsersMenu(user);
    }
  }

}
