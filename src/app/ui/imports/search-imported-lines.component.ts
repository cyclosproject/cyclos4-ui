import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  ImportedField,
  ImportedLineDataForSearch,
  ImportedLineQueryFilters,
  ImportedLineResult,
  ImportedLineStatusEnum
} from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Observable } from 'rxjs';

/**
 * Search page for imported lines of a given file
 */
@Component({
  selector: 'search-imported-lines',
  templateUrl: 'search-imported-lines.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchImportedLinesComponent
  extends BaseSearchPageComponent<ImportedLineDataForSearch, ImportedLineQueryFilters, ImportedLineResult>
  implements OnInit
{
  statuses = Object.values(ImportedLineStatusEnum);

  id: string;

  constructor(injector: Injector, private importsService: ImportsService, public importsHelper: ImportsHelperService) {
    super(injector);
  }

  getFormControlNames() {
    return ['keywords', 'statuses', 'lineNumber'];
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.id = route.params.id;
    this.stateManager
      .cache('data', this.importsService.getImportedLinesDataForSearch({ id: this.id }))
      .subscribe(data => (this.data = data));
  }

  protected doSearch(filter: ImportedLineQueryFilters): Observable<HttpResponse<ImportedLineResult[]>> {
    return this.importsService.searchImportedLines$Response({
      id: this.id,
      ...filter
    });
  }

  protected toSearchParams(value: any): ImportedLineQueryFilters {
    const filters = value as ImportedLineQueryFilters;
    filters.lineNumbers = value.lineNumber ? [value.lineNumber] : null;
    return filters;
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.data?.file);
  }

  get toLink() {
    return (row: ImportedLineResult) => this.path(row);
  }

  rowValue(field: ImportedField, row: ImportedLineResult) {
    const i = this.data.fieldsInList.indexOf(field);
    return (row.values || [])[i];
  }

  showError(row: ImportedLineResult) {
    if (row?.errorMessage) {
      this.notification.error(row.errorMessage);
    }
  }

  navigate(row: ImportedLineResult) {
    const url = this.importsHelper.importedRowUrl(this.data.file.kind, row.importedEntityId);
    if (url) {
      this.router.navigateByUrl(url);
    }
  }

  path(result: ImportedLineResult) {
    return ['/imports', 'lines', 'view', result.id];
  }
}
