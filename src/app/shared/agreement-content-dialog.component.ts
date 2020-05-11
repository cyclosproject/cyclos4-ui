import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Agreement, AgreementContent } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

type AgreementOrContent = Agreement | AgreementContent;

/**
 * Shows the content of a registration agreement in a modal dialog
 */
@Component({
  selector: 'agreement-content-dialog',
  templateUrl: 'agreement-content-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgreementsContentDialogComponent
  extends BaseComponent
  implements OnInit {

  @Input() agreement: AgreementOrContent;

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
