# markdown-it-magic-link

[![npm version][npm-version-src]][npm-version-href]

Makes links and `@mentions` in markdown beautiful and interactive.

> This is a fork of [antfu/markdown-it-magic-link](https://github.com/antfu/markdown-it-magic-link) with additional platform-specific mention support.

## New Features

### Platform-specific @mentions

In addition to the original GitHub @mentions (`{@username}`), this fork adds support for custom platform mentions using the format `{@platform:username}`.

#### Configuration

```js
import MarkdownItMagicLink from '@lu-jiejie/markdown-it-magic-link'
import MarkdownIt from 'markdown-it'

const md = MarkdownIt()
md.use(MarkdownItMagicLink, {
  platformUsers: {
    bilibili: {
      'lu-jiejie': {
        link: 'https://space.bilibili.com/123456',
        avatarUrl: 'https://i0.hdslb.com/bfs/face/avatar.jpg',
        displayName: 'Lu Jiejie' // optional
      }
    },
    twitter: {
      someone: {
        link: 'https://twitter.com/someone',
        avatarUrl: 'https://pbs.twimg.com/avatar.jpg'
      }
    }
  }
})
```

#### Usage

```markdown
Check out {@bilibili:lu-jiejie}
Follow me on {@twitter:someone}
Custom display: {@bilibili:lu-jiejie|My Display Name}
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lu-jiejie/markdown-it-magic-link?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://www.npmjs.com/package/@lu-jiejie/markdown-it-magic-link
