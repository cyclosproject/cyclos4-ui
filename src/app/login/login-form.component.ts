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
  styleUrls: ['login-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent implements OnInit {

  @Input()
  dataForLogin: DataForLogin;

  @Input()
  data: LoginData = new LoginData();

  @Input()
  showActions: boolean;

  @Output()
  onSubmit: EventEmitter<LoginData>;

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
    this.onSubmit.emit(new LoginData(this.data.principal, this.data.password));
  }

  get valid(): boolean {
    return this.data && this.data.valid;
  }
}