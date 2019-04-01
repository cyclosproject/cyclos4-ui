import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { UserAddressResultEnum, UserOrderByEnum, UserResult } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';
import { Menu, ActiveMenu } from 'app/shared/menu';

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
      addressResult: UserAddressResultEnum.NONE,
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

  path(user: UserResult): string {
    return `/users/profile/${user.id}`;
  }

  navigate(user: UserResult, event: MouseEvent) {
    this.menu.navigate({
      url: this.path(user),
      menu: new ActiveMenu(Menu.USER_PROFILE),
      clear: false,
      event: event
    });
  }
}
