import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  PaymentFeedbackDataForSearch, PaymentFeedbackQueryFilters, PaymentFeedbackResult, ReferenceDirectionEnum,
  ReferenceLevelEnum, ReferencePeriodStatistics, ReferenceStatistics
} from 'app/api/models';
import { PaymentFeedbacksService } from 'app/api/services/payment-feedbacks.service';
import { ISO_DATE } from 'app/core/format.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ReferenceHelperService } from 'app/ui/users/references/reference-helper.service';
import { BehaviorSubject, Observable } from 'rxjs';

type SearchPaymentFeedbackParams = PaymentFeedbackQueryFilters & {
  user: string;
};

/**
 * Searches the feedback given / received of a given user
 */
@Component({
  selector: 'search-feedbacks',
  templateUrl: 'search-feedbacks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFeedbackComponent
  extends BaseSearchPageComponent<PaymentFeedbackDataForSearch, PaymentFeedbackQueryFilters, PaymentFeedbackResult>
  implements OnInit {

  ReferenceDirectionEnum = ReferenceDirectionEnum;

  param: string;
  isOwner: boolean;
  allTime: ReferencePeriodStatistics;
  last30Days: ReferencePeriodStatistics;

  levels: any[];

  stats$ = new BehaviorSubject<ReferenceStatistics>(null);

  constructor(
    injector: Injector,
    public referenceHelper: ReferenceHelperService,
    private feedbacksService: PaymentFeedbacksService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['direction', 'levels', 'period'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.paramMap.get('user') || this.ApiHelper.SELF;
    this.isOwner = this.authHelper.isSelf(this.param);
    this.addSub(this.feedbacksService.getPaymentFeedbacksDataForSearch({ user: this.param }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: PaymentFeedbackDataForSearch) {
    super.onDataInitialized(data);

    if (this.isOwner && this.dataForFrontendHolder.auth.permissions.paymentFeedbacks.give) {
      this.headingActions = [
        new HeadingAction(SvgIcon.Clock, this.i18n.feedback.viewAwaitingFeedback,
          () => {
            this.router.navigate(['/users', 'feedbacks', 'search-awaiting']);
          }, true),
        new HeadingAction(SvgIcon.Gear, this.i18n.feedback.settings,
          () => {
            this.router.navigate(['/users', 'feedbacks', 'settings']);
          }, true)
      ];
    }
    this.levels = [
      { level: ReferenceLevelEnum.VERY_GOOD, text: this.i18n.reference.level.veryGood },
      { level: ReferenceLevelEnum.GOOD, text: this.i18n.reference.level.good },
      { level: ReferenceLevelEnum.NEUTRAL, text: this.i18n.reference.level.neutral },
      { level: ReferenceLevelEnum.BAD, text: this.i18n.reference.level.bad },
      { level: ReferenceLevelEnum.VERY_BAD, text: this.i18n.reference.level.veryBad }
    ];
    this.searchStatistics();
    this.addSub(this.form.controls.direction.valueChanges.subscribe(() => this.searchStatistics()));
  }

  searchStatistics() {
    this.addSub(this.feedbacksService.getPaymentFeedbackStatistics({ user: this.param, direction: this.form.controls.direction.value })
      .subscribe(stats => this.stats = stats));
  }

  protected toSearchParams(value: any): SearchPaymentFeedbackParams {
    value.user = this.param;
    return value;
  }

  doSearch(filters: SearchPaymentFeedbackParams): Observable<HttpResponse<PaymentFeedbackResult[]>> {
    return this.feedbacksService.searchPaymentFeedbacks$Response(filters);
  }

  filter(level?: ReferenceLevelEnum, allTime?: boolean) {
    this.form.patchValue({
      levels: level ? [level] : null,
      period: allTime ? null : [this.dataForFrontendHolder.now().clone().subtract(30, 'day').startOf('day').format(ISO_DATE), null]
    });
  }

  /**
   * Resolves the route to payment feedback details page
   */
  get toLink() {
    return (row: PaymentFeedbackResult) => this.path(row);
  }

  get stats() {
    return this.stats$.value;
  }

  set stats(value: ReferenceStatistics) {
    this.stats$.next(value);
    this.allTime = value.periods.filter(p => p.period == null)[0];
    this.last30Days = value.periods.filter(p => p.period != null)[0];
  }

  /**
   * Removes the given feedback
   */
  remove(row: PaymentFeedbackResult) {
    this.confirmation.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => {
        this.addSub(this.feedbacksService.removePaymentFeedback({ key: row.id }).subscribe(() => {
          this.notification.snackBar(this.i18n.general.removeItemDone);
          this.reload();
        }));
      },
    });
  }

  path(row: PaymentFeedbackResult): string[] {
    return ['/users', 'feedbacks', 'view', row.id];
  }

  resolveMenu(data: PaymentFeedbackDataForSearch) {
    return this.isOwner ? Menu.FEEDBACKS : this.menu.searchUsersMenu(data.user);
  }

  resolveHeading(mobile: boolean = false): string {
    const singleDirection = this.data.directions?.length === 1;
    const onlyGiven = singleDirection && this.data.directions?.includes(ReferenceDirectionEnum.GIVEN);
    const onlyReceived = singleDirection && this.data.directions?.includes(ReferenceDirectionEnum.RECEIVED);
    if (onlyGiven) {
      return mobile ? this.i18n.feedback.mobileTitle.searchGiven :
        this.i18n.feedback.title.searchGiven;
    } else if (onlyReceived) {
      return mobile ? this.i18n.feedback.mobileTitle.searchReceived :
        this.i18n.feedback.title.searchReceived;
    } else {
      return mobile ? this.i18n.feedback.mobileTitle.search :
        this.i18n.feedback.title.search;
    }
  }

  get userFilter(): boolean {
    return this.data.user && !this.isOwner;
  }

  get directionsFilter(): boolean {
    return this.data.directions?.length === 2;
  }

}
