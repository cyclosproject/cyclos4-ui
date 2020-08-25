import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * A component to be shown in a dialog, opening the camera to scan a QR-code
 */
@Component({
  selector: 'scan-qrcode',
  templateUrl: 'scan-qrcode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanQrCodeComponent extends BaseComponent {

  ready$ = new BehaviorSubject(false);

  @Output() select = new EventEmitter<string>();

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  emit(qrCode: string) {
    this.select.emit(qrCode);
    this.close();
  }

  close() {
    this.modalRef.hide();
  }

  initialize() {
    this.ready$.next(true);
  }

  noCameras() {
    this.notification.error(this.i18n.field.scanQr.noCameras);
    this.close();
  }

  permissionResponse(granted: boolean | null) {
    if (granted === false) {
      this.notification.error(this.i18n.field.scanQr.noPermission);
      this.close();
    }
  }

}
