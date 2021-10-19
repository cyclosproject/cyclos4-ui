import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { PaymentFeedbackDataForEdit, PaymentFeedbackDataForGive, PaymentFeedbackView, ReferenceLevelEnum } from 'app/api/models';
import { PaymentFeedbacksService } from 'app/api/services/payment-feedbacks.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * Set or edit a payment feedback
 */
@Component({
  selector: 'set-feedback',
  templateUrl: 'set-feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetFeedbackComponent
  extends BasePageComponent<any>
  implements OnInit {

  ReferenceLevelEnum = ReferenceLevelEnum;

  id: string;
  transactionId: string;
  create: boolean;
  form: FormGroup;
  dataForGive: PaymentFeedbackDataForGive;
  dataForEdit: PaymentFeedbackDataForEdit;
  dataForView: PaymentFeedbackView;

  constructor(
    injector: Injector,
    protected feedbackService: PaymentFeedbacksService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.transactionId = this.route.snapshot.params.transactionId;
    this.id = this.route.snapshot.params.id;

    if (this.id) {
      this.getData();
    } else {
      this.create = true;
      this.getDataForGive();
    }
  }

  protected getDataForGive() {
    this.feedbackService.getPaymentFeedbacksDataForGive({
      key: this.transactionId ? this.transactionId : this.id
    }).subscribe(data => {
      this.dataForGive = data;
      this.data = {};
    });
  }

  protected getData() {
    this.feedbackService.viewPaymentFeedback({
      key: this.id
    }).subscribe(data => {
      this.dataForView = data;
      if (this.dataForView.canGive) {
        this.getDataForGive();
      } else if (data.canEdit) {
        this.getDataForEdit();
      } else {
        this.data = {};
      }
    });
  }

  protected getDataForEdit() {
    this.feedbackService.getPaymentFeedbackDataForEdit({
      key: this.id
    }).subscribe(data => {
      this.dataForEdit = data;
      this.data = {};
    });
  }

  onDataInitialized() {
    this.form = this.formBuilder.group({
      level: [this.level, Validators.required],
      comments: [this.comments, Validators.required],
      giveComments: [this.comments, Validators.required],
      replyComments: this.dataForEdit ? this.dataForEdit.feedback.replyComments : null,
      managerComments: this.dataForEdit ? this.dataForEdit.feedback.managerComments : null,
      version: this.dataForEdit ? this.dataForEdit.feedback.version : null,
    });
  }

  get level() {
    if (this.dataForGive) {
      return this.dataForGive.feedback.level;
    } else if (this.dataForEdit) {
      return this.dataForEdit.feedback.level;
    }
    return null;
  }

  get comments() {
    if (this.dataForEdit) {
      return this.dataForEdit.feedback.giveComments;
    } else if (this.dataForGive) {
      return this.dataForGive.feedback.comments;
    }
    return null;
  }

  get from() {
    if (this.create && this.dataForGive.transaction) {
      return this.dataForGive.transaction.from.user;
    } else {
      return this.dataForView.from;
    }
  }

  get to() {
    if (this.create && this.dataForGive.transaction) {
      return this.dataForGive.transaction.to.user;
    } else {
      return this.dataForView.to;
    }
  }

  /**
   * Saves or edits the current feedback
   */
  save() {
    const value = this.form.value;
    const request: Observable<string | void> = this.dataForGive ?
      this.feedbackService.givePaymentFeedback({ body: value, key: this.id ? this.id : this.transactionId }) :
      this.feedbackService.updatePaymentFeedback({ key: this.id, body: value });
    this.addSub(request.subscribe(() => {
      this.notification.snackBar(this.i18n.feedback.feedbackSet);
      history.back();
    }));
  }

  resolveMenu() {
    return this.dataForGive ? Menu.FEEDBACKS :
      this.menu.userMenu(this.dataForView.from, Menu.FEEDBACKS);
  }

}
