import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { Menu, ActiveMenu, ConditionalMenu } from 'app/shared/menu';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { trim } from 'lodash';
import { SearchRecordsComponent } from 'app/records/search-records.component';
import { RecordHelperService } from 'app/core/records-helper.service';

const RecordMenu: ConditionalMenu = injector => {
  // The scope depends on the URL
  const url = injector.get(Router).url;
  // The first part is always the owner, and the last path part is always the record type
  const parts = trim(url, '/').split('/');
  if (parts.length === 1) {
    // Invalid URL
    return null;
  }
  const key = parts[parts.length - 1];
  const recordType = injector.get(RecordHelperService).ownerRecordType(key);
  return new ActiveMenu(Menu.SEARCH_RECORDS, { recordType: recordType });
};

const recordRoutes: Routes = [
  {
    path: ':owner/:type',
    component: SearchRecordsComponent,
    canActivate: [LoggedUserGuard],
    data: {
      menu: RecordMenu
    }
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(recordRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class RecordsRoutingModule {
}
