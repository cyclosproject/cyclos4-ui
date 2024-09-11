import { NgModule } from '@angular/core';
import { ImportsRoutingModule } from 'app/ui/imports/imports-routing.module';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

import { EditImportedFileComponent } from 'app/ui/imports/edit-imported-file.component';
import { EditImportedLineComponent } from 'app/ui/imports/edit-imported-line.component';
import { ImportFileComponent } from 'app/ui/imports/import-file.component';
import { SearchImportedFilesComponent } from 'app/ui/imports/search-imported-files.component';
import { SearchImportedLinesComponent } from 'app/ui/imports/search-imported-lines.component';
import { ViewImportedFileComponent } from 'app/ui/imports/view-imported-file.component';
import { ViewImportedLineComponent } from 'app/ui/imports/view-imported-line.component';

/**
 * Users module
 */
@NgModule({
  declarations: [
    SearchImportedFilesComponent,
    ImportFileComponent,
    ViewImportedFileComponent,
    EditImportedFileComponent,
    SearchImportedLinesComponent,
    ViewImportedLineComponent,
    EditImportedLineComponent
  ],
  imports: [ImportsRoutingModule, UiSharedModule],
  exports: []
})
export class ImportsModule {}
