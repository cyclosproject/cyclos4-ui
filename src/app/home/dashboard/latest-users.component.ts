import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { AdAddressResultEnum, UserOrderByEnum, UserResult } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';
import { Menu } from 'app/shared/menu';

/**
 * Displays the latest users
 */
@Component({
  selector: 'latest-users',
  templateUrl: 'latest-users.component.html',
  // As this component looks A LOT to latest ads, use its same stylesheet
  styleUrls: ['latest-ads.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestUsersComponent extends BaseDashboardComponent implements OnInit {

  @Input() groups: string[];
  @Input() max: number;

  users$ = new BehaviorSubject<UserResult[]>(null);

  constructor(injector: Injector,
    private usersService: UsersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.usersService.searchUsers({
      addressResult: AdAddressResultEnum.NONE,
      groups: this.groups,
      ignoreProfileFieldsInList: true,
      orderBy: UserOrderByEnum.CREATION_DATE,
      profileFields: ['image:true'],
      fields: ['id', 'display', 'image'],
      pageSize: this.max
    }).subscribe(ads => {
      this.users$.next(ads);
    }));
  }

  path(user: UserResult): string[] {
    return ['/users', 'profile', user.id];
  }

  navigate(user: UserResult, event: MouseEvent) {
    this.menu.setActiveMenu(Menu.SEARCH_USERS);
    this.router.navigate(this.path(user));
    event.preventDefault();
    event.stopPropagation();
    this.breadcrumb.clear();
    this.stateManager.clear();
  }
}
