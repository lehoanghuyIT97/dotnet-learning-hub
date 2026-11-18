import { Fragment } from 'react'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Check, Clock, ExternalLink, Hammer,
  Lightbulb, ListChecks, Smartphone, TriangleAlert
} from 'lucide-react'
import type { Block, Lesson, Stage } from '../data'
import { CodeBlock } from './CodeBlock'

/** Hiển thị `code` và **đậm** trong đoạn văn. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return <>{parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code className="inline-code" key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    return <Fragment key={i}>{part}</Fragment>
  })}</>
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case 'p': return <p className="r-p"><Rich text={block.text}/></p>
    case 'h': return <h3 className="r-h">{block.text}</h3>
    case 'ul': return <ul className="r-ul">{block.items.map((item, i) => <li key={i}><Rich text={item}/></li>)}</ul>
    case 'code': return <CodeBlock code={block.code} lang={block.lang} title={block.title}/>
    case 'vs': return <div className="vs-wrap">
      {block.title && <div className="vs-title">{block.title}</div>}
      <div className="vs-grid">
        <CodeBlock code={block.dart} lang="dart"/>
        <CodeBlock code={block.cs} lang="csharp"/>
      </div>
    </div>
    case 'tip': return <div className="callout tip"><Lightbulb size={16}/><div><Rich text={block.text}/></div></div>
    case 'warn': return <div className="callout warn"><TriangleAlert size={16}/><div><Rich text={block.text}/></div></div>
    case 'table': return <div className="table-wrap"><table className="r-table">
      <thead><tr>{block.head.map((cell, i) => <th key={i}>{cell}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}><Rich text={cell}/></td>)}</tr>)}</tbody>
    </table></div>
  }
}

type Props = {
  lesson: Lesson
  stage: Stage
  position: number
  total: number
  completed: boolean
  prev?: { lesson: Lesson; stage: Stage }
  next?: { lesson: Lesson; stage: Stage }
  onBack: () => void
  onToggle: () => void
  onOpen: (id: string) => void
}

export function LessonReader({ lesson, stage, position, total, completed, prev, next, onBack, onToggle, onOpen }: Props) {
  return <section className="reader">
    <button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Về lộ trình học</button>

    <header className="reader-head">
      <div className="eyebrow">GIAI ĐOẠN {stage.id} · {stage.title.toUpperCase()}</div>
      <h1>{lesson.title}</h1>
      <p className="lead">{lesson.detail}</p>
      <div className="reader-meta">
        <span><Clock size={13}/> ~{lesson.minutes} phút</span>
        <span>Bài {position}/{total} trong giai đoạn</span>
        <span className={`lesson-status ${completed ? 'is-done' : ''}`}>{completed ? 'Completed' : 'To do'}</span>
      </div>
    </header>

    {lesson.flutter && <div className="callout flutter"><Smartphone size={17}/><div><strong>Góc nhìn Flutter dev</strong><p><Rich text={lesson.flutter}/></p></div></div>}

    <div className="reader-body">
      {lesson.blocks.map((block, i) => <BlockView block={block} key={i}/>)}
    </div>

    <div className="reader-cards">
      <div className="panel">
        <div className="reader-card-title"><ListChecks size={16}/> Ghi nhớ</div>
        <ul className="r-ul">{lesson.takeaways.map((t, i) => <li key={i}><Rich text={t}/></li>)}</ul>
      </div>
      {lesson.practice && <div className="panel">
        <div className="reader-card-title"><Hammer size={16}/> Thực hành</div>
        <p className="r-p"><Rich text={lesson.practice}/></p>
      </div>}
    </div>

    {lesson.links && lesson.links.length > 0 && <div className="reader-links">
      <div className="reader-card-title">Đọc thêm</div>
      {lesson.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.title} <ExternalLink size={13}/></a>)}
    </div>}

    <footer className="reader-footer">
      <button className={completed ? 'ghost-button' : 'primary-button'} onClick={onToggle}>
        <Check size={14}/> {completed ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã học xong'}
      </button>
      <div className="reader-nav">
        {prev ? <button className="nav-lesson" onClick={() => onOpen(prev.lesson.id)}>
          <ChevronLeft size={16}/><span><small>Bài trước</small><strong>{prev.lesson.title}</strong></span>
        </button> : <span/>}
        {next ? <button className="nav-lesson next" onClick={() => onOpen(next.lesson.id)}>
          <span><small>Bài tiếp theo</small><strong>{next.lesson.title}</strong></span><ChevronRight size={16}/>
        </button> : <span/>}
      </div>
    </footer>
  </section>
}
