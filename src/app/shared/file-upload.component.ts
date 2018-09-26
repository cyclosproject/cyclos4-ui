import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Subscription, Observable, forkJoin } from 'rxjs';
import { CustomField, StoredFile, CustomFieldDetailed, InputError, InputErrorCode } from 'app/api/models';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ApiConfiguration } from 'app/api/api-configuration';
import { FilesService } from 'app/api/services';
import { LoginService } from 'app/core/login.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';

/**
 * Represents a file being uploaded
 */
export class FileToUpload {

  private _file: File;
  progress$ = new BehaviorSubject(0);
  subscription: Subscription;
  uploadDone = false;
  storedFile: StoredFile;

  constructor(file: File) {
    this._file = file;
  }

  get name(): string {
    return this._file ? this._file.name : null;
  }

  get totalSize(): number {
    return this._file ? this._file.size : 0;
  }

  get progress(): number {
    return this.progress$.value;
  }

  set progress(progress: number) {
    this.progress$.next(progress);
  }

  get file(): File {
    return this._file;
  }

}

/**
 * Component used to upload temporary files
 */
@Component({
  selector: 'file-upload',
  templateUrl: 'file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {

  uploading$ = new BehaviorSubject(false);

  @Input() containerClass = '';
  @Input() max = 1;
  @Input() customField: CustomFieldDetailed;
  @Output() uploadDone = new EventEmitter<StoredFile[]>();
  @ViewChild('inputField') inputField: ElementRef;

  /**
   * The allowed mime types to be uploaded
   */
  @Input() mimeTypes: string[] = ['*/*'];


  constructor(
    private http: HttpClient,
    private filesService: FilesService,
    private apiConfiguration: ApiConfiguration,
    private errorHandler: ErrorHandlerService,
    private login: LoginService,
    private dataForUi: DataForUiHolder,
    private changeDetector: ChangeDetectorRef) {
  }

  files: FileToUpload[];
  private subscription: Subscription;

  /**
   * Shows a file picker to the user.
   * When the user selects, immediately uploads the files.
   * Once the files are uploaded, emit the `uploadDone` event.
   */
  perform() {
    if (this.uploading$.value) {
      // Already uploading
      return;
    }

    // The click event is blocking
    const el = this.inputField.nativeElement as HTMLInputElement;
    el.click();
  }

  filesSelected(fileList: FileList) {
    if (fileList.length === 0) {
      // No files were selected
      return;
    }

    // Upload each file
    this.uploading$.next(true);
    const observables = [];
    this.files = [];
    const max = Math.min(this.max, fileList.length);
    const tooLarge = [];
    const maxSize = this.dataForUi.dataForUi.maxUploadSize || Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < max; i++) {
      const file = fileList.item(i);
      if (file.size > maxSize) {
        tooLarge.push(file);
      } else {
        const toUpload = new FileToUpload(file);
        this.files.push(toUpload);
        observables.push(this.doUpload(toUpload));
      }
    }
    if (tooLarge.length > 0) {
      this.errorHandler.handleInputError({
        code: InputErrorCode.FILE_UPLOAD_SIZE,
        maxFileSize: maxSize
      });
    }
    if (observables.length === 0) {
      return;
    }

    // Join all requests in a single subscription
    this.subscription = forkJoin<StoredFile>(observables).subscribe(storedFiles => {
      this.subscription.unsubscribe();
      this.files = [];
      this.uploading$.next(false);
      this.uploadDone.emit(storedFiles);
      this.changeDetector.detectChanges();
    });
  }

  doUpload(file: FileToUpload): Observable<StoredFile> {
    return new Observable(observer => {
      const url = `${this.apiConfiguration.rootUrl}/files/temp`;
      const data = new FormData();
      data.append('file', file.file, file.name);

      file.subscription = this.http.post(url, data, {
        observe: 'events',
        reportProgress: true,
        responseType: 'text',
        params: {
          guestKey: this.login.guestKey,
          customField: this.customField == null ? null : this.customField.id,
          customFieldKind: this.customField == null ? null : this.customField.kind,
        }
      }).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = event.loaded;
        } else if (event.type === HttpEventType.Response) {
          // Once the upload is complete, we have to fetch the stored file model
          file.subscription.unsubscribe();
          file.uploadDone = true;
          file.subscription = this.filesService.viewRawFile({ id: event.body }).subscribe(storedFile => {
            file.storedFile = storedFile;
            // Complete the observer
            observer.next(storedFile);
            observer.complete();
            this.changeDetector.detectChanges();
          });
        }
      }, err => {
        this.files.forEach(f => {
          if (f.subscription) {
            f.subscription.unsubscribe();
          }
        });
        this.files = [];
        this.uploading$.next(false);
        observer.error(err);
        observer.complete();
        this.changeDetector.detectChanges();
      });
    });
  }
}
