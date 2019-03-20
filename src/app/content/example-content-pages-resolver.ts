import { ContentPage } from 'app/content/content-page';
import { ContentPagesResolver } from 'app/content/content-pages-resolver';
import { RootMenu } from 'app/shared/menu';

const CONTENT = `
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed quis vulputate erat, quis euismod felis. Nam ut ex nisl.
Phasellus sed odio fringilla, aliquam sem id, consequat velit.
Sed elit urna, pharetra non magna quis, porttitor finibus ipsum.
Integer vitae ligula sapien. In nec consectetur leo, ut rhoncus ligula.
Fusce metus dolor, sollicitudin a porta pulvinar, ornare eu felis.
Vestibulum porta nisl at eleifend hendrerit. Ut eget dictum libero,
sit amet sollicitudin leo. Praesent tincidunt vel turpis eu placerat.
Integer felis est, dapibus in interdum in, elementum posuere nisi.
Duis accumsan facilisis ante, a facilisis nisl tincidunt ut. Sed nec
egestas nulla, scelerisque rutrum nulla. Duis scelerisque posuere odio,
ut ullamcorper nunc efficitur at. Aliquam et lobortis sem.</p>
<p>Vivamus sit amet purus a lorem imperdiet tempor ac a nibh. Donec in
ante nisl. Cras bibendum consectetur nunc et gravida. Duis tempor sapien
sit amet enim aliquet, vel bibendum quam cursus. Vestibulum a imperdiet
ante, vel convallis diam. Suspendisse sagittis sollicitudin bibendum.
Maecenas feugiat pretium purus sit amet semper.</p>
<p>Mauris interdum ac libero quis aliquet. Sed suscipit leo in felis dictum blandit.
Integer non turpis elementum, interdum quam ut, laoreet ligula.
Etiam dictum dolor vitae nunc aliquet semper. Class aptent taciti sociosqu ad
litora torquent per conubia nostra, per inceptos himenaeos.
Phasellus semper augue lectus, eget tempor magna pretium ac.
Maecenas sed magna elit. Aliquam id fermentum nunc.
Etiam et purus vel nunc dictum accumsan. Vestibulum ultricies auctor accumsan.
Mauris eu libero nec ligula lacinia tempor id vel arcu. Cras in quam turpis.
Ut fringilla a sem quis faucibus. Suspendisse sapien velit, dapibus sed maximus in,
consectetur at risus. Ut commodo cursus purus at consequat. Mauris ut semper lacus.</p>
<p>Curabitur nisi lorem, lobortis non tristique in, scelerisque eu libero.
Proin non quam non magna rhoncus convallis.
Quisque pharetra urna libero, faucibus finibus mauris consequat sit amet.
Morbi venenatis lectus velit, sed vehicula justo euismod ac.
Sed bibendum, nibh quis luctus mollis, erat tellus pellentesque sem, ut vulputate
lacus mi eget elit. Phasellus at ultricies enim.
Donec rutrum lacus quis nunc pellentesque dictum.
Integer suscipit interdum placerat.
Vivamus sollicitudin posuere libero et molestie.</p>
`;

/**
 * Example for a content pages resolver
 */
export class ExampleContentPagesResolver implements ContentPagesResolver {

  /**
   * Returns the application content pages
   */
  contentPages(): ContentPage[] {
    return [
      {
        slug: 'help',
        title: 'General help',
        content: CONTENT
      },
      {
        slug: 'both-card',
        layout: 'card',
        label: 'Both logged / guests, card',
        content: CONTENT
      },
      {
        slug: 'guest-full',
        loggedUsers: false,
        label: 'Guests-only, full',
        content: CONTENT
      },
      {
        rootMenu: RootMenu.BANKING,
        slug: 'banking-help',
        title: 'Banking help',
        content: CONTENT
      },
      {
        rootMenu: RootMenu.MARKETPLACE,
        slug: 'marketplace/help',
        title: 'Marketplace help',
        content: CONTENT
      },
      {
        rootMenu: RootMenu.PERSONAL,
        slug: 'personal help',
        title: 'Personal help',
        content: CONTENT
      }
    ];
  }

}
