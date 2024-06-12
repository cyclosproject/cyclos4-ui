import { HttpClient, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  EventEmitter, Injector, Input, OnDestroy, Output, ViewChild
} from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { CustomField, Image, ImageKind, TempImageTargetEnum, UserImageKind } from 'app/api/models';
import { ImagesService } from 'app/api/services/images.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { StoredFileCacheService } from 'app/core/stored-file-cache.service';
import { BaseComponent } from 'app/shared/base.component';
import { resizeImage, ResizeResult, truthyAttr, urlJoin } from 'app/shared/helper';
import { BehaviorSubject, forkJoin, Observable, Subscription } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';

/**
 * Represents an image file being uploaded
 */
export class ImageToUpload {
  progress$ = new BehaviorSubject(0);
  subscription: Subscription;
  uploadDone = false;
  image: Image;

  constructor(
    public name: string,
    public width: number,
    public height: number,
    public content: Blob) {
  }

  get totalSize(): number {
    return this.content.size;
  }

  get progress(): number {
    return this.progress$.value;
  }

  set progress(progress: number) {
    this.progress$.next(progress);
  }
}

/**
 * Component used to upload images
 */
@Component({
  selector: 'image-upload',
  templateUrl: 'image-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent extends BaseComponent implements OnDestroy {

  uploading$ = new BehaviorSubject(false);

  @Input() containerClass = '';
  @Input() max = 1;
  @Input() target: ImageKind | TempImageTargetEnum;
  @Input() owner = '';
  @Input() user = '';
  @Input() customField: CustomField;
  @Output() uploadDone = new EventEmitter<Image[]>();
  @ViewChild('inputField', { static: true }) inputField: ElementRef;

  private _keepUrls: boolean | string = false;
  @Input() get keepUrls(): boolean | string {
    return this._keepUrls;
  }
  set keepUrls(keep: boolean | string) {
    this._keepUrls = truthyAttr(keep);
  }

  files = new BehaviorSubject<ImageToUpload[]>(null);
  private urlsToRevoke: string[] = [];
  private subscription: Subscription;

  constructor(
    injector: Injector,
    private http: HttpClient,
    private apiConfiguration: ApiConfiguration,
    private imagesService: ImagesService,
    private changeDetector: ChangeDetectorRef,
    private nextRequestState: NextRequestState,
    private authHelper: AuthHelperService,
    private storedFileCacheService: StoredFileCacheService
  ) {
    super(injector);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (!this.keepUrls) {
      for (const url of this.urlsToRevoke) {
        URL.revokeObjectURL(url);
      }
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Shows a file picker to the user.
   * When the user selects, immediately uploads the images.
   * Once the images are uploaded, emit the `uploadDone` event.
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

  /**
   * Uploads a blob as image
   */
  uploadFile(original: File): void {
    const dataForUi = this.dataForFrontendHolder.dataForUi;
    const maxWidth = (dataForUi || {}).maxImageWidth || 2000;
    const maxHeight = (dataForUi || {}).maxImageHeight || 2000;

    resizeImage(original, maxWidth, maxHeight).pipe(
      first(),
      switchMap((result: ResizeResult) => {
        const toUpload = new ImageToUpload(original.name, result.width, result.height, result.content);
        return this.doUpload(toUpload);
      }))
      .subscribe(image => {
        this.uploadDone.emit([image]);
      });
  }

  filesSelected(fileList: FileList) {
    if (fileList.length === 0) {
      // No files were selected
      return;
    }

    // Upload each file
    this.uploading$.next(true);

    const dataForUi = this.dataForFrontendHolder.dataForUi;
    const maxWidth = (dataForUi || {}).maxImageWidth || 2000;
    const maxHeight = (dataForUi || {}).maxImageHeight || 2000;

    this.files.next([]);

    // First resize each image
    const resizeObservables: Observable<ResizeResult>[] = [];
    const names: string[] = [];
    const max = Math.min(this.max, fileList.length);
    for (let i = 0; i < max; i++) {
      const file = fileList.item(i);
      resizeObservables.push(resizeImage(file, maxWidth, maxHeight));
      names.push(file.name);
    }
    // Once all images are resized, perform the upload
    this.subscription = forkJoin(resizeObservables).subscribe(results => {
      this.subscription.unsubscribe();

      this.changeDetector.detectChanges();

      const observables: Observable<Image>[] = [];
      const files = [];
      for (let i = 0; i < results.length; i++) {
        const name = names[i];
        const result = results[i];
        const toUpload = new ImageToUpload(name, result.width, result.height, result.content);
        files.push(toUpload);
        observables.push(this.doUpload(toUpload));
      }
      this.files.next(files);

      // Join all requests in a single subscription
      this.subscription = forkJoin(observables).subscribe(images => {
        const input = this.inputField.nativeElement as HTMLInputElement;
        input.value = null;
        this.subscription.unsubscribe();
        this.files.next([]);
        this.uploading$.next(false);
        this.uploadDone.emit(images);
        this.changeDetector.detectChanges();
      });
    });
  }

  private doUpload(file: ImageToUpload): Observable<Image> {
    return new Observable(observer => {
      let params: any;
      let url = 'images/temp';
      switch (this.target) {
        case ImageKind.MARKETPLACE:
          // Upload image to the ad directly
          if (!this.owner) {
            throw new Error('Missing owner');
          }
          url = `marketplace/${this.owner}/images`;
          break;
        case ImageKind.PROFILE:
          // Upload image to the user directly
          if (!this.owner) {
            throw new Error('Missing owner');
          }
          url = `${this.owner}/images`;
          break;
        case ImageKind.USER_CUSTOM:
          // Upload a user custom image
          if (!this.owner) {
            throw new Error('Missing owner');
          }
          url = `${this.owner}/images`;
          params = {
            kind: UserImageKind.CUSTOM,
          };
          break;
        case ImageKind.SYSTEM_CUSTOM:
          // Upload a system custom image. In this case owner is actually the category.
          if (!this.owner) {
            throw new Error('Missing category');
          }
          url = `/system-images/${this.owner}`;
          break;
        default:
          // A temp image
          params = {
            target: this.target,
            guestKey: this.authHelper.guestKey,
            user: this.user,
            customField: this.customField == null ? null : this.customField.id,
            customFieldKind: this.customField == null ? null : this.customField.kind,
          };
      }

      const data = new FormData();
      data.append('image', file.content, file.name);

      url = this.nextRequestState.appendAuth(url);
      url = urlJoin(this.apiConfiguration.rootUrl, url);
      file.subscription = this.http.post(url, data, {
        observe: 'events',
        reportProgress: true,
        responseType: 'text',
        params,
      }).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = event.loaded;
        } else if (event.type === HttpEventType.Response) {
          // Once the upload is complete, we have to fetch the image model
          file.subscription.unsubscribe();
          file.uploadDone = true;
          this.addSub(this.imagesService.viewImage({ id: event.body }).pipe(first()).subscribe(image => {
            file.image = image;
            this.storedFileCacheService.write(image);
            observer.next(file.image);
            observer.complete();
            this.changeDetector.detectChanges();
          }));
        }
      }, err => {
        (this.files.value || []).forEach(f => {
          if (f.subscription) {
            f.subscription.unsubscribe();
          }
        });
        this.files.next([]);
        this.uploading$.next(false);
        observer.error(err);
        observer.complete();
        this.changeDetector.detectChanges();
      });
    });
  }
}
