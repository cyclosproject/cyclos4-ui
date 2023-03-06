import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForUserQuickAccess, QuickAccessTypeEnum, UserQuickAccessEdit, UserQuickAccessView } from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { IconAndLabel, QuickAccessHelperService } from 'app/ui/core/quick-access-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

export interface QuickAccessItem extends IconAndLabel {
  type: QuickAccessTypeEnum;
  entity?: string;
  enabled: boolean;
  originalOrder: number;
}

/**
 * Allows customizing the quick access items of a given user
 */
@Component({
  selector: 'quick-access-settings',
  templateUrl: 'quick-access-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAccessSettingsComponent
  extends BasePageComponent<DataForUserQuickAccess>
  implements OnInit {

  param: string;
  self: boolean;
  enabledItems: QuickAccessItem[];
  disabledItems: QuickAccessItem[];
  private allItems$ = new Subject<UserQuickAccessEdit[]>();

  constructor(
    injector: Injector,
    private frontendService: FrontendService,
    private quickAccessHelper: QuickAccessHelperService,
    private iconLoadingService: IconLoadingService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;

    this.addSub(this.frontendService.getDataForUserQuickAccess({ user: this.param })
      // Before setting the data, fetch possibly missing icons for the quick access
      .pipe(switchMap(data => this.loadIcons(data)))
      .subscribe(data => this.data = data));
  }

  private loadIcons(data: DataForUserQuickAccess) {
    const icons = data.quickAccess?.map(qa => this.quickAccessHelper.iconAndLabel(qa).icon).filter(i => !!i);
    if (icons.length === 0) {
      return of(data);
    } else {
      return this.iconLoadingService.load(icons, false).pipe(switchMap(() => of(data)));
    }
  }

  onDataInitialized(data: DataForUserQuickAccess) {
    const toItem = (qa: UserQuickAccessView) => ({
      ...this.quickAccessHelper.iconAndLabel(qa),
      type: qa.type,
      entity: qa.operation?.id ?? qa.wizard?.id ?? qa.recordType?.id ?? qa.tokenType?.id,
      enabled: !!qa.enabled,
      originalOrder: qa.originalOrder
    } as QuickAccessItem);
    this.self = this.authHelper.isSelf(data.user);
    this.enabledItems = data.quickAccess.filter(qa => qa.enabled).map(toItem);
    this.disabledItems = data.quickAccess.filter(qa => !qa.enabled).map(toItem);
    this.sortDisabled();
    if (data.canEdit) {
      this.addSub(this.allItems$.pipe(debounceTime(1_000)).subscribe(items => this.save(items)));
      this.headingActions = [new HeadingAction(SvgIcon.ArrowClockwise, this.i18n.quickAccessSettings.restoreDefaults,
        () => this.restoreDefaults())];
    }
  }

  enableItem(i: number) {
    if (this.data.canEdit) {
      const item = this.disabledItems[i];
      item.enabled = true;
      this.disabledItems = this.disabledItems.filter(i => i !== item);
      this.enabledItems = [item, ...this.enabledItems];
      this.updateItems();
    }
  }

  disableItem(i: number) {
    if (this.data.canEdit) {
      const item = this.enabledItems[i];
      item.enabled = false;
      this.enabledItems = this.enabledItems.filter(i => i !== item);
      this.disabledItems = [item, ...this.disabledItems];
      this.sortDisabled();
      this.updateItems();
    }
  }

  resolveMenu() {
    return this.menu.userMenu(this.data?.user, Menu.QUICK_ACCESS_SETTINGS);
  }

  sort(event: CdkDragSortEvent<QuickAccessItem[]>) {
    moveItemInArray(this.enabledItems, event.previousIndex, event.currentIndex);
    this.updateItems();
  }

  restoreDefaults() {
    this.addSub(this.frontendService.restoreUserQuickAccessDefaults({
      user: this.param
    })
      .subscribe(() => {
        this.notification.snackBar(this.i18n.quickAccessSettings.restoreDefaultsDone);
        this.router.navigateByUrl(this.router.url);
      }));
  }

  private sortDisabled() {
    this.disabledItems.sort((a, b) => a.originalOrder - b.originalOrder);
  }

  private updateItems() {
    this.allItems$.next(this.itemsAsArray());
  }

  private itemsAsArray() {
    return [...this.enabledItems, ...this.disabledItems]
      .map(i => ({ type: i.type, entity: i.entity, enabled: i.enabled }) as UserQuickAccessEdit);
  }


  private save(items: UserQuickAccessEdit[]) {
    this.addSub(this.frontendService.saveUserQuickAccess({
      user: this.param,
      body: {
        quickAccess: items
      }
    }).subscribe());
  }

}
