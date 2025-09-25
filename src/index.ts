import type MarkdownIt from 'markdown-it'

const reCapture = /^\{([^{}\n]*)\}([^[\]{}()]|$)/
const reHtmlProtocol = /^https?:\/\//i
const reGitHubScope = /^(?:https?:\/\/)?github\.com\/([\w-]*)(?:$|\/)/

export interface ParsedMagicLink {
  text?: string
  link: string
  type?: string
  class?: string[]
  imageUrl?: string
}

export interface ResolvedMagicLink extends Required<ParsedMagicLink> {}

export interface MagicLinkHandler {
  name: string
  handler: (content: string) => ParsedMagicLink | void | false
  postprocess?: (parsed: ResolvedMagicLink) => ResolvedMagicLink | void
}

export interface PlatformUserConfig {
  /**
   * The profile link for this user
   */
  link: string
  /**
   * The avatar URL for this user
   */
  avatarUrl: string
  /**
   * Optional display name for this user
   */
  displayName?: string
}

export interface MagicLinkHandlerLinkOptions {
  /**
   * Map of link names to URLs. Case-sensitive.
   *
   * For example, `{ 'Google': 'https://google.com' }` will allow you to use `{Google}` in your markdown without specifying the URL
   */
  linksMap?: Record<string, string | { link: string, imageUrl?: string }>
}

export interface MarkdownItMagicLinkOptions extends MagicLinkHandlerLinkOptions {
  handlers?: MagicLinkHandler[]

  /**
   * Array of RegExp and string pairs to override the default image URL
   */
  imageOverrides?: [RegExp | string, string][]

  /**
   * Platform users configuration
   * e.g., { 'bilibili': { 'username': { link: 'https://space.bilibili.com/123', avatarUrl: 'https://avatar.url' } } }
   */
  platformUsers?: Record<string, Record<string, PlatformUserConfig>>
}

const GITHUB_SPECIAL_ROUTES = [
  'settings',
  'pulls',
  'issues',
  'discussions',
  'sponsor',
  'sponsors',
  'notifications',
]

export function handlerLink(options?: MagicLinkHandlerLinkOptions): MagicLinkHandler {
  return {
    name: 'link',
    handler(content: string) {
      const parts = content.split('|').map(i => i.trim())
      let text = parts[0]
      let url: string | undefined = parts.length > 1
        ? parts[1]
        : undefined
      const type = 'link'
      let imageUrl: string | undefined

      let linkDefaults = text ? options?.linksMap?.[text] : undefined
      if (typeof linkDefaults === 'string')
        linkDefaults = { link: linkDefaults }

      url ||= linkDefaults?.link || parts[0]
      imageUrl ||= linkDefaults?.imageUrl

      if (!url?.match(/^https?:\/\//))
        return false

      text ||= url.replace(reHtmlProtocol, '')
      imageUrl ||= `https://favicon.yandex.net/favicon/${new URL(url || '').hostname}`

      return {
        text,
        link: url,
        type,
        imageUrl,
      }
    },
  }
}

export function handlerGitHubAt(): MagicLinkHandler {
  return {
    name: 'github-at',
    handler(content: string) {
      const parts = content.split('|').map(i => i.trim())
      const loginAt = parts[0]
      const text = parts[1]
      const link = parts[2]

      if (!loginAt.startsWith('@'))
        return false

      const login = loginAt.slice(1)

      // Skip if it contains colon (platform:user format)
      if (login.includes(':'))
        return false

      return {
        text: text || login.toUpperCase(),
        link: link || `https://github.com/${login}`,
        type: 'github-at',
        imageUrl: `https://github.com/${login}.png`,
      }
    },
    postprocess(parsed: ResolvedMagicLink) {
      if (parsed.link.match(reGitHubScope) && parsed.type !== 'github-at') {
        const login = parsed.link.match(reGitHubScope)![1]
        if (!GITHUB_SPECIAL_ROUTES.includes(login) && parsed.imageUrl.startsWith('https://favicon.yandex.net'))
          parsed.imageUrl = `https://github.com/${login}.png`
      }
    },
  }
}

export function handlerPlatformAt(options?: { platformUsers?: Record<string, Record<string, PlatformUserConfig>> }): MagicLinkHandler {
  return {
    name: 'platform-at',
    handler(content: string) {
      const parts = content.split('|').map(i => i.trim())
      const loginAt = parts[0]
      const customText = parts[1]
      const customLink = parts[2]

      if (!loginAt.startsWith('@'))
        return false

      const atPart = loginAt.slice(1)
      const colonIndex = atPart.indexOf(':')

      if (colonIndex === -1)
        return false

      const platform = atPart.slice(0, colonIndex)
      const username = atPart.slice(colonIndex + 1)

      if (!platform || !username)
        return false

      const platformConfig = options?.platformUsers?.[platform]
      const userConfig = platformConfig?.[username]

      if (!userConfig)
        return false

      return {
        text: customText || userConfig.displayName || username.toUpperCase(),
        link: customLink || userConfig.link,
        type: `${platform}-at`,
        imageUrl: userConfig.avatarUrl,
      }
    },
  }
}

export function parseMagicLink(content: string, handlers: MagicLinkHandler[]) {
  for (const handler of handlers) {
    const parsed = handler.handler(content)
    if (parsed)
      return parsed
  }
  return false
}

export default function MarkdownItMagicLink(md: MarkdownIt, options: MarkdownItMagicLinkOptions = {}) {
  const {
    handlers = [
      handlerLink(options),
      handlerPlatformAt(options),
      handlerGitHubAt(),
    ],
  } = options

  md.inline.ruler.before('text', 'magic-link', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== '{'.charCodeAt(0))
      return false

    const starts = state.src.slice(state.pos)
    const match = starts.match(reCapture)
    if (!match)
      return false

    const fullMatch = match[0]
    const tailingChar = match[2]

    const parsed = parseMagicLink(match[1], handlers)
    if (!parsed)
      return false

    if (!silent) {
      let resolved = {
        class: [],
        ...parsed,
      } as ResolvedMagicLink

      resolved.link = state.md.normalizeLink(parsed.link)
      resolved.class.push('markdown-magic-link', `markdown-magic-link-${parsed.type}`)
      resolved.text ||= resolved.link.replace(reHtmlProtocol, '')
      resolved.imageUrl ||= `https://favicon.yandex.net/favicon/${new URL(resolved.link || '').hostname}`

      for (const handler of handlers)
        resolved = handler.postprocess?.(resolved) || resolved

      for (const [regex, value] of options.imageOverrides || []) {
        if (typeof regex === 'string' ? resolved.link === regex : resolved.link.match(regex)) {
          resolved.imageUrl = value
          break
        }
      }

      const token_o = state.push('link_open', 'a', 1)
      token_o.attrs = [
        ['href', resolved.link],
        ['class', resolved.class.join(' ')],
      ]
      token_o.info = 'auto'

      const token_i = state.push('html_inline', '', 0)
      token_i.content = `<span class="markdown-magic-link-image" style="background-image: url('${resolved.imageUrl}');"></span>`

      const token_t = state.push('text', '', 0)
      token_t.content = resolved.text

      const token_c = state.push('link_close', 'a', -1)
      token_c.info = 'auto'
    }

    state.pos += fullMatch.length - tailingChar.length
    return true
  })
}
