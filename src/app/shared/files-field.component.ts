import {
  Component, Input, ViewChild, ElementRef, Optional, Host,
  SkipSelf, OnInit, ChangeDetectorRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { empty, preprocessValueWithSeparator, getValueAsArray } from 'app/shared/helper';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { StoredFile, CustomField } from 'app/api/models';
import { BsModalService } from 'ngx-bootstrap/modal';
import { FilesService } from 'app/api/services';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { take } from 'rxjs/operators';
import { ApiHelper } from 'app/shared/api-helper';
import * as download from 'downloadjs';
import { NextRequestState } from 'app/core/next-request-state';
import { LayoutService } from 'app/shared/layout.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';

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
    public layout: LayoutService,
    private errorHandler: ErrorHandlerService,
    private filesService: FilesService,
    private changeDetector: ChangeDetectorRef,
    private nextRequestState: NextRequestState,
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
          .forEach(i => this.filesService.deleteRawFile(i.id).subscribe());

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
        this.filesService.deleteRawFile(f.id).subscribe();
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
    return ApiHelper.appendAuth(url, this.nextRequestState);
  }

  downloadFile(event: MouseEvent, file: StoredFile) {
    this.filesService.getRawFileContent(file.id).subscribe(blob => {
      download(blob, file.name, file.contentType);
    });
    event.stopPropagation();
    event.preventDefault();
  }
}
