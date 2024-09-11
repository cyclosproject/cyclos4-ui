import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditImportedFileComponent } from 'app/ui/imports/edit-imported-file.component';
import { EditImportedLineComponent } from 'app/ui/imports/edit-imported-line.component';
import { ImportFileComponent } from 'app/ui/imports/import-file.component';
import { SearchImportedFilesComponent } from 'app/ui/imports/search-imported-files.component';
import { SearchImportedLinesComponent } from 'app/ui/imports/search-imported-lines.component';
import { ViewImportedFileComponent } from 'app/ui/imports/view-imported-file.component';
import { ViewImportedLineComponent } from 'app/ui/imports/view-imported-line.component';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';

const importsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':owner/:context/files',
        component: SearchImportedFilesComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':owner/:kind/new',
        component: ImportFileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'files/view/:id',
        component: ViewImportedFileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'files/edit/:id',
        component: EditImportedFileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'lines/search/:id',
        component: SearchImportedLinesComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'lines/view/:id',
        component: ViewImportedLineComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'lines/edit/:id',
        component: EditImportedLineComponent,
        canActivate: [LoggedUserGuard]
      }
    ]
  }
];

/**
 * Routes for the imports module
 */
@NgModule({
  imports: [RouterModule.forChild(importsRoutes)],
  exports: [RouterModule]
})
export class ImportsRoutingModule {}
