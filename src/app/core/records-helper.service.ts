import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { RecordType } from 'app/api/models';


/**
 * Helper service for records functions
 */
@Injectable({
  providedIn: 'root'
})
export class RecordHelperService {

  constructor(
    private dataForUiHolder: DataForUiHolder
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
}
