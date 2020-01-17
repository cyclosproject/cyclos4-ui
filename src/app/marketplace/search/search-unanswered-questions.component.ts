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

  constructor(
    injector: Injector,
    private adQuestionService: AdQuestionsService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Update the data with any non-null value, so the search page is properly initialized
    this.data = {};
  }

  protected getFormControlNames(): string[] {
    return [];
  }

  path(row: AdQuestion): string[] {
    return ['/marketplace', 'unanswered-questions', 'answer', row.id];
  }

  get toLink() {
    return (row: AdQuestion) => this.path(row);
  }

  navigate(item: AdQuestion) {
    this.router.navigate(this.path(item));
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
