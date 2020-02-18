import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdQuestion, QueryFilters, AdKind, AdQuestionResult } from 'app/api/models';
import { AdQuestionsService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable } from 'rxjs';
import { Menu } from 'app/shared/menu';

type AdQuestionQueryFilters = QueryFilters & {
  user: string,
  adKind?: AdKind
};

/**
 * Search unanswered questions from simple/webshop ads
 */
@Component({
  selector: 'search-unanswered-questions',
  templateUrl: 'search-unanswered-questions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUnansweredQuestionsComponent
  extends BaseSearchPageComponent<any, AdQuestionQueryFilters, AdQuestionResult>
  implements OnInit {

  simpleQuestions: boolean;
  webshopQuestions: boolean;

  constructor(
    injector: Injector,
    private adQuestionService: AdQuestionsService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const auth = this.dataForUiHolder.auth || {};
    const permissions = auth.permissions || {};
    const marketplace = permissions.marketplace || {};
    const webshop = marketplace.myWebshop || {};
    this.simpleQuestions = marketplace.questions;
    this.webshopQuestions = webshop.manage;


    // Update the data with any non-null value, so the search page is properly initialized
    this.data = {};
  }

  protected getFormControlNames(): string[] {
    return ['kind'];
  }

  path(row: AdQuestion) {
    return ['/marketplace', 'unanswered-questions', 'view', row.id];
  }

  get toLink() {
    return (row: AdQuestion) => this.path(row);
  }

  navigate(question: AdQuestion) {
    this.router.navigate(this.path(question));
  }

  navigateToAd(value: AdQuestionResult) {
    this.router.navigate(['/marketplace', 'view', value.advertisement.id]);
  }

  /**
  * Removes the given question and reload results
  */
  remove(question: AdQuestion) {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => {
        this.addSub(this.adQuestionService.deleteAdQuestion({ id: question.id })
          .subscribe(() => {
            this.notification.snackBar(this.i18n.general.removeItemDone);
            this.reload();
          }));
      }
    });
  }

  getInitialFormValue(data: AdQuestionQueryFilters) {
    const value = super.getInitialFormValue(data);
    // Use a default value based on user permissions
    if (this.simpleQuestions) {
      value.kind = AdKind.SIMPLE;
    } else if (this.webshopQuestions) {
      value.kind = AdKind.WEBSHOP;
    }
    return value;
  }

  protected toSearchParams(value: any): AdQuestionQueryFilters {
    value.user = 'self';
    return value;
  }

  protected doSearch(value: AdQuestionQueryFilters): Observable<HttpResponse<AdQuestion[]>> {
    return this.adQuestionService.searchUnansweredAdQuestions$Response(value);
  }

  resolveMenu() {
    return Menu.UNANSWERED_QUESTIONS;
  }
}
