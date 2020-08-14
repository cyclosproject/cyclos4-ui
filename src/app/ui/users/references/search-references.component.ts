import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  ReferenceDirectionEnum,
  ReferenceLevelEnum, ReferencePeriodStatistics, ReferenceStatistics, UserReferenceDataForSearch,
  UserReferenceQueryFilters, UserReferenceResult
} from 'app/api/models';
import { ReferencesService } from 'app/api/services/references.service';
import { ISO_DATE } from 'app/core/format.service';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ReferenceHelperService } from 'app/ui/users/references/reference-helper.service';
import { BehaviorSubject, Observable } from 'rxjs';

type SearchReferencesParams = UserReferenceQueryFilters & {
  user: string
};

/**
 * Searches the references given / received of a given user
 */
@Component({
  selector: 'search-references',
  templateUrl: 'search-references.component.html',
  styleUrls: ['search-references.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchReferencesComponent
  extends BaseSearchPageComponent<UserReferenceDataForSearch, UserReferenceQueryFilters, UserReferenceResult>
  implements OnInit {

  ReferenceDirectionEnum = ReferenceDirectionEnum;
  ReferenceLevelEnum = ReferenceLevelEnum;

  param: string;
  isOwner: boolean;
  allTime: ReferencePeriodStatistics;
  last30Days: ReferencePeriodStatistics;

  levels: any[];

  stats$ = new BehaviorSubject<ReferenceStatistics>(null);

  constructor(
    injector: Injector,
    public referenceHelper: ReferenceHelperService,
    private referencesService: ReferencesService
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
    this.addSub(this.referencesService.getUserReferencesDataForSearch({ user: this.param }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserReferenceDataForSearch) {
    super.onDataInitialized(data);

    if (data.set && !this.isOwner) {
      this.headingActions = [
        new HeadingAction('military_tech', this.i18n.reference.set,
          () => {
            if (data.current) {
              this.router.navigate(['users', 'references', 'edit', data.current.id]);
            } else {
              this.router.navigate(['users', 'references', 'set', 'self', this.param]);
            }
          }, true)];
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
    this.addSub(this.referencesService.getUserReferenceStatistics({ user: this.param, direction: this.form.controls.direction.value })
      .subscribe(stats => this.stats = stats));
  }

  protected toSearchParams(value: any): SearchReferencesParams {
    value.user = this.param;
    return value;
  }

  doSearch(filters: SearchReferencesParams): Observable<HttpResponse<UserReferenceResult[]>> {
    return this.referencesService.searchUserReferences$Response(filters);
  }

  filter(level?: ReferenceLevelEnum, allTime?: boolean) {
    this.form.patchValue({
      levels: level ? [level] : null,
      period: allTime ? null : [this.dataForUiHolder.now().clone().subtract(30, 'day').startOf('day').format(ISO_DATE), null]
    });
  }

  /**
   * Resolves the route to reference details page
   */
  get toLink() {
    return (row: UserReferenceResult) => this.path(row);
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
   * Removes the given reference
   */
  remove(row: UserReferenceResult) {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => {
        this.addSub(this.referencesService.deleteReference({ id: row.id }).subscribe(() => {
          this.notification.snackBar(this.i18n.general.removeItemDone);
          this.reload();
        }));
      },
    });
  }

  path(row: UserReferenceResult): string[] {
    return ['/users', 'references', 'view', row.id];
  }

  resolveMenu(data: UserReferenceDataForSearch) {
    return this.isOwner ? Menu.REFERENCES : this.menu.searchUsersMenu(data.user);
  }

}
