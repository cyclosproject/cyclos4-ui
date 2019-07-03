import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { RecordsRoutingModule } from 'app/records/records-routing.module';
import { SearchRecordsComponent } from 'app/records/search-records.component';
import { TiledRecordsComponent } from 'app/records/tiled-records.component';

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
    SearchRecordsComponent,
    TiledRecordsComponent
  ],
  entryComponents: []
})
export class RecordsModule {
}
