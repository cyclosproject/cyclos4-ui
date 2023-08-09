# Cyclos 4 user interface

This is the new frontend for [Cyclos 4](https://www.cyclos.org/).
Starting with Cyclos 4.14, the new frontend is bundled and served by Cyclos itself.

Previously the way to configure the frontend was programmatically. This meant that any
change to a setting in the frontend would require rebuilding the Angular application
and redeploying. Now all the customizations, including themes, translations, pages
and banners are done in the Cyclos application.

## Why keeping this repository in GitHub?

As the new frontend is bundled with Cyclos itself, why still publish it in GitHub?
Well, there are some reasons for that:

- This frontend is a very good example on how to use the Cyclos REST API.
  The codebase is large, as it is a full frontend for Cyclos, convering many modules,
  except system configuration and content management.
  As such, it is expected that most of the common API usage will be covered here;
- The project is still open source, under the MIT License.
  As such, projects that use Cyclos can help improving the frontend;
- Also, by being MIT Licensed, projects can choose to customize some pages.
  Additionally, projects that also connect with other software can create new
  functionality which will be presented to users in a single, concise interface;
- Having the project in GitHub can help us track issues which our customers find
  using the GitHub's issue tracker;
- Some projects that use Cyclos prefer to host a separated frontend, which is the only
  publicly accessible server. Such projects leave the access to the Cyclos server
  restricted to the organization / VPN.

## Versioning scheme

Previously this frontend had its own version. Now, being bundled with Cyclos, it will
have the same version as Cyclos. Examples: 4.14.0, 4.14.1, 4.15.3 and so on.
On each Cyclos release the code on GitHub will be updated and tagged with
the corresponding version.

## Development

This frontend is written in [Angular](https://angular.io/).
It uses [Bootstrap 4](https://getbootstrap.com/) for theming.
In order to modify any file, make sure you are familiar with these technologies.

To modify this frontend, either for contributing fixes or to implement custom
functionality, follow these steps:

1. Clone the git repository on `https://github.com/cyclosproject/cyclos4-ui`;
1. Install NPM dependencies by running `npm install` in the project directory;
1. Set the URL of your Cyclos server in the `proxy.json` file;
1. Start the Angular development by running `npm start` in the project directory;
1. Open your browser on `http://localhost:4200`.

This project relies heavily on code generation. We generate:

- Client classes for the Cyclos REST API, using
  [ng-openapi-gen](https://github.com/cyclosproject/ng-openapi-gen/);
- A TypeScript interface for translation keys,
  using [ng-translation-gen](https://github.com/cyclosproject/ng-translation-gen/).
  The source for it is `src/i18n/i18n.json`;
- A JSON file with the content of each SVG icon we use.
  Most icons are from [Bootstrap](https://icons.getbootstrap.com/).
  However, there are some custom icons as well.

If any of these is modified, you need to re-generate the corresponding code with
the command `npm run generate`.

## Updating the frontend version served by Cyclos with your customized one

Important: Make sure you checkout the exact tag version in GitHub as the
Cyclos server version. For example, if the server runs `4.16.3`,
checkout the tag `4.16.3`.

Then apply all customizations to that version, and build with the `npm run build`.
You will have the `dist/ui` folder generated with the code that should be served.
However, Cyclos pre-process the `src/ui/index.html` file to include server-side data on it.

So, to copy the files to the correct place and have the HTML processed,
supposing you have the Cyclos package you have downloaded extracted to the directory
under `$CYCLOS_ROOT`:

```bash
$ cd $CYCLOS_ROOT/cyclos-x.y.z # replace with the correct version
$ cd cyclos-ui-github
$ ./gradlew copyUi -Dui.dist=/path/to/your/customized/dist/ui
```

After running this command, the Cyclos web directory will be updated to include your
customized frontend. The content of the web directory can then be deployed to the
application server (such as Tomcat) as usual.

## Translations

### Custom translations
No new translation keys can be customized through Cyclos, only the existing ones for the release being customized.
In case the frontend  is served by Cyclos you should use the translated value directly in the code, otherwise, if the
frontend will be hosted separatedly from Cyclos, you could add the new keys to src/i18n/i18n.json and use the
TypeScript interface generated using ng-translation-gen.

To add a new language locally, simply add the locale to the locales array in ng-translation-gen.json. Then, to create
the file with defaults, or update it with new translation keys, run npm run merge-translations. Finally, either
reference it as a static translation, or, if the locale matches the language set in Cyclos, it will be automatically used.

### Contributing translations

If you wish to contribute to the translations, not only for this frontend, but to
Cyclos in general, please, request access on
[https://crowdin.com/project/cyclos/](https://crowdin.com/project/cyclos/)
and help us making Cyclos translated in more languages, as well as reviewing and
extending existing translations.

## Hosting the frontend separatedly from Cyclos

Some projects prefer to host the frontend separated from Cyclos. In such configuration,
the Cyclos backend can be hidden from the public Internet.

To do so, you will have to compile the frontend in standalone mode, and then be
deployed in a separated server. Please, consider each of the following points:

### Set the frontend to standalone mode
The files `src/environments/environment.ts` and `src/environments/environment.prod.ts`
contain environment variables used in development mode and production mode, respectively.
To host the frontend as standalone, edit the `src/environments/environment.prod.ts`
and set `"standalone": true`.

Also you need to decide whether the frontend will access the backend API via proxy
or CORS. Here is an explanation of each of them:

- Proxy: In this setup, the browser application will perform requests to the same
  origin that is hosting the frontend. The server that serves the compiled frontend
  HTML / scripts / styles (e.g. Apache) will need to proxy calls to the API path
  (generally `/api`) to the backend server. This requires a little bit more
  configuration on the server, but doesn't require the CORS preflight request.
  You need also to set the Public API URL setting in Cyclos' configuration.
- CORS: In this setup, the browser will perform requests to the backend directly.
  As they are not in the same domain, the browser needs to perform the CORS preflight
  request: is a request with method `OPTIONS` that will ask the backend server if the
  request is allowed. If so, the actual request is performed. This will increase the
  latency on every request. Also it requires the Cyclos backend server to allow CORS.

More detail for each option is given below.

### Setup the server-side proxy for /api

This section applies the frontend will use proxy for the API.
In Apache, this can be done via:

```apache
<IfModule mod_proxy.c>
  ProxyPass "/api" "http://localhost:8080/cyclos/api" keepalive=On connectiontimeout=10 timeout=60
  ProxyPassReverse "/api" "http://localhost:8080/cyclos/api"
  ProxyPassReverseCookiePath "/cyclos/" "/"
</IfModule>
```

On nginx, this can be configured with:

```nginx
location /api {
  proxy_pass http://localhost:8080/cyclos/api/;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

You should also set the 'Public API URL' setting in the Cyclos configuration,
in 'System > System configuration > Configurations'.
For example: suppose your frontend is hosted on `https://instance.com`, while
the Cyclos backend is hosted on `https://backend.instance.com`. The backend might not
even be publicly accessible in the Internet. In such system, each URL returned by
Cyclos in API requests should use `https://instance.com/api` as 'Public API URL'.

### Setup the the API URL and CORS

If the frontend will use CORS, requesting the backend directly.

First, in `src/environments/environment.prod.ts`, set `apiUrl` to the fully-qualified
URL of the backend URL, such as `https://backend.instance.com/api`.

Then, in `cyclos.properties` of the Cyclos server, allow CORS with the
`cyclos.cors.origin` setting. It can either be set to `*`, which allows CORS from any
origin, or to the origin of the domain which hosts the frontend.

In this case the backend's API URL is publicly accessible in the Internet, so you
should not set the 'Public API URL' setting in the Cyclos configuration.

### Setup the server to rewrite requests to the index file

Angular uses `History.pushState()` method for navigation. This changes the URL to a
sub-path without generating another request to the server. However, when navigating
directly to one of these sub-paths, or when reloading the page, the server needs
to respond with the index file. 

In Apache, this can be done with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

In nginx, the configuration is:

```nginx
location / {
  try_files $uri$args $uri$args/ /index.html;
}
```

### Using external identity providers

In order to use external identity providers, so you users can login with their
Google, Facebook, etc, account, if the frontend is hosted separatedly, then it
must proxy requests to `/identity` and forward them to Cyclos.

The proxy should be configured in a similar as for `/api`, however, proxying 
the `/identity` path.

### Generate correct links from Cyclos

In Cyclos you need a script to generate links to the new frontend for users.
For this, as a global administrator (which may be switched to the network),
in 'System > Tools > Script', create a script of type 'Link generation',
with the following content:


```groovy
import org.cyclos.entities.users.BasicUser
import org.cyclos.impl.utils.LinkType
import org.cyclos.utils.StringHelper

BasicUser user = binding.user
if (user?.admin && user.user.group.adminType != null) {
    // Don't generate custom links for system administrators
    return null
}

// Read the parameters
Map scriptParameters = binding.scriptParameters
LinkType linkType = binding.type
String root = StringHelper.removeEnd(scriptParameters.rootUrl, '/')

// For root, return the configured root URL
if (linkType == linkType.ROOT) {
    return root
}

// Cyclos already generates links to the built-in frontend,
// using the /ui/ prefix. This script assumes that the users
// configuration sets the new frontend for all regular users.
String urlFilePart = binding.urlFilePart
if (urlFilePart?.startsWith("/ui/")) {
    return root + StringHelper.removeStart(urlFilePart, "/ui")
}

```

Then, in 'System > System configuration > Configurations' select the configuration
applied to users (or the default one) and mark the 'Link generation' field for
customization. Then select the script you created and set the following as parameters,
replacing the URL with your deployed URL:

```properties
rootUrl = https://account.example.com
```

For this script to work, make sure that the same configuration sets the frontend for
users to be the new frontend, not the classic frontend.

### Customizing the frontend theme

When running in standalone mode, the frontend will not use the theme which can be
customized in Cyclos. Instead, the theme can be customized by adding the desired SASS
variables in `src/styles/_custom-definitions.scss` or by adding SASS / CSS rules in
`src/styles/_custom-definitions.scss`. The theme will be compiled together with the
whole frontend.

## Improving performance on the HTTP server

Angular generates some large, yet minified, JavaScript and CSS files.
Two techniques can make loading the page much faster:

- Compression: Compresses the files when sending them to the client;
- Cache: Clients don't need to fetch again unchanged files.

When the frontend is served by Cyclos, these are aplied automatically.
However, when hosting the frontend, they should be manually configured in the server.

On Apache, the following configuration can be applied:

```apache
  <IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
  </IfModule>
  <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
  </IfModule>
```

In nginx, the configuration is:

```nginx
location / {
  include /etc/nginx/mime.types;
  try_files $uri$args $uri$args/ /index.html;
  gzip on;
  gzip_types text/html text/css application/javascript;
  expires 1y;
  add_header Cache-Control "public";
}
```