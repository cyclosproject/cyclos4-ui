import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { RecordsRoutingModule } from 'app/records/records-routing.module';
import { SearchRecordsComponent } from 'app/records/search-records.component';

/**
 * Records module
 */
@NgModule({
  imports: [
    RecordsRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    SearchRecordsComponent
  ],
  entryComponents: []
})
export class RecordsModule {
}
