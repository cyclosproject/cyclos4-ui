import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Agreement } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * Shows the registration agreement(s) in a modal
 */
@Component({
  selector: 'registration-agreements',
  templateUrl: 'registration-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationAgreementsComponent
  extends BaseComponent
  implements OnInit {

  @Input() agreements: Agreement[];

  constructor(
    injector: Injector,
    public modalRef: BsModalRef) {
    super(injector);
  }

  print(element: HTMLElement, iframe: HTMLIFrameElement) {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<body onload="print()">${element.innerHTML}</body>`);
    doc.close();
    this.modalRef.hide();
  }
}
