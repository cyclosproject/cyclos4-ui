import { Component, Host, Input, Optional, SkipSelf, ChangeDetectorRef } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { I18n } from 'app/i18n/i18n';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { FormatService } from 'app/core/format.service';

/**
 * Component used to select one or more native browser files
 */
@Component({
  selector: 'file-field',
  templateUrl: 'file-field.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FileFieldComponent, multi: true }
  ]
})
export class FileFieldComponent extends BaseFormFieldComponent<File | File[]> {

  /**
   * The maximum of files that can be uploaded
   */
  @Input() maxFiles = 1;

  private fileList: FileList;

  /**
   * The allowed mime types to be uploaded
   */
  accept: string;
  @Input() get mimeTypes(): string[] {
    return (this.accept || '').split(',').map(a => a.trim());
  }
  set mimeTypes(mimeTypes: string[]) {
    this.accept = empty(mimeTypes) ? null : mimeTypes.join();
  }

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public i18n: I18n,
    public layout: LayoutService,
    public format: FormatService,
    private changeDetector: ChangeDetectorRef) {
    super(controlContainer);
  }

  get files(): File[] {
    const files: File[] = [];
    if (this.fileList && this.fileList.length > 0) {
      const max = Math.min(this.fileList.length, this.maxFiles);
      for (let i = 0; i < max; i++) {
        // Don't add more files than allowed
        files.push(this.fileList.item(i));
      }
    }
    return files;
  }

  protected getDisabledValue(): string {
    return this.files.map(f => f.name).join(', ');
  }

  onDisabledChange(isDisabled: boolean) {
    super.onDisabledChange(isDisabled);
    this.changeDetector.detectChanges();
  }

  getFocusableControl() {
    return null;
  }

  filesSelected(fileList: FileList) {
    this.fileList = fileList;
    const files = this.files;
    this.value = this.maxFiles === 1 ? files.length === 0 ? null : files[0] : files;
    this.changeDetector.detectChanges();
  }

}
