import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { Router } from "@angular/router";
import { GeneralMessages } from "app/messages/general-messages";
import { LoginService } from "app/core/login.service";
import { LoginData } from "app/login/login-data";
import { DataForLogin } from "app/api/models";

/**
 * Displays the login form
 */
@Component({
  selector: 'login-form',
  templateUrl: 'login-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent implements OnInit {

  @Input()
  public dataForLogin: DataForLogin;

  @Input()
  @Output()
  public data: LoginData = new LoginData();

  @Input()
  public showActions: boolean;

  @Output()
  public onSubmit: EventEmitter<LoginData>;

  constructor(
    public generalMessages: GeneralMessages,
    private loginService: LoginService,
    private router: Router
  ) {
    this.onSubmit = new EventEmitter();
  }

  ngOnInit() {
  }

  /**
   * Emits the current login data
   */
  emit(): void {
    this.onSubmit.emit(this.data);
  }
}