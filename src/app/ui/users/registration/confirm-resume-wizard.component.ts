import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

export const Timeout = 60_000;

/**
 * A component to be shown in a dialog, opening the camera to scan a QR-code
 */
@Component({
  selector: 'confirm-resume-wizard',
  templateUrl: 'confirm-resume-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmResumeWizardComponent extends BaseComponent {

  @Output() select = new EventEmitter<boolean>();

  constructor(
    injector: Injector,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  emit(selection: boolean) {
    this.select.emit(selection);
    this.close();
  }

  close() {
    this.modalRef.hide();
  }
}
