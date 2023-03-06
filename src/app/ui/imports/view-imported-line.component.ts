import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ImportedField, ImportedLineView } from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';

/**
 * Displays details of an imported line
 */
@Component({
  selector: 'view-imported-line',
  templateUrl: 'view-imported-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewImportedLineComponent extends BaseViewPageComponent<ImportedLineView> implements OnInit {

  id: string;

  importedUrl: string;

  constructor(
    injector: Injector,
    private importsService: ImportsService,
    public importsHelper: ImportsHelperService) {
    super(injector);
  }

  get line(): ImportedLineView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.importsService.viewImportedLine({ id: this.id })
      .subscribe(file => this.data = file));
  }

  onDataInitialized(line: ImportedLineView) {
    super.onDataInitialized(line);

    this.importedUrl = this.importsHelper.importedRowUrl(line.file.kind, line.importedEntityId);

    const headingActions: HeadingAction[] = [];
    if (line.canEdit) {
      headingActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => this.edit(), true));
    }
    if (line.canInclude) {
      headingActions.push(new HeadingAction(SvgIcon.PlusCircle, this.i18n.imports.include.label, () => this.include(), true));
    }
    if (line.canSkip) {
      headingActions.push(new HeadingAction(SvgIcon.DashCircle, this.i18n.imports.skip.label, () => this.skip(), true));
    }
    this.headingActions = headingActions;
  }

  lineValue(field: ImportedField) {
    const i = this.line.fields.indexOf(field);
    return this.line.values[i];
  }

  private edit() {
    this.router.navigate(['/imports', 'lines', 'edit', this.id]);
  }

  private skip() {
    this.addSub(this.importsService.skipImportedLines({
      id: this.line.file.id,
      lines: [this.id]
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.imports.skip.done);
      this.reload();
    }));
  }

  private include() {
    this.addSub(this.importsService.includeImportedLines({
      id: this.line.file.id,
      lines: [this.id]
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.imports.include.done);
      this.reload();
    }));
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.line?.file);
  }
}
