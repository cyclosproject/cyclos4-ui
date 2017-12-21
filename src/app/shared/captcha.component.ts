import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { CaptchaService } from 'app/api/services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FormGroup } from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: './captcha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptchaComponent implements OnInit {
  constructor(private captchaService: CaptchaService) { }

  @Input() group: string;

  /**
   * The form must have 2 defined fields: challenge and response,
   * just like the one returned by {@link ApiHelper.captchaFormGroup}
   */
  @Input() form: FormGroup;

  imageUrl = new BehaviorSubject<string>(null);

  ngOnInit() {
    this.newCaptcha();
  }

  newCaptcha() {
    this.captchaService.newCaptchaResponse(this.group)
      .subscribe(response => {
        const url = response.headers.get('Location');
        this.form.patchValue({
          challenge: response.body,
          response: ''
        });
        this.imageUrl.next(url);
      });
  }
}
