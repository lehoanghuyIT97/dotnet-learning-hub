export type Lang = 'csharp' | 'dart' | 'sql' | 'bash' | 'json' | 'yaml' | 'http' | 'dockerfile' | 'xml' | 'text'

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'code'; lang: Lang; code: string; title?: string }
  | { t: 'vs'; dart: string; cs: string; title?: string }
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export type Link = { title: string; url: string }

export type Lesson = {
  id: string
  title: string
  detail: string
  minutes: number
  /** Góc nhìn dành cho người đã quen Flutter/Dart */
  flutter?: string
  blocks: Block[]
  takeaways: string[]
  practice?: string
  links?: Link[]
}

/** Dùng cho code block để giữ nguyên dấu backslash. */
export const raw = String.raw

export const p = (text: string): Block => ({ t: 'p', text })
export const h = (text: string): Block => ({ t: 'h', text })
export const ul = (...items: string[]): Block => ({ t: 'ul', items })
export const tip = (text: string): Block => ({ t: 'tip', text })
export const warn = (text: string): Block => ({ t: 'warn', text })
export const code = (lang: Lang, src: string, title?: string): Block => ({ t: 'code', lang, code: src.replace(/^\n/, '').replace(/\s+$/, ''), title })
export const vs = (dart: string, cs: string, title?: string): Block => ({
  t: 'vs',
  dart: dart.replace(/^\n/, '').replace(/\s+$/, ''),
  cs: cs.replace(/^\n/, '').replace(/\s+$/, ''),
  title
})
export const table = (head: string[], rows: string[][]): Block => ({ t: 'table', head, rows })
