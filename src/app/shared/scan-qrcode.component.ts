import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import QrScanner from 'qr-scanner';

QrScanner.WORKER_PATH = './qr-scanner-worker.min.js';

/**
 * A component to be shown in a dialog, opening the camera to scan a QR-code
 */
@Component({
  selector: 'scan-qrcode',
  templateUrl: 'scan-qrcode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanQrCodeComponent extends BaseComponent implements AfterViewInit, OnDestroy {

  ready$ = new BehaviorSubject(false);
  qrScanner: QrScanner;

  @ViewChild('video', { static: true }) video: ElementRef<HTMLVideoElement>;

  @Output() select = new EventEmitter<string>();

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    QrScanner.hasCamera().then(hasCamera => {
      if (!hasCamera) {
        this.noCameras();
      } else {
        this.qrScanner = new QrScanner(this.video.nativeElement,
          result => this.emit(result));
        this.qrScanner.start()
          .then(() => this.initialize())
          .catch(_e => {
            this.noPermission();
          });
      }
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.destroy();
  }

  emit(qrCode: string) {
    this.select.emit(qrCode);
    this.close();
  }

  close() {
    this.destroy();
    this.modalRef.hide();
  }

  initialize() {
    this.ready$.next(true);
    const style = this.video.nativeElement.style;
    style.opacity = '';
    style.width = '';
    style.height = '';
    style.transform = '';
  }

  private destroy() {
    if (this.qrScanner) {
      this.qrScanner.destroy();
    }
  }

  private noCameras() {
    this.notification.error(this.i18n.field.camera.noCameras);
    this.close();
  }

  private noPermission() {
    this.notification.error(this.i18n.field.camera.noPermission);
    this.close();
  }

}
