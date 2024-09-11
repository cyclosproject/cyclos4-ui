import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RoleEnum, SessionDataForSearch, SessionQueryFilters, SessionResult } from 'app/api/models';
import { SessionsService } from 'app/api/services/sessions.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * Displays a search for connected users
 */
@Component({
  selector: 'search-connected',
  templateUrl: 'search-connected.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchConnectedComponent
  extends BaseSearchPageComponent<SessionDataForSearch, SessionQueryFilters, SessionResult>
  implements OnInit
{
  constructor(injector: Injector, private sessionsService: SessionsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.sessionsService.getSessionDataForSearch().subscribe(data => (this.data = data)));
  }

  protected toSearchParams(value: any): SessionQueryFilters {
    return value;
  }

  public disconnect(session: SessionResult) {
    this.addSub(
      this.sessionsService.disconnectSession({ sessionToken: session.sessionToken }).subscribe(() => {
        this.notification.snackBar(this.i18n.connectedUser.disconnected(session.user.display));
        this.update();
      })
    );
  }

  public canDisconnect(session: SessionResult) {
    return this.login.auth.permissions.sessions.disconnect && this.login.auth.sessionToken !== session.sessionToken;
  }

  public get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  protected getFormControlNames(): string[] {
    return ['channels', 'roles', 'user'];
  }

  protected doSearch(value: SessionQueryFilters): Observable<HttpResponse<SessionResult[]>> {
    return this.sessionsService.searchSessions$Response(value);
  }

  public showConnectedLabel(role: RoleEnum) {
    switch (role) {
      case RoleEnum.ADMINISTRATOR:
        return this.i18n.connectedUser.viewConnected.admin;
      case RoleEnum.BROKER:
        return this.i18n.connectedUser.viewConnected.broker;
      case RoleEnum.MEMBER:
        return this.i18n.connectedUser.viewConnected.member;
      case RoleEnum.OPERATOR:
        return this.i18n.connectedUser.viewConnected.operator;
    }
  }

  resolveMenu() {
    return this.dataForFrontendHolder.role === RoleEnum.BROKER ? Menu.BROKER_CONNECTED_USERS : Menu.CONNECTED_USERS;
  }
}
