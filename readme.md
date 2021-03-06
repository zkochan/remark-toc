# remark-toc [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov] [![remark][remark-badge]][remark]

Generate a Table of Contents in [**remark**][remark].

## Installation

[npm][npm-install]:

```bash
npm install remark-toc
```

**remark-toc** is also available as an AMD, CommonJS, and globals
module, [uncompressed and compressed][releases].

## Usage

Dependencies:

```javascript
var remark = require('remark');
var toc = require('remark-toc');
```

Process:

```javascript
var doc = remark().use(toc).process([
    '# Alpha',
    '',
    '## Table of Contents',
    '',
    '## Bravo',
    '',
    '### Charlie',
    '',
    '## Delta',
    ''
].join('\n'));
```

Yields:

```markdown
# Alpha

## Table of Contents

-   [Bravo](#bravo)

    -   [Charlie](#charlie)

-   [Delta](#delta)

## Bravo

### Charlie

## Delta
```

## API

### `remark.use(toc[, options])`

Add a Table of Contents to a Markdown document.

*   Looks for the first heading containing `"Table of Contents"`, `"toc"`,
    or `table-of-contents` (case insensitive, supports alt/title attributes
    for links and images too);

*   Removes all following contents until an equal or higher heading is found;

*   Inserts a list representation of the hierarchy of following headings;

*   Adds links to following headings, using the same slugs as GitHub.

**Options** (`Object`, optional):

*   `slug`
    — Passed to [`remark-slug`][remark-slug];

*   `heading` (`string?`, default: `"toc|table[ -]of[ -]contents?"`)
    — Heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i');`;

*   `maxDepth` (`number?`, default: `6`)
    — Maximum heading depth to include in the table of contents,
    This is inclusive, thus, when set to `3`, level three headings,
    are included (those with three hashes, `###`);

*   `tight` (`boolean?`, default: `false`)
    — Whether to compile list-items tightly.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/remark-toc.svg

[travis]: https://travis-ci.org/wooorm/remark-toc

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-toc.svg

[codecov]: https://codecov.io/github/wooorm/remark-toc

[npm-install]: https://docs.npmjs.com/cli/install

[releases]: https://github.com/wooorm/remark-toc/releases

[license]: LICENSE

[author]: http://wooorm.com

[remark]: https://github.com/wooorm/remark

[remark-slug]: https://github.com/wooorm/remark-slug

[remark-badge]: https://img.shields.io/badge/remark-4.0.0-brightgreen.svg
