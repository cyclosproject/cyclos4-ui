import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { CaptchaInput, CaptchaProviderEnum } from 'app/api/models';

/**
 * Helper service for using captcha
 */
@Injectable({
  providedIn: 'root'
})
export class CaptchaHelperService {
  constructor(private formBuilder: FormBuilder) {}
  /**
   * Returns whether the given captcha provider uses the challenge field
   */
  captchaUsesChallenge(input: CaptchaProviderEnum | CaptchaInput) {
    if (typeof input === 'object') {
      input = input.provider;
    }
    return input === CaptchaProviderEnum.INTERNAL;
  }

  /**
   * Returns a form that has a captcha challenge and response
   */
  captchaFormGroup(captchaInput: CaptchaInput) {
    if (!captchaInput) {
      return null;
    }
    const form = this.formBuilder.group({
      response: ['', Validators.required]
    });
    if (this.captchaUsesChallenge(captchaInput)) {
      form.addControl('challenge', new FormControl('', Validators.required));
    }
    return form;
  }
}
