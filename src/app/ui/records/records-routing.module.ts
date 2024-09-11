import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { RecordFormComponent } from 'app/ui/records/record-form.component';
import { SearchRecordsComponent } from 'app/ui/records/search-records.component';
import { TiledRecordsComponent } from 'app/ui/records/tiled-records.component';
import { ViewRecordComponent } from 'app/ui/records/view-record.component';

const recordRoutes: Routes = [
  {
    path: ':owner/:type/list',
    component: SearchRecordsComponent,
    canActivate: [LoggedUserGuard]
  },
  {
    path: ':owner/:type/tiled',
    component: TiledRecordsComponent,
    canActivate: [LoggedUserGuard]
  },
  {
    path: 'view/:id',
    component: ViewRecordComponent,
    canActivate: [LoggedUserGuard]
  },
  {
    path: ':owner/:type/new',
    component: RecordFormComponent,
    canActivate: [LoggedUserGuard]
  },
  {
    path: 'edit/:id',
    component: RecordFormComponent,
    canActivate: [LoggedUserGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(recordRoutes)],
  exports: [RouterModule]
})
export class RecordsRoutingModule {}
