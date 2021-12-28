import { Injectable } from '@angular/core';
import {
  RecordCustomField, RecordLayoutEnum, RecordPermissions,
  RecordType, RecordTypeDetailed
} from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LayoutService } from 'app/core/layout.service';
import { ApiHelper } from 'app/shared/api-helper';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Helper service for records functions
 */
@Injectable({
  providedIn: 'root',
})
export class RecordHelperService {

  /** Represents the path to general record search */
  static GENERAL_SEARCH = 'general';

  constructor(
    private dataForFrontendHolder: DataForFrontendHolder,
    private layout: LayoutService
  ) { }

  /**
   * Returns the record types within the according permissions for the logged user or system based on the given flag
   */
  recordPermissions(system?: boolean, management?: boolean): RecordPermissions[] {
    const auth = this.dataForFrontendHolder.auth;
    const permissions = (auth || {}).permissions || {};
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
  resolvePath(permission: RecordPermissions, owner: string): string {
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
      for (const record of this.recordPermissions(owner === ApiHelper.SYSTEM)) {
        if (type.id === record.type.id) {
          return pathFunction(record.singleRecordId);
        }
      }
    } else {
      return pathFunction(permission.singleRecordId);
    }
  }

  /**
   * Returns the icon name that should be used for the given record type
   */
  icon(type: RecordType): SvgIcon | string {
    return type.svgIcon || SvgIcon.FileText;
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

}
