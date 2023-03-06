import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ImportedField, ImportedLineDataForEdit, ImportedLineEdit } from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

export interface FieldControl {
  field: ImportedField,
  control: FormControl,
  multiline: boolean;
}

/**
 * Edits an imported line
 */
@Component({
  selector: 'edit-imported-line',
  templateUrl: 'edit-imported-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditImportedLineComponent extends BasePageComponent<ImportedLineDataForEdit> implements OnInit {

  id: string;
  form: FormGroup;
  controls: FieldControl[];

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

    this.addSub(this.importsService.getImportedLineDataForEdit({ id: this.id }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: ImportedLineDataForEdit) {
    super.onDataInitialized(data);

    const controls = data.importedLine.values.map(v => new FormControl(v));
    this.form = new FormGroup({
      values: new FormArray(controls)
    });

    this.controls = controls.map((control, i) => ({
      field: data.fields[i],
      control,
      multiline: data.importedLine.values[i]?.includes('\n')
    }));
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const params = { ...this.data.importedLine, ...this.form.value } as ImportedLineEdit;
    this.addSub(this.importsService.updateImportedLine({
      id: this.id,
      body: params
    }).subscribe(() => {
      this.router.navigate(['/imports', 'lines', 'view', this.id], { replaceUrl: true });
    }));
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.data?.file);
  }
}
