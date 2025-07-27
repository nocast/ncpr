# NoCast Plugin Registry
The website and repository for storing, searching and installing nocast plugins. Hosted [here](https://ncpr.roger-padrell.deno.net/).

## Technologies
Using Deno (typescript), Deno deploy, Oak and HTML+CSS+JS.

## Publishing a package
Add it into `registry.json`, where `key: value` is `plugin_name: plugin_repò`.
The URL to the plugin's repo must contain the `.git` enging (and MUST be a git repo).

After adding it to `registry.json`, just create a pull request. It can be accepted from wihin a few hours to a few days.
