import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from "@angular/router";
import { LoginService } from "app/core/login.service";

/**
 * Displays the home page
 */
@Component({
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
    if (!loginService.user) {
      this.router.navigateByUrl('login');
    }
  }

  ngOnInit() { }
}