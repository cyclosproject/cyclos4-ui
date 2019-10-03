import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdQuestionsService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown in a dialog, allowing the user to ask a question for a given advertisement
 */
@Component({
  selector: 'ask-question-dialog',
  templateUrl: 'ask-question-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AskQuestionDialogComponent extends BaseComponent {

  @Input() id: string;
  @Output() done = new EventEmitter<void>();

  control = new FormControl(null, Validators.required);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private questionService: AdQuestionsService
  ) {
    super(injector);
  }

  askQuestion() {
    validateBeforeSubmit(this.control);
    if (!this.control.valid) {
      return;
    }
    this.addSub(this.questionService.createAdQuestion({
      ad: this.id,
      body: this.control.value
    }).subscribe(() => {
      this.done.emit();
      this.modalRef.hide();
    }));
  }

}
