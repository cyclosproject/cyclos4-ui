import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import b64toBlob from 'b64-to-blob';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { WebcamImage, WebcamInitError } from 'ngx-webcam';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * A component to be shown in a dialog, opening the camera to capture an image
 */
@Component({
  selector: 'capture-camera',
  templateUrl: 'capture-camera.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaptureCameraComponent implements AfterViewChecked {

  dimensions$ = new BehaviorSubject<number[]>(null);
  trigger$ = new Subject<boolean>();

  @Input() errorHandler: (message: string) => any;

  @Output() select = new EventEmitter<File>();
  @ViewChild('container', { static: true }) container: ElementRef<HTMLDivElement>;

  constructor(
    public modalRef: BsModalRef,
    public format: FormatService,
    @Inject(I18nInjectionToken) public i18n: I18n
  ) {
  }

  ngAfterViewChecked() {
    if (this.dimensions$.value == null) {
      setTimeout(() => {
        const dim = this.container.nativeElement.getBoundingClientRect();
        if (dim.width > 0) {
          this.dimensions$.next([dim.width, dim.height]);
        }
      });
    }
  }

  emit(image: WebcamImage) {
    const type = 'image/jpeg';
    const blob = b64toBlob(image.imageAsBase64, type);
    const now = new Date();
    const timestamp = this.format.formatAsDateTime(now);
    const file = new File([blob], this.i18n.field.camera.fileName(timestamp), {
      lastModified: now.getTime(),
      type
    });
    this.select.emit(file);
    this.close();
  }

  close() {
    this.modalRef.hide();
  }

  handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError) {
      if (error.mediaStreamError.name === 'NotAllowedError') {
        this.errorHandler(this.i18n.field.camera.noPermission);
      } else if (error.mediaStreamError.name === 'NotFoundError') {
        this.errorHandler(this.i18n.field.camera.noCameras);
      }
    }
    this.close();
  }
}
