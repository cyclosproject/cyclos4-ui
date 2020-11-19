import { HttpClient, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  EventEmitter, Injector, Input, Output, ViewChild
} from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { CustomFieldDetailed, InputErrorCode, StoredFile } from 'app/api/models';
import { FilesService } from 'app/api/services/files.service';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject, forkJoin, Observable, Subscription } from 'rxjs';

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
  selector: 'temp-file-upload',
  templateUrl: 'temp-file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TempFileUploadComponent extends BaseComponent {

  uploading$ = new BehaviorSubject(false);

  @Input() containerClass = '';
  @Input() max = 1;
  @Input() customField: CustomFieldDetailed;
  @Output() uploadDone = new EventEmitter<StoredFile[]>();
  @ViewChild('inputField', { static: true }) inputField: ElementRef;

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
    injector: Injector,
    private http: HttpClient,
    private filesService: FilesService,
    private apiConfiguration: ApiConfiguration,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
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
    const observables: Observable<StoredFile>[] = [];
    this.files = [];
    const max = Math.min(this.max, fileList.length);
    const tooLarge = [];
    const maxSize = this.dataForFrontendHolder.dataForUi.maxUploadSize || Number.MAX_SAFE_INTEGER;
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
        maxFileSize: maxSize,
      });
    }
    if (observables.length === 0) {
      return;
    }

    // Join all requests in a single subscription
    this.subscription = forkJoin(observables).subscribe(storedFiles => {
      const input = this.inputField.nativeElement as HTMLInputElement;
      input.value = null;
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
          guestKey: this.authHelper.guestKey,
          customField: this.customField == null ? null : this.customField.id,
          customFieldKind: this.customField == null ? null : this.customField.kind,
        },
      }).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = event.loaded;
        } else if (event.type === HttpEventType.Response) {
          // Once the upload is complete, we have to fetch the stored file model
          file.subscription.unsubscribe();
          file.uploadDone = true;
          this.addSub(this.filesService.viewRawFile({ id: event.body }).subscribe(storedFile => {
            file.storedFile = storedFile;
            // Complete the observer
            observer.next(storedFile);
            observer.complete();
            this.changeDetector.detectChanges();
          }));
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
