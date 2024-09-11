import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  GeneralImportedFileContextEnum,
  ImportedFileDataForSearch,
  ImportedFileKind,
  ImportedFileQueryFilters,
  ImportedFileResult,
  ImportedFileStatusEnum,
  UserImportedFileContextEnum
} from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { SvgIcon } from 'app/core/svg-icon';
import { Action, HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * Search page for imported file
 */
@Component({
  selector: 'search-imported-files',
  templateUrl: 'search-imported-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchImportedFilesComponent
  extends BaseSearchPageComponent<ImportedFileDataForSearch, ImportedFileQueryFilters, ImportedFileResult>
  implements OnInit
{
  statuses = Object.values(ImportedFileStatusEnum);

  owner: string;
  systemContext: GeneralImportedFileContextEnum;
  user: string;
  userContext: UserImportedFileContextEnum;
  isSelf: boolean;

  title: string;
  mobileTitle: string;

  constructor(injector: Injector, private importsService: ImportsService, public importsHelper: ImportsHelperService) {
    super(injector);
  }

  getFormControlNames() {
    return ['kinds', 'statuses', 'beginCreationPeriod', 'endCreationPeriod'];
  }

  ngOnInit() {
    super.ngOnInit();

    const route = this.route.snapshot;

    this.owner = route.params.owner;
    let request: Observable<ImportedFileDataForSearch>;
    if (ApiHelper.SYSTEM === this.owner) {
      this.systemContext = route.params.context;
      request = this.importsService.getGeneralImportedFilesDataForSearch({
        context: this.systemContext
      });
    } else {
      this.userContext = route.params.context;
      this.user = this.owner;
      request = this.importsService.getUserImportedFilesDataForSearch({
        user: this.user,
        context: this.userContext
      });
    }
    this.stateManager.cache('data', request).subscribe(data => (this.data = data));
  }

  protected onDataInitialized(data: ImportedFileDataForSearch): void {
    super.onDataInitialized(data);
    switch (this.systemContext || this.userContext) {
      case GeneralImportedFileContextEnum.PAYMENTS:
        this.title = this.i18n.imports.title.payments;
        this.mobileTitle = this.i18n.imports.mobileTitle.payments;
        break;
      case UserImportedFileContextEnum.USER_PAYMENTS:
        this.title = this.i18n.imports.title.userPayments;
        this.mobileTitle = this.i18n.imports.mobileTitle.userPayments;
        break;
      case UserImportedFileContextEnum.USER_SEND_VOUCHERS:
        this.title = this.i18n.imports.title.userSendVouchers;
        this.mobileTitle = this.i18n.imports.mobileTitle.userSendVouchers;
        break;
      default:
        this.title = this.i18n.imports.title.generalSearch;
        this.mobileTitle = this.i18n.imports.mobileTitle.generalSearch;
    }

    this.isSelf = data.user && this.authHelper.isSelfOrOwner(data.user);

    if (!empty(data.manageKinds)) {
      const actionFn = (kind: ImportedFileKind) => {
        if (kind) {
          return () => this.router.navigate(['/imports', this.owner, kind, 'new']);
        } else {
          return () => null;
        }
      };
      const action = new HeadingAction(
        SvgIcon.ArrowUpCircle,
        this.i18n.imports.importNew,
        actionFn(data.manageKinds.length === 1 ? data.manageKinds[0] : null),
        true
      );
      if (data.manageKinds.length > 1) {
        action.subActions = data.manageKinds.map(
          kind => new Action(this.importsHelper.kindLabel(kind), actionFn(kind))
        );
      }
      this.headingActions = [action];
    }
  }

  protected doSearch(filter: ImportedFileQueryFilters): Observable<HttpResponse<ImportedFileResult[]>> {
    if (this.systemContext) {
      return this.importsService.searchGeneralImportedFiles$Response({
        context: this.systemContext,
        ...filter
      });
    } else {
      return this.importsService.searchUserImportedFiles$Response({
        user: this.user,
        context: this.userContext,
        ...filter
      });
    }
  }

  protected toSearchParams(value: any): ImportedFileQueryFilters {
    const filters = value as ImportedFileQueryFilters;
    filters.creationPeriod = ApiHelper.dateRangeFilter(value.beginCreationPeriod, value.endCreationPeriod);
    return filters;
  }

  resolveMenu() {
    return Menu.PAYMENT_IMPORTS;
  }

  get toLink() {
    return (row: ImportedFileResult) => this.path(row);
  }

  path(result: ImportedFileResult) {
    return ['/imports', 'files', 'view', result.id];
  }

  remove(file: ImportedFileResult) {
    this.confirmation.confirm({
      message: this.i18n.general.removeConfirm(file.fileName),
      callback: () => this.doRemove(file)
    });
  }

  private doRemove(file: ImportedFileResult) {
    this.addSub(
      this.importsService.deleteImportedFile({ id: file.id }).subscribe(() => {
        this.notification.snackBar(this.i18n.general.removeItemDone);
        this.update();
      })
    );
  }
}
