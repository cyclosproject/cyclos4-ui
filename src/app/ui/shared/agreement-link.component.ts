import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Agreement } from 'app/api/models';
import { truthyAttr } from 'app/shared/helper';
import { AgreementsContentDialogComponent } from 'app/ui/shared/agreement-content-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Component used to show a link with agreement.
 * When clicking, shows the agreement content.
 */
@Component({
  selector: 'agreement-link',
  templateUrl: 'agreement-link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgreementLinkComponent {
  @HostBinding('class.inline-flex') classInlineFlex = true;

  @Input() agreement: Agreement;
  @Input() version: number;

  _ignoreRequired: boolean | string = false;
  @Input() get ignoreRequired(): boolean | string {
    return this._ignoreRequired;
  }
  set ignoreRequired(flag: boolean | string) {
    this._ignoreRequired = truthyAttr(flag);
  }

  constructor(private modal: BsModalService) {}

  showAgreement(event: MouseEvent) {
    this.modal.show(AgreementsContentDialogComponent, {
      ignoreBackdropClick: true,
      class: 'modal-form modal-form-large',
      initialState: {
        agreement: this.agreement,
        version: this.version
      }
    });
    event.stopPropagation();
    event.preventDefault();
  }
}
