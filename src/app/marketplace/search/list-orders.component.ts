import { ChangeDetectionStrategy } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';

@Component({
  selector: 'list-orders',
  templateUrl: 'list-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOrdersComponent
  extends BaseSearchPageComponent<UserAdsDataForSearch, UserAdsQueryFilters, AdResult>
  implements OnInit {

}