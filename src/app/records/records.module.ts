import { NgModule } from '@angular/core';
import { RecordFormComponent } from 'app/records/record-form.component';
import { RecordsRoutingModule } from 'app/records/records-routing.module';
import { SearchRecordsComponent } from 'app/records/search-records.component';
import { TiledRecordsComponent } from 'app/records/tiled-records.component';
import { ViewRecordComponent } from 'app/records/view-record.component';
import { SharedModule } from 'app/shared/shared.module';

/**
 * Records module
 */
@NgModule({
  imports: [
    RecordsRoutingModule,
    SharedModule,
  ],
  exports: [],
  declarations: [
    SearchRecordsComponent,
    TiledRecordsComponent,
    ViewRecordComponent,
    RecordFormComponent,
  ],
  entryComponents: [],
})
export class RecordsModule {
}
