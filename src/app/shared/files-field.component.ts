import { ChangeDetectorRef, Component, ElementRef, Host, Input, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CustomField, StoredFile } from 'app/api/models';
import { FilesService } from 'app/api/services';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty, getValueAsArray, preprocessValueWithSeparator } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import download from 'downloadjs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
import { Messages } from 'app/messages/messages';

/**
 * Renders a widget for a field that allows uploading files
 */
@Component({
  selector: 'files-field',
  templateUrl: 'files-field.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FilesFieldComponent, multi: true }
  ]
})
export class FilesFieldComponent extends BaseFormFieldComponent<string | string[]> implements OnInit {

  /**
   * The maximum of files that can be uploaded
   */
  @Input() maxFiles = 1;

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  /**
   * Provides information about the initial stored files.
   * Uploaded files are tracked internally.
   */
  @Input() initialFiles: StoredFile | StoredFile[];

  files: StoredFile[];
  private uploadedFiles: StoredFile[];

  @ViewChild('focusHolder') focusHolder: ElementRef;

  /**
   * The custom field for uploaded temporary files
   */
  @Input() customField: CustomField;

  /**
   * The allowed mime types
   */
  @Input() mimeTypes: string[] = ['*/*'];

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public messages: Messages,
    private authHelper: AuthHelperService,
    public layout: LayoutService,
    private errorHandler: ErrorHandlerService,
    private filesService: FilesService,
    private changeDetector: ChangeDetectorRef,
    private modal: BsModalService) {
    super(controlContainer);
  }

  preprocessValue(value: any): string | string[] {
    return preprocessValueWithSeparator(value, this.separator);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.initialFiles == null) {
      this.files = [];
    } else if (this.initialFiles instanceof Array) {
      this.files = this.initialFiles;
    } else {
      this.files = [this.initialFiles];
    }
    this.uploadedFiles = [];
  }

  /**
   * Returns all selected file ids
   */
  get fileIds(): string[] {
    return getValueAsArray(this.value, this.separator);
  }

  protected getDisabledValue(): string {
    return this.fileIds.map(id => {
      const file = this.files.find(f => f.id === id);
      return file == null ? null : file.name;
    }).filter(n => n != null).join(', ');
  }

  onFilesUploaded(files: StoredFile[]) {
    if (this.maxFiles === 1) {
      this.removeAllFiles();
    }
    const ids = this.fileIds;
    files.forEach(i => ids.push(i.id));
    this.value = ids;
    this.uploadedFiles = [...files, ...this.uploadedFiles];
    this.files = [...this.files, ...files];
    // Manually mark the control as touched, as there's no native inputs
    this.formControl.markAsTouched();
  }

  manageFiles() {
    const ref = this.modal.show(ManageFilesComponent, {
      class: 'modal-form',
      initialState: {
        files: this.files
      }
    });
    const component = ref.content as ManageFilesComponent;
    this.addSub(component.result.pipe(take(1)).subscribe(result => {
      let value = this.fileIds;
      if (!empty(result.order)) {
        // The order has changed
        value = result.order;
      }
      if (!empty(result.removedFiles)) {
        // Remove each temp file in the list
        this.uploadedFiles
          .filter(i => result.removedFiles.includes(i.id))
          .forEach(i => this.filesService.deleteRawFile({ id: i.id }).subscribe());

        // Update the arrays
        this.files = this.files.filter(i => !result.removedFiles.includes(i.id));
        this.uploadedFiles = this.uploadedFiles.filter(i => !result.removedFiles.includes(i.id));
        value = value.filter(id => !result.removedFiles.includes(id));
      }
      this.files = value.map(id => this.files.find(i => i.id === id));
      this.value = value;
      ref.hide();

      // Manually mark the control as touched, as there's no native inputs
      this.notifyTouched();
    }));
  }

  removeAllFiles() {
    // Remove all uploaded temporary files
    this.uploadedFiles.forEach(f => {
      this.errorHandler.requestWithCustomErrorHandler(() => {
        this.filesService.deleteRawFile({ id: f.id }).subscribe();
      });
    });

    this.files = [];
    this.value = [];
    // Manually mark the control as touched, as there's no native inputs
    this.notifyTouched();
  }

  notifyTouched() {
    super.notifyTouched();
    this.changeDetector.detectChanges();
  }

  getFocusableControl() {
    return this.focusHolder.nativeElement;
  }

  appendAuth(url: string): string {
    return this.authHelper.appendAuth(url);
  }

  downloadFile(event: MouseEvent, file: StoredFile) {
    this.filesService.getRawFileContent({ id: file.id }).subscribe(blob => {
      download(blob, file.name, file.contentType);
    });
    event.stopPropagation();
    event.preventDefault();
  }
}
