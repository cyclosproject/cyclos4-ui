import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ImportedFileDataForEdit, ImportedFileEdit } from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

/**
 * Edits an imported file
 */
@Component({
  selector: 'edit-imported-file',
  templateUrl: 'edit-imported-file.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditImportedFileComponent extends BasePageComponent<ImportedFileDataForEdit> implements OnInit {

  id: string;

  form: FormGroup;

  constructor(
    injector: Injector,
    private importsService: ImportsService,
    public importsHelper: ImportsHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const route = this.route.snapshot;
    this.id = route.params.id;

    this.addSub(this.importsService.getImportedFileDataForEdit({ id: this.id }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: ImportedFileDataForEdit) {
    super.onDataInitialized(data);

    this.form = this.formBuilder.group({
      description: data.importedFile.description
    });
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const params = { ...this.data.importedFile, ...this.form.value } as ImportedFileEdit;
    this.addSub(this.importsService.updateImportedFile({
      id: this.id,
      body: params
    }).subscribe(() => {
      this.router.navigate(['/imports', 'files', 'view', this.id], { replaceUrl: true });
    }));
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.data);
  }
}
