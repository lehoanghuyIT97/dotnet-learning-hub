import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Lang } from '../content/helpers'

type Spec = {
  comment?: string
  keywords?: string
  ci?: boolean
  word?: string
  keys?: boolean
  tags?: boolean
  types?: boolean
}

const SPECS: Partial<Record<Lang, Spec>> = {
  csharp: {
    comment: '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',
    types: true,
    keywords:
      'abstract as async await base bool break case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref return sbyte sealed short sizeof static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while init required get set with when global yield partial and or not file field value'
  },
  dart: {
    comment: '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',
    types: true,
    keywords:
      'abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for get hide if implements import in interface is late library mixin new null on operator part required rethrow return set show static super switch sync this throw true try typedef var void while with yield'
  },
  sql: {
    comment: '--[^\\n]*',
    ci: true,
    keywords:
      'select from where join inner left right outer on group by having order asc desc insert into values update set delete create table index unique begin transaction commit rollback with as and or not null is in like offset rows fetch next only top distinct count sum avg min max union all primary key foreign references alter drop add constraint default'
  },
  bash: {
    comment: '#[^\\n]*',
    keywords: 'if then else fi for do done echo export cd cat docker dotnet npm git'
  },
  json: { comment: '', keys: true, keywords: 'true false null' },
  yaml: { comment: '#[^\\n]*', keys: true, word: '[A-Za-z_][\\w-]*', keywords: 'true false null' },
  http: { comment: '#[^\\n]*', keywords: 'GET POST PUT PATCH DELETE HEAD OPTIONS' },
  dockerfile: {
    comment: '#[^\\n]*',
    keywords: 'FROM RUN COPY ADD WORKDIR ENV EXPOSE USER ENTRYPOINT CMD AS ARG VOLUME'
  },
  xml: { comment: '<!--[\\s\\S]*?-->', tags: true }
}

type Token = { text: string; cls?: string }

const cache = new Map<string, RegExp>()

function buildRegex(lang: Lang, spec: Spec): RegExp {
  const hit = cache.get(lang)
  if (hit) return hit
  const parts = [
    spec.comment ? `(${spec.comment})` : '()',
    '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|[$@]*"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')',
    '(\\b\\d[\\d_]*(?:\\.\\d+)?[A-Za-z]*\\b)',
    spec.tags ? '(<\\/?[A-Za-z][\\w.]*|\\/?>)' : '()',
    `(${spec.word || '[A-Za-z_]\\w*'})`
  ]
  const re = new RegExp(parts.join('|'), 'g')
  cache.set(lang, re)
  return re
}

function tokenize(source: string, lang: Lang): Token[] {
  const spec = SPECS[lang]
  if (!spec) return [{ text: source }]
  const keywords = new Set((spec.keywords || '').split(' ').filter(Boolean))
  const re = buildRegex(lang, spec)
  re.lastIndex = 0

  const tokens: Token[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) {
    if (m[0] === '') { re.lastIndex++; continue }
    if (m.index > last) tokens.push({ text: source.slice(last, m.index) })
    const [text, comment, str, num, tag, word] = m
    const rest = source.slice(m.index + text.length, m.index + text.length + 40)
    let cls: string | undefined
    if (comment) cls = 'tok-c'
    else if (str) cls = spec.keys && /^\s*:/.test(rest) ? 'tok-p' : 'tok-s'
    else if (num) cls = 'tok-n'
    else if (tag) cls = 'tok-k'
    else if (word) {
      const key = spec.ci ? word.toLowerCase() : word
      if (spec.keys && lang === 'yaml' && rest.startsWith(':')) cls = 'tok-p'
      else if (keywords.has(key)) cls = 'tok-k'
      else if (spec.types && /^[A-Z]/.test(word)) cls = 'tok-t'
    }
    tokens.push({ text, cls })
    last = m.index + text.length
  }
  if (last < source.length) tokens.push({ text: source.slice(last) })
  return tokens
}

const LABELS: Record<Lang, string> = {
  csharp: 'C#', dart: 'Dart', sql: 'SQL', bash: 'Shell', json: 'JSON', yaml: 'YAML',
  http: 'HTTP', dockerfile: 'Dockerfile', xml: 'XML', text: 'Text'
}

export function CodeBlock({ code, lang, title }: { code: string; lang: Lang; title?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard không khả dụng */ }
  }

  return <div className="code-block">
    <div className="code-head">
      <span className="code-lang">{LABELS[lang]}</span>
      {title && <span className="code-title">{title}</span>}
      <button className="code-copy" onClick={copy} aria-label="Sao chép code">
        {copied ? <><Check size={13}/> Đã chép</> : <><Copy size={13}/> Chép</>}
      </button>
    </div>
    <pre><code>{tokenize(code, lang).map((t, i) => t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text)}</code></pre>
  </div>
}
