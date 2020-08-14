import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { setRootSpinnerVisible } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';
import { DataForUi } from 'app/api/models';

@Component({
  selector: 'pay-root',
  templateUrl: './pay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayComponent implements OnInit {

  title: string;
  dataForUi = new BehaviorSubject<DataForUi>(null);

  constructor(
    public dataForUiHolder: DataForUiHolder,
    apiConfiguration: ApiConfiguration
  ) {
    apiConfiguration.rootUrl = 'http://localhost:8888/api';
  }

  ngOnInit() {
    this.title = 'Pay!!!';
    self['cyclosLoaded'] = true;
    setRootSpinnerVisible(false);
    this.dataForUiHolder.initialize().subscribe(d => this.dataForUi.next(d));
  }
}
