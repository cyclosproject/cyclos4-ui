import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<void> implements OnInit {

  content = new BehaviorSubject('');
  title: string;

  constructor(
    injector: Injector,
    private httpClient: HttpClient) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.title = this.i18n('Home');

    const guest = this.login.user == null;

    // Load the home page content
    const contentFile = guest ? 'guests-home' : 'users-home';
    this.httpClient.get(`content/${contentFile}.html`, {
      responseType: 'text'
    })
      .subscribe(content => {
        this.content.next(content);
      });
  }
}
