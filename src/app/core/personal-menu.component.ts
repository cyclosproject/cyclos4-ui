import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';

/**
 * A popup menu shown when clicking the personal icon on top
 */
@Component({
  selector: 'personal-menu',
  templateUrl: 'personal-menu.component.html',
  styleUrls: ['personal-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalMenuComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  private authSubscription: Subscription;

  ngOnInit() {
    super.ngOnInit();
    this.authSubscription = this.login.subscribeForAuth(() => this.detectChanges());
    document.body.addEventListener("click", e => this.hide(), false);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  protected onMediaChange() {
    this.hide();
  }

  @ViewChild("container")
  container: ElementRef;

  get user(): User {
    return this.login.user;
  }

  get auth(): Auth {
    return this.login.auth;
  }

  toggle(a: HTMLElement) {
    if (this.container) {
      let style = this.container.nativeElement.style as CSSStyleDeclaration;
      if (style.display == 'none') {
        // Show
        style.visibility = 'hidden';
        style.opacity = '0';
        style.display = '';
        style.top = (a.offsetTop + a.offsetHeight + 8) + 'px';
        if (this.layout.xs) {
          style.left = "0";
        } else {
          let el = this.container.nativeElement as HTMLElement;
          style.left = (a.offsetLeft + a.offsetWidth - el.offsetWidth) + 'px';
        }
        style.visibility = 'visible';
        style.opacity = '1';
      } else {
        // Hide
        this.hide();
      }
    }
  }

  hide() {
    let style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.opacity = '0';
    setTimeout(() => style.display = 'none', 500);
  }

}