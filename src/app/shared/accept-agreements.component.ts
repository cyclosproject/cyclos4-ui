import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { Agreement, AgreementContent } from 'app/api/models';
import { AgreementsContentDialogComponent } from 'app/shared/agreement-content-dialog.component';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BsModalService } from 'ngx-bootstrap/modal';

type AgreementOrContent = Agreement | AgreementContent;

/**
 * Public registration step: confirmation
 */
@Component({
  selector: 'accept-agreements',
  templateUrl: 'accept-agreements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptAgreementsComponent
  extends BaseComponent
  implements OnInit {

  @Input() control: FormControl;
  @Input() agreements: AgreementOrContent[];

  agreementsControl: FormArray;

  constructor(
    injector: Injector,
    private modal: BsModalService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    if (!empty(this.agreements)) {
      const agreements = this.agreements.map(() => false);
      this.agreementsControl = this.formBuilder.array(agreements);
      this.addSub(this.agreementsControl.valueChanges.subscribe((flags: boolean[]) => {
        const allChecked = flags.length === flags.filter(f => f).length;
        this.control.patchValue(allChecked);
      }));
    }
  }

  showAgreement(agreement: AgreementOrContent, event: MouseEvent) {
    this.modal.show(AgreementsContentDialogComponent, {
      ignoreBackdropClick: true,
      class: 'modal-form modal-form-large',
      initialState: { agreement },
    });
    event.stopPropagation();
    event.preventDefault();
  }
}
