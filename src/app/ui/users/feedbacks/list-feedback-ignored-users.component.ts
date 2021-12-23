import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { User } from 'app/api/models';
import { PaymentFeedbacksService } from 'app/api/services/payment-feedbacks.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { PickUserDialogComponent } from 'app/ui/users/search/pick-user-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * A page which allows to add or remove users from give optional feedback when doing a payment
 */
@Component({
  selector: 'list-feedback-ignored-users',
  templateUrl: 'list-feedback-ignored-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListFeedbackIgnoredUsersComponent
  extends BasePageComponent<User[]>
  implements OnInit {

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private feedbackService: PaymentFeedbacksService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.addSub(this.feedbackService.listPaymentFeedbackIgnoredUsers({ user: this.ApiHelper.SELF }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized() {
    this.headingActions = [
      new HeadingAction(SvgIcon.PlusCircle, this.i18n.feedback.addUserToIgnoreList, () => this.add(), true),
    ];
  }

  /**
   * Remove an ignored user from give payment feedback
   */
  remove(user: User) {
    this.confirmation.confirm({
      message: this.i18n.general.removeConfirm(user.display),
      callback: () => {
        this.addSub(this.feedbackService.removePaymentFeedbackIgnoredUser({ ignored: user.id, user: this.ApiHelper.SELF })
          .subscribe(() => {
            this.notification.snackBar(this.i18n.feedback.removeUser(user.display));
            this.reload();
          }));
      },
    });
  }

  /**
   * Adds a user as ignored from give payment feedback
   */
  private add() {
    const ref = this.modal.show(PickUserDialogComponent, {
      class: 'modal-form',
      initialState: {
        excludeContacts: false,
        title: this.i18n.feedback.addUserToIgnoreList,
        label: this.i18n.general.user
      }
    });
    const component = ref.content as PickUserDialogComponent;
    this.addSub(component.done.subscribe(user => {
      this.addSub(this.feedbackService.addPaymentFeedbackIgnoredUser({
        user: this.ApiHelper.SELF,
        body: user.id,
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.feedback.addIgnoredUserDone(user.display));
        this.reload();
      }));
    }));
  }

  resolveMenu() {
    return Menu.FEEDBACKS;
  }
}
