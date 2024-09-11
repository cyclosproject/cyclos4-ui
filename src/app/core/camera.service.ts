import { Injectable } from '@angular/core';
import { NotificationService } from 'app/core/notification.service';
import { CaptureCameraComponent } from 'app/shared/capture-camera.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';

/**
 * The confirm calls its callback using this parameter
 */
export interface ConfirmCallbackParams {
  confirmationPassword?: string;
  customValues?: { [key: string]: string };
}

/**
 * Service used to capture the device camera
 */
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor(private modal: BsModalService, private notification: NotificationService) {}

  /**
   * Opens a dialog to capture an image from the device camera
   */
  capture(callback: (file: File) => any) {
    const ref = this.modal.show(CaptureCameraComponent, {
      class: 'modal-form',
      initialState: {
        errorHandler: (msg: string) => this.notification.error(msg)
      }
    });
    const component = ref.content as CaptureCameraComponent;
    component.select.pipe(first()).subscribe(callback);
  }
}
