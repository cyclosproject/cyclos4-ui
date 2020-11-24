# Cyclos 4 user interface

This is the new frontend for [Cyclos 4](https://www.cyclos.org/).
Starting with Cyclos 4.14, the new frontend is bundled and served by Cyclos itself.

Previously the frontend had several configuration options which should be set programmatically.
Now all the customizations, including themes, translations, pages and banners are done in the Cyclos application.

## Why keeping this repository in GitHub?

As the new frontend is bundled with Cyclos itself, why still publish it in GitHub?
Well, there are some reasons for that:

- This frontend is a very good example on how to use the Cyclos REST API.
  The codebase is large, as it is a full frontend for Cyclos, convering many modules,
  except system configuration and content management. As such, it is expected that most of the common API usage
  will be covered here;
- The project is still open source, under the MIT License.
  As such, projects that use Cyclos can help improving the frontend;
- Also, by being MIT Licensed, projects can choose to customize some pages.
  Additionally, projects that also connect with other software can create new functionality which will be
  presented to users in a single, concise interface;
- Having the project in GitHub can help us track issues which our customers find using the GitHub's issue tracker.

## Versioning scheme

Previously this frontend had its own version. Now, being bundled with Cyclos, it will have the same version as Cyclos.
Examples: 4.14.0, 4.14.1, 4.15.3 and so on. On each Cyclos release the code on GitHub will be updated and tagged
with the corresponding version.

## Development

This frontend is written in [Angular](https://angular.io/). It uses [Bootstrap 4](https://getbootstrap.com/) for theming.
In order to modify any file, make sure you are familiar with these technologies.

To modify this frontend, either for contributing fixes or to implement custom functionality, follow these steps:

1. Clone the git repository on `https://github.com/cyclosproject/cyclos4-ui`;
1. Install NPM dependencies by running `npm install` in the project directory;
1. Set the URL of your Cyclos server in the `proxy.json` file;
1. Start the Angular development by running `npm start` in the project directory;
1. Open your browser on `http://localhost:4200`.

This project relies heavily on code generation. We generate:

- Client classes for the Cyclos REST API, using [ng-openapi-gen](https://github.com/cyclosproject/ng-openapi-gen/);
- A TypeScript interface for translation keys,
  using [ng-translation-gen](https://github.com/cyclosproject/ng-translation-gen/).
  The source for it is `src/i18n/i18n.json`;
- A JSON file with the content of each SVG icon we use.
  Most icons are from [Bootstrap](https://icons.getbootstrap.com/).
  However, there are some custom icons as well.

If any of these is modified, you need to re-generate the corresponding code with the command `npm run generate`.

## Updating the frontend version served by Cyclos with your customized one

Important: Make sure you checkout the exact tag version in GitHub as the Cyclos server version.
For example, if the server runs `4.14.2`, checkout the tag `4.14.2`.

Then apply all customizations to that version, and build with the `npm run build`.
You will have the `dist/ui` folder generated with the code that should be served.
However, Cyclos pre-process the `src/ui/index.html` file into a JSP page to include server-side data on it.

So, to copy the files to the correct place and have the JSP file generated,
supposing you have the Cyclos package you have downloaded extracted to the directory under `$CYCLOS_ROOT`:

```bash
$ cd $CYCLOS_ROOT/cyclos-x.y.z # replace with the correct version
$ cd cyclos-ui-github
$ ./gradlew copyUi -Dui.dist=/path/to/your/customized/dist/ui
```

After running this command, the Cyclos web directory will be updated to include your customized frontend.
The content of the web directory can then be deployed to the application server (such as Tomcat) as usual.

## Contributing translations

If you wish to contribute to the translations, not only for this frontend but to Cyclos in general,
please, request access on [https://crowdin.com/project/cyclos/](https://crowdin.com/project/cyclos/)
and help us making Cyclos translated in more languages, as well as reviewing and extending existing translations.
