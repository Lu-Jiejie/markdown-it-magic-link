import MarkdownIt from 'markdown-it'
import { expect, it } from 'vitest'
import MarkdownItMagicLink from '../src'

it('basic', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink)

  const result = md.render([
    'Foo {@github} Bar',
    '',
    'Foo {VueUse|https://vueuse.org} Bar',
  ].join('\n'))

  expect(result)
    .toMatchInlineSnapshot(`
      "<p>Foo <a href="https://github.com/github" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/github.png');"></span>GITHUB</a> Bar</p>
      <p>Foo <a href="https://vueuse.org" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      "
    `)
})

it('links map', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    linksMap: {
      'VueUse': 'https://vueuse.org/1',
      'Vue Use': 'https://vueuse.org/2',
    },
  })

  const result = md.render([
    'A {VueUse} Bar',
    '',
    'B {Vue Use } Bar',
    '',
    'C {VueUse|https://vueuse.org/3} Bar',
    '',
    'D {Vueuse} non-target',
  ].join('\n'))
  expect(result)
    .toMatchInlineSnapshot(`
      "<p>A <a href="https://vueuse.org/1" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      <p>B <a href="https://vueuse.org/2" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>Vue Use</a> Bar</p>
      <p>C <a href="https://vueuse.org/3" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      <p>D {Vueuse} non-target</p>
      "
    `)
})

it('links map with image', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    linksMap: {
      VueUse: { link: 'https://vueuse.org/1', imageUrl: 'https://example.com/favicon1.png' },
    },
  })

  const result = md.render([
    'A {VueUse} Bar',
  ].join('\n'))
  expect(result)
    .toMatchInlineSnapshot(`
      "<p>A <a href="https://vueuse.org/1" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://example.com/favicon1.png');"></span>VueUse</a> Bar</p>
      "
    `)
})

it('imageOverrides', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    linksMap: {
      VueUse: 'https://vueuse.org/1',
    },
    imageOverrides: [
      [/^https:\/\/vueuse\.org\/1/, 'https://example.com/favicon1.png'],
      [/^https:\/\/vueuse\.org\//, 'https://example.com/favicon2.png'],
    ],
  })

  const result = md.render([
    'A {VueUse} Bar',
    '',
    'B {VueUse|https://vueuse.org/anything} Bar',
  ].join('\n'))
  expect(result)
    .toMatchInlineSnapshot(`
      "<p>A <a href="https://vueuse.org/1" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://example.com/favicon1.png');"></span>VueUse</a> Bar</p>
      <p>B <a href="https://vueuse.org/anything" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://example.com/favicon2.png');"></span>VueUse</a> Bar</p>
      "
    `)
})

it('github link', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink)

  const result = md.render([
    '{@antfu}',
    '{@antfu|Anthony}',
    '{@antfu|Anthony|https://github.com/antfu?tab=sponsoring}',
  ].join('\n'))

  expect(result)
    .toMatchInlineSnapshot(`
      "<p><a href="https://github.com/antfu" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/antfu.png');"></span>ANTFU</a>
      <a href="https://github.com/antfu" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/antfu.png');"></span>Anthony</a>
      <a href="https://github.com/antfu?tab=sponsoring" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/antfu.png');"></span>Anthony</a></p>
      "
    `)
})

it('platform at mentions', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    platformUsers: {
      bilibili: {
        'lu-jiejie': {
          link: 'https://space.bilibili.com/123456',
          avatarUrl: 'https://i0.hdslb.com/bfs/face/avatar.jpg',
          displayName: 'Lu Jiejie',
        },
      },
      twitter: {
        someone: {
          link: 'https://twitter.com/someone',
          avatarUrl: 'https://pbs.twimg.com/profile_images/avatar.jpg',
        },
      },
    },
  })

  const result = md.render([
    '{@bilibili:lu-jiejie}',
    '{@bilibili:lu-jiejie|LU JIEJIE}',
    '{@bilibili:lu-jiejie|LU JIEJIE|https://space.bilibili.com/custom}',
    '{@twitter:someone}',
  ].join('\n'))

  expect(result)
    .toMatchInlineSnapshot(`
      "<p><a href="https://space.bilibili.com/123456" class="markdown-magic-link markdown-magic-link-bilibili-at"><span class="markdown-magic-link-image" style="background-image: url('https://i0.hdslb.com/bfs/face/avatar.jpg');"></span>Lu Jiejie</a>
      <a href="https://space.bilibili.com/123456" class="markdown-magic-link markdown-magic-link-bilibili-at"><span class="markdown-magic-link-image" style="background-image: url('https://i0.hdslb.com/bfs/face/avatar.jpg');"></span>LU JIEJIE</a>
      <a href="https://space.bilibili.com/custom" class="markdown-magic-link markdown-magic-link-bilibili-at"><span class="markdown-magic-link-image" style="background-image: url('https://i0.hdslb.com/bfs/face/avatar.jpg');"></span>LU JIEJIE</a>
      <a href="https://twitter.com/someone" class="markdown-magic-link markdown-magic-link-twitter-at"><span class="markdown-magic-link-image" style="background-image: url('https://pbs.twimg.com/profile_images/avatar.jpg');"></span>SOMEONE</a></p>
      "
    `)
})

it('platform at mentions - not configured', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    platformUsers: {
      bilibili: {
        'lu-jiejie': {
          link: 'https://space.bilibili.com/123456',
          avatarUrl: 'https://i0.hdslb.com/bfs/face/avatar.jpg',
        },
      },
    },
  })

  const result = md.render([
    '{@bilibili:unknown-user}',
    '{@unknown-platform:user}',
    '{@invalid}',
  ].join('\n'))

  expect(result)
    .toMatchInlineSnapshot(`
      "<p>{@bilibili:unknown-user}
      {@unknown-platform:user}
      <a href="https://github.com/invalid" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/invalid.png');"></span>INVALID</a></p>
      "
    `)
})
