import { NgModule } from '@angular/core';
import { RecordFormComponent } from 'app/ui/records/record-form.component';
import { RecordsRoutingModule } from 'app/ui/records/records-routing.module';
import { SearchRecordsComponent } from 'app/ui/records/search-records.component';
import { TiledRecordsComponent } from 'app/ui/records/tiled-records.component';
import { ViewRecordComponent } from 'app/ui/records/view-record.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Records module
 */
@NgModule({
  declarations: [
    SearchRecordsComponent,
    TiledRecordsComponent,
    ViewRecordComponent,
    RecordFormComponent,
  ],
  imports: [
    RecordsRoutingModule,
    UiSharedModule
  ],
  exports: [],
})
export class RecordsModule {
}
