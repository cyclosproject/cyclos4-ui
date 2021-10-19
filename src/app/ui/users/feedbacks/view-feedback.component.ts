import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { PaymentFeedbackView, CustomFieldTypeEnum } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ReferenceHelperService } from 'app/ui/users/references/reference-helper.service';
import { PaymentFeedbacksService } from 'app/api/services/payment-feedbacks.service';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays a payment feedback details
 */
@Component({
  selector: 'view-feedback',
  templateUrl: 'view-feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewFeedbackComponent extends BaseViewPageComponent<PaymentFeedbackView> implements OnInit {
  constructor(
    injector: Injector,
    private feedbackService: PaymentFeedbacksService,
    public referenceHelper: ReferenceHelperService) {
    super(injector);
  }

  id: string;
  self: boolean;
  deadline$ = new BehaviorSubject<string>(null);

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.feedbackService.viewPaymentFeedback({ key: this.id }).subscribe(data =>
      this.data = data));
  }

  onDataInitialized(data: PaymentFeedbackView) {

    this.self = this.authHelper.isSelfOrOwner(data.from) ||
      this.authHelper.isSelfOrOwner(data.to);

    const actions = [];
    if (data.canEdit || data.canGive) {
      actions.push(
        new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () =>
          this.router.navigate(['/users', 'feedbacks', 'edit', this.id]), true,
        ));
      if (data.canEdit) {
        actions.push(
          new HeadingAction(SvgIcon.Trash, this.i18n.general.remove, () =>
            this.confirmation.confirm({
              message: this.i18n.feedback.removeConfirm,
              callback: () => this.doRemove(data.id),
            })
          ));
      }
      if (data.canGive) {
        this.addSub(this.feedbackService.getPaymentFeedbacksDataForGive({ key: this.id, fields: ['deadline'] }).subscribe(giveData => {
          const date = this.format.formatAsDateTime(giveData.deadline);
          this.deadline = data.comments ?
            this.i18n.feedback.daysToChangeFeedbackComment(date) :
            this.i18n.feedback.daysToGiveFeedbackComment(date);
        }));
      }
    }
    if (data.canReply) {
      actions.push(
        new HeadingAction(SvgIcon.Reply, this.i18n.feedback.reply, () => this.reply(data.id)));
      this.addSub(this.feedbackService.getPaymentFeedbacksDataForReply({ key: this.id, fields: ['deadline'] }).subscribe(replyData => {
        const date = this.format.formatAsDateTime(replyData.deadline);
        this.deadline = date ?
          this.i18n.feedback.daysToReplyFeedbackComment(date) :
          this.i18n.feedback.daysToReplyFeedbackCommentUnlimited;
      }));
    }
    this.headingActions = actions;
  }

  /**
   * Replies the payment feedback with a comment
   */
  protected reply(id: string) {
    const fields = [];
    fields.push({
      internalName: 'replyComments',
      name: this.i18n.feedback.reply,
      type: CustomFieldTypeEnum.TEXT,
    });

    this.confirmation.confirm({
      title: this.i18n.feedback.sellerReply,
      labelPosition: 'above',
      customFields: fields,
      callback: res => {
        this.addSub(this.feedbackService.replyPaymentFeedback({
          key: id,
          body: res.customValues.replyComments,
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.feedback.feedbackReplied);
          this.reload();
        }));
      },
    });
  }


  /**
   * Removes this feedback and goes to list page
   */
  protected doRemove(id: string) {
    this.addSub(this.feedbackService.removePaymentFeedback({ key: id }).subscribe(() => {
      this.notification.snackBar(this.i18n.feedback.removeDone);
      history.back();
    }));
  }

  get deadline() {
    return this.deadline$.value;
  }

  set deadline(value: string) {
    this.deadline$.next(value);
  }

  resolveMenu() {
    return this.self ? Menu.FEEDBACKS : this.menu.searchUsersMenu();
  }

}
