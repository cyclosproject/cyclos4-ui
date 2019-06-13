import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { SessionResult, SessionDataForSearch, SessionQueryFilters, RoleEnum } from 'app/api/models';
import { SessionsService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
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
  implements OnInit {

  constructor(
    injector: Injector,
    private sessionsService: SessionsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Get search data
    this.addSub(this.sessionsService.getSessionDataForSearch().subscribe(data => {
      // Patch value to avoid the form reload twice
      this.form.patchValue(data.query, { emitEvent: false });
      this.data = data;
    }));
  }

  protected toSearchParams(value: any): SessionQueryFilters {
    return value;
  }

  protected disconnect(session: SessionResult) {
    this.addSub(this.sessionsService.disconnectSession({ sessionToken: session.sessionToken })
      .subscribe(() => this.update()));
  }

  protected isCurrentSession(session: SessionResult) {
    return this.login.auth.sessionToken === session.sessionToken;
  }

  protected get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  protected getFormControlNames(): string[] {
    return ['channels', 'roles', 'user'];
  }

  protected doSearch(value: SessionQueryFilters): Observable<HttpResponse<SessionResult[]>> {
    return this.sessionsService.searchSessions$Response(value);
  }

  protected showConnectedLabel(role: RoleEnum) {
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

}
