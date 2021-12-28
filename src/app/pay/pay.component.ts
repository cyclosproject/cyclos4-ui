import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { setRootSpinnerVisible } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';
import { DataForFrontend } from 'app/api/models';

@Component({
  selector: 'pay-root',
  templateUrl: './pay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayComponent implements OnInit {

  title: string;
  dataForFrontend = new BehaviorSubject<DataForFrontend>(null);

  constructor(
    public dataForFrontendHolder: DataForFrontendHolder,
    apiConfiguration: ApiConfiguration
  ) {
    apiConfiguration.rootUrl = 'http://localhost:8888/api';
  }

  ngOnInit() {
    this.title = 'Pay!!!';
    self['cyclosLoaded'] = true;
    setRootSpinnerVisible(false);
    this.dataForFrontendHolder.initialize().subscribe(d => this.dataForFrontend.next(d));
  }
}
