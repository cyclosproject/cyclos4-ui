import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerFormComponent
  extends BasePageComponent<AdQuestionView>
  implements OnInit {

  id: string;
  form: FormGroup;

  constructor(
    injector: Injector,
    private adQuestionService: AdQuestionsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.adQuestionService.getAdQuestion({ id: this.id }).subscribe(data =>
      this.data = data
    ));
  }

  onDataInitialized() {
    this.form = this.formBuilder.group({
      answer: null
    });
  }

  submit() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    this.addSub(this.adQuestionService.answerAdQuestion({
      id: this.id,
      body: this.form.value
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.ad.questionAnswered);
      history.back();
    }));
  }

  resolveMenu() {
    return Menu.UNANSWERED_QUESTIONS;
  }
}
