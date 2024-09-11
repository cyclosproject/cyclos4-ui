import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ImportedFileKind, ImportedFileProgress, ImportedFileStatusEnum, ImportedFileView } from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const ProgressStatuses = [
  ImportedFileStatusEnum.READING_CSV,
  ImportedFileStatusEnum.READING_ZIP,
  ImportedFileStatusEnum.IMPORTING
];
const ValidationStatuses = [ImportedFileStatusEnum.READY, ImportedFileStatusEnum.READING_CSV];
const ImportStatuses = [ImportedFileStatusEnum.IMPORTING, ImportedFileStatusEnum.IMPORTED];

/**
 * Displays details of an imported file
 */
@Component({
  selector: 'view-imported-file',
  templateUrl: 'view-imported-file.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewImportedFileComponent extends BaseViewPageComponent<ImportedFileView> implements OnInit {
  ImportedFileStatusEnum = ImportedFileStatusEnum;

  title: string;
  mobileTitle: string;
  id: string;
  isSelf: boolean;
  kind: string;
  archiveValue: string;
  showValidation: boolean;
  showImport: boolean;
  progressTimer: any;
  showProgressBar: boolean;
  progress$ = new BehaviorSubject<ImportedFileProgress>(null);
  progressValue$: Observable<number>;

  constructor(injector: Injector, private importsService: ImportsService, public importsHelper: ImportsHelperService) {
    super(injector);
  }

  get file(): ImportedFileView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.importsService.viewImportedFile({ id: this.id }).subscribe(file => (this.data = file)));
  }

  onDataInitialized(file: ImportedFileView) {
    super.onDataInitialized(file);

    this.isSelf = file.user && this.authHelper.isSelfOrOwner(file.user);

    switch (file.kind) {
      case ImportedFileKind.PAYMENTS:
        this.title = this.i18n.imports.title.payments;
        this.mobileTitle = this.i18n.imports.mobileTitle.payments;
        break;
      case ImportedFileKind.USER_PAYMENTS:
        this.title = this.i18n.imports.title.userPayments;
        this.mobileTitle = this.i18n.imports.mobileTitle.userPayments;
        break;
      default:
        this.title = this.i18n.imports.title.generalDetails;
        this.mobileTitle = this.i18n.imports.mobileTitle.generalDetails;
        // Only for general imports we show the kind
        this.kind = this.importsHelper.kindLabel(file.kind);
        break;
    }

    // Get the archiving date value
    if (file.archiveDate) {
      switch (file.status) {
        case ImportedFileStatusEnum.ARCHIVED:
          this.archiveValue = this.format.formatAsDate(file.archiveDate);
          break;
        case ImportedFileStatusEnum.READING_CSV:
        case ImportedFileStatusEnum.READING_ZIP:
          // Don't show anything in archive while still reading
          break;
        default:
          this.archiveValue = this.i18n.imports.archivingDateValue(this.format.formatAsDate(file.archiveDate));
          break;
      }
    }

    const progress = file.progress || {};
    this.showValidation =
      ValidationStatuses.includes(file.status) ||
      ImportStatuses.includes(file.status) ||
      !!progress.linesReady ||
      !!progress.linesValidationError ||
      !!progress.linesSkipped;
    this.showImport = ImportStatuses.includes(file.status) || !!progress.linesImported || !!progress.linesImportError;

    const headingActions: HeadingAction[] = [];
    headingActions.push(new HeadingAction(SvgIcon.List, this.i18n.imports.lines, () => this.searchLines(), true));
    if (file.canProcess) {
      headingActions.push(
        new HeadingAction(SvgIcon.CheckCircle, this.i18n.imports.process.label, () => this.process(), true)
      );
    }
    if (file.canAbort) {
      headingActions.push(new HeadingAction(SvgIcon.XCircle, this.i18n.imports.abort.label, () => this.abort()));
    }
    if (file.canEdit) {
      headingActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => this.edit()));
    }
    if (file.canRemove) {
      headingActions.push(new HeadingAction(SvgIcon.Trash, this.i18n.general.remove, () => this.remove()));
    }
    this.headingActions = headingActions;

    // When processing, we'll poll for progress updates
    this.showProgressBar = ProgressStatuses.includes(file.status);
    if (this.showProgressBar) {
      this.progressTimer = setInterval(() => this.updateProgress(), 1000);
      this.progressValue$ = this.progress$.asObservable().pipe(map(p => Math.round(p.progress * 100)));
    }
    this.progress$.next(file.progress);
  }

  searchLines() {
    this.router.navigate(['/imports', 'lines', 'search', this.id]);
  }

  /**
   * Starts the processing of this file
   */
  private process() {
    this.confirmation.confirm({
      title: this.i18n.imports.process.label,
      message: this.i18n.imports.process.confirmation(this.file.progress?.linesReady),
      callback: () => {
        this.addSub(
          this.importsService
            .processImportedFile({
              id: this.id
            })
            .subscribe(() => {
              this.notification.snackBar(this.i18n.imports.process.done);
              this.reload();
            })
        );
      }
    });
  }

  /**
   * Starts the processing of this file
   */
  private abort() {
    this.confirmation.confirm({
      title: this.i18n.imports.abort.label,
      message: this.i18n.imports.abort.confirmation,
      callback: () => {
        this.addSub(
          this.importsService
            .abortImportedFile({
              id: this.id
            })
            .subscribe(() => {
              this.notification.snackBar(this.i18n.imports.abort.done);
              this.reload();
            })
        );
      }
    });
  }

  /**
   * Navigate to the edit page
   */
  private edit() {
    this.router.navigate(['/imports', 'files', 'edit', this.id]);
  }

  /**
   * Removes the current file
   */
  private remove() {
    this.confirmation.confirm({
      message: this.i18n.general.removeConfirm(this.file.fileName),
      callback: () => {
        this.addSub(
          this.importsService.deleteImportedFile({ id: this.id }).subscribe(() => {
            this.notification.snackBar(this.i18n.general.removeDone(this.file.fileName));
            history.back();
          })
        );
      }
    });
  }

  private updateProgress() {
    this.addSub(
      this.importsService.viewImportedFile({ id: this.id, fields: ['status', 'progress'] }).subscribe(data => {
        if (data.status !== this.file.status) {
          // When the status has changed, reload the page completely
          clearInterval(this.progressTimer);
          this.reload();
        } else {
          // Update the progress
          this.progress$.next(data.progress);
        }
      })
    );
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.file);
  }
}
