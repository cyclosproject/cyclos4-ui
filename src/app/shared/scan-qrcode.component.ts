import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import QrScanner from 'qr-scanner';
import { BehaviorSubject } from 'rxjs';

export const Timeout = 60_000;

/**
 * A component to be shown in a dialog, opening the camera to scan a QR-code
 */
@Component({
  selector: 'scan-qrcode',
  templateUrl: 'scan-qrcode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanQrCodeComponent extends BaseComponent implements AfterViewInit, OnDestroy {
  static PreferredCameraKey = 'preferredCamera';

  ready$ = new BehaviorSubject(false);
  qrScanner: QrScanner;
  cameras$ = new BehaviorSubject<Array<QrScanner.Camera>>([]);
  cameraControl: FormControl;
  timerControl: any;

  @ViewChild('video', { static: true }) video: ElementRef<HTMLVideoElement>;

  @Output() select = new EventEmitter<string>();

  constructor(injector: Injector, public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.cameraControl = new FormControl();
    this.timerControl = setTimeout(() => this.close(), Timeout);
  }

  ngAfterViewInit() {
    QrScanner.hasCamera().then(hasCamera => {
      if (!hasCamera) {
        this.noCameras();
      } else {
        QrScanner.listCameras(true)
          .then(cams => this.setupQrScanner(cams))
          .catch(() => this.noPermission());
      }
    });
  }

  private setupQrScanner(cams: QrScanner.Camera[]) {
    this.cameras$.next(cams);
    const preferredCamera = this.preferredCamera;
    this.qrScanner = new QrScanner(this.video.nativeElement, result => this.emit(result.data), {
      preferredCamera,
      highlightScanRegion: true
    });
    this.qrScanner
      .start()
      .then(() => this.initialize())
      .catch(() => this.noPermission());
    this.addSub(
      this.cameras$.subscribe(cams => {
        if (empty(this.cameraControl.value)) {
          const cam = cams.find(cam => cam.id === preferredCamera) ?? cams[0];
          this.cameraControl.setValue(cam?.id);
        }
      })
    );
    this.addSub(
      this.cameraControl.valueChanges.subscribe((cam: string) => {
        this.preferredCamera = cam;
        this.qrScanner.setCamera(cam);
      })
    );
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.destroy();
    clearTimeout(this.timerControl);
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

  private get preferredCamera(): string {
    return localStorage.getItem(ScanQrCodeComponent.PreferredCameraKey);
  }

  private set preferredCamera(id: string) {
    localStorage.setItem(ScanQrCodeComponent.PreferredCameraKey, id);
  }
}
