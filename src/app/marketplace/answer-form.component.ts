import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdQuestionView } from 'app/api/models';
import { AdQuestionsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';

/**
 * Answer a question for simple/webshop ads
 */
@Component({
  selector: 'answer-form',
  templateUrl: 'answer-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerFormComponent
  extends BasePageComponent<AdQuestionView>
  implements OnInit {

  id: string;
  answer = new FormControl(null, Validators.required);

  constructor(
    injector: Injector,
    private adQuestionService: AdQuestionsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.adQuestionService.getAdQuestion({ id: this.id }).subscribe(data =>
      this.data = data,
    ));
  }

  submit() {
    validateBeforeSubmit(this.answer);
    if (!this.answer.valid) {
      return;
    }
    this.addSub(this.adQuestionService.answerAdQuestion({
      id: this.id,
      body: this.answer.value,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.ad.questionAnswered);
      this.router.navigate(['/marketplace', 'unanswered-questions'], {
        replaceUrl: true,
      });
    }));
  }

  resolveMenu() {
    return Menu.UNANSWERED_QUESTIONS;
  }
}
