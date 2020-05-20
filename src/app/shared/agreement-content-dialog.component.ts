import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Agreement } from 'app/api/models';
import { AgreementsService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

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

  @Input() agreement: Agreement;

  content$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private agreementsService: AgreementsService,
    public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.agreementsService.getAgreementContent({ key: this.agreement.id })
      .subscribe(content => this.content$.next(content.content)));
  }

  print(element: HTMLElement, iframe: HTMLIFrameElement) {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<body onload="print()">${element.innerHTML}</body>`);
    doc.close();
    this.modalRef.hide();
  }
}
