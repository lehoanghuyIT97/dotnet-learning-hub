import { useEffect, useMemo, useState } from 'react'
import {
  Activity, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp,
  ClipboardCheck, Code2, ExternalLink, FileText, Flame, FolderOpen,
  GraduationCap, LayoutDashboard, Menu, Plus, Search, Sparkles,
  Target, Trash2, X
} from 'lucide-react'
import { exercises, resources, stages } from './data'
import { LessonReader } from './components/LessonReader'

type Progress = { id: number; itemId: string; completed: boolean; updatedAt: string }
type Note = { id: number; title: string; content: string; updatedAt: string }
type Tab = 'overview' | 'roadmap' | 'notes' | 'resources' | 'exercises'

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080/api').replace(/\/$/, '')

// Danh sách phẳng các bài học theo đúng thứ tự lộ trình, dùng cho điều hướng bài trước/sau.
const flatLessons = stages.flatMap(stage => stage.lessons.map(lesson => ({ lesson, stage })))
const validLessonIds = new Set(flatLessons.map(x => x.lesson.id))

function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Note[]>([])
  const [expanded, setExpanded] = useState<number[]>([1])
  const [search, setSearch] = useState('')
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
  const [exerciseChecks, setExerciseChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('dotnet-exercise-checks') || '{}') }
    catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem('dotnet-exercise-checks', JSON.stringify(exerciseChecks))
  }, [exerciseChecks])

  async function loadData() {
    try {
      const [pRes, nRes] = await Promise.all([fetch(`${API}/progress`), fetch(`${API}/notes`)])
      if (!pRes.ok || !nRes.ok) throw new Error('API unavailable')
      const p: Progress[] = await pRes.json()
      const n: Note[] = await nRes.json()
      const map: Record<string, boolean> = {}
      p.forEach(x => map[x.itemId] = x.completed)
      setProgress(map)
      setNotes(n)
      setApiStatus('online')
    } catch {
      setApiStatus('offline')
      const savedProgress = localStorage.getItem('dotnet-progress')
      const savedNotes = localStorage.getItem('dotnet-notes')
      if (savedProgress) setProgress(JSON.parse(savedProgress))
      if (savedNotes) setNotes(JSON.parse(savedNotes))
    }
  }

  useEffect(() => { loadData() }, [])

  const totalLessons = flatLessons.length
  // Chỉ đếm các bài còn tồn tại trong lộ trình (tiến độ cũ của bài đã đổi ID sẽ bị bỏ qua)
  const completedCount = Object.entries(progress).filter(([id, done]) => done && validLessonIds.has(id)).length
  const percent = totalLessons ? Math.round(completedCount / totalLessons * 100) : 0
  const stageStats = useMemo(() => stages.map(s => {
    const done = s.lessons.filter(l => progress[l.id]).length
    return { ...s, done, percent: Math.round(done / s.lessons.length * 100) }
  }), [progress])

  async function toggleLesson(id: string) {
    const next = !progress[id]
    setProgress(old => {
      const updated = { ...old, [id]: next }
      localStorage.setItem('dotnet-progress', JSON.stringify(updated))
      return updated
    })
    try {
      const response = await fetch(`${API}/progress/${encodeURIComponent(id)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next })
      })
      if (!response.ok) throw new Error()
      setApiStatus('online')
    } catch { setApiStatus('offline') }
  }

  async function saveNote() {
    if (!noteTitle.trim() && !noteContent.trim()) return
    const payload = { title: noteTitle.trim() || 'Ghi chú mới', content: noteContent }
    try {
      const response = await fetch(editingNote ? `${API}/notes/${editingNote}` : `${API}/notes`, {
        method: editingNote ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error()
      await loadData()
    } catch {
      const fallback = editingNote
        ? notes.map(n => n.id === editingNote ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n)
        : [{ id: Date.now(), ...payload, updatedAt: new Date().toISOString() }, ...notes]
      setNotes(fallback)
      localStorage.setItem('dotnet-notes', JSON.stringify(fallback))
    }
    setNoteTitle(''); setNoteContent(''); setEditingNote(null)
  }

  async function deleteNote(id: number) {
    try { await fetch(`${API}/notes/${id}`, { method: 'DELETE' }) } catch {}
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('dotnet-notes', JSON.stringify(updated))
  }

  function editNote(note: Note) {
    setEditingNote(note.id); setNoteTitle(note.title); setNoteContent(note.content)
    setTab('notes')
  }

  function openLesson(id: string) {
    setOpenLessonId(id)
    setTab('roadmap')
    window.scrollTo({ top: 0 })
  }

  function goToTab(next: Tab) {
    setTab(next)
    setOpenLessonId(null)
  }

  const openIndex = openLessonId ? flatLessons.findIndex(x => x.lesson.id === openLessonId) : -1
  const openEntry = openIndex >= 0 ? flatLessons[openIndex] : null

  const navItems = [
    { id: 'overview' as Tab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'roadmap' as Tab, label: 'Lộ trình học', icon: GraduationCap },
    { id: 'notes' as Tab, label: 'Ghi chú', icon: FileText },
    { id: 'resources' as Tab, label: 'Tài liệu', icon: FolderOpen },
    { id: 'exercises' as Tab, label: 'Bài tập & dự án', icon: Code2 }
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Code2 size={22}/></div>
        <div><strong>DotNet<span>Hub</span></strong><small>BACKEND LEARNING</small></div>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navItems.map(item => {
          const Icon = item.icon
          return <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => goToTab(item.id)}>
            <Icon size={18}/><span>{item.label}</span>{tab === item.id && <span className="nav-active-dot"/>}
          </button>
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="goal-card">
          <div className="goal-icon"><Target size={17}/></div>
          <div><strong>Mục tiêu của bạn</strong><p>Từ Flutter Developer thành .NET Backend Developer</p></div>
        </div>
        <div className="profile">
          <div className="avatar">.N</div>
          <div><strong>My Learning Space</strong><small>Personal workspace</small></div>
          <ChevronDown size={15} className="muted"/>
        </div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{navItems.find(x => x.id === tab)?.label}</strong></div>
        <div className="top-actions">
          <div className={`api-indicator ${apiStatus}`}><span/>{apiStatus === 'online' ? 'Database connected' : apiStatus === 'offline' ? 'Local fallback' : 'Connecting...'}</div>
          <div className="top-avatar">H</div>
        </div>
      </header>

      <div className="content">
        {tab === 'overview' && <section>
          <div className="welcome-row">
            <div><div className="eyebrow"><Sparkles size={14}/> YOUR LEARNING JOURNEY</div><h1>Chào mừng trở lại<span className="accent">.</span></h1><p className="lead">Lộ trình dành cho Flutter developer: tận dụng những gì đã biết để chuyển sang .NET Backend nhanh nhất.</p></div>
            <div className="date-chip"><span className="date-dot"/>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>

          <div className="stats-grid">
            <div className="stat-card progress-stat">
              <div className="stat-top"><span>TIẾN ĐỘ TỔNG THỂ</span><div className="stat-icon purple"><Activity size={18}/></div></div>
              <div className="stat-value">{percent}<small>%</small></div>
              <div className="progress-track"><div className="progress-fill purple-fill" style={{width: `${percent}%`}}/></div>
              <div className="stat-foot">{completedCount} / {totalLessons} bài học hoàn thành</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>BÀI HỌC HOÀN THÀNH</span><div className="stat-icon green"><Check size={18}/></div></div>
              <div className="stat-value">{completedCount}<small>/{totalLessons}</small></div>
              <div className="stat-foot">Cứ tiếp tục duy trì nhịp học nhé!</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>GIAI ĐOẠN HỌC</span><div className="stat-icon blue"><GraduationCap size={18}/></div></div>
              <div className="stat-value">{stageStats.filter(s => s.percent === 100).length}<small>/{stages.length}</small></div>
              <div className="stat-foot">Giai đoạn đã hoàn thành</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>GHI CHÚ CỦA BẠN</span><div className="stat-icon orange"><FileText size={18}/></div></div>
              <div className="stat-value">{notes.length}<small> notes</small></div>
              <div className="stat-foot">Kiến thức bạn đã lưu lại</div>
            </div>
          </div>

          <div className="section-heading"><div><h2>Tiếp tục hành trình</h2><p>Lộ trình được thiết kế theo từng bước từ nền tảng đến chuyên sâu.</p></div><button className="text-button" onClick={() => goToTab('roadmap')}>Xem toàn bộ lộ trình <ChevronRight size={16}/></button></div>
          <div className="stage-list">
            {stageStats.map((stage, index) => <button className="stage-row" key={stage.id} onClick={() => {goToTab('roadmap'); setExpanded(old => old.includes(stage.id) ? old : [...old, stage.id])}}>
              <div className={`stage-number ${stage.percent === 100 ? 'done' : ''}`}>{stage.percent === 100 ? <Check size={17}/> : String(stage.id).padStart(2, '0')}</div>
              <div className="stage-main"><div className="stage-title">{stage.title}</div><div className="stage-sub">{stage.subtitle}</div><div className="mini-track"><div style={{width: `${stage.percent}%`}}/></div></div>
              <div className="stage-meta"><strong>{stage.percent}%</strong><small>{stage.done}/{stage.lessons.length} lessons</small></div><ChevronRight size={17} className="muted"/>
            </button>)}
          </div>
          <div className="bottom-grid">
            <div className="panel next-panel"><div className="panel-title"><div><h3>Gợi ý bước tiếp theo</h3><p>Học theo thứ tự để không bỏ sót kiến thức.</p></div><div className="panel-icon"><Flame size={18}/></div></div>
              {(() => { const next = stages.flatMap(s => s.lessons.map(l => ({...l, stage: s.title}))).find(l => !progress[l.id]); return next ? <div className="next-lesson"><div className="lesson-kicker">{next.stage}</div><strong>{next.title}</strong><p>{next.detail}</p><button className="primary-button" onClick={() => openLesson(next.id)}>Học bài này <ChevronRight size={16}/></button></div> : <div className="empty-state">Bạn đã hoàn thành toàn bộ bài học trong roadmap. Tuyệt vời!</div> })()}
            </div>
            <div className="panel quick-panel"><div className="panel-title"><div><h3>Lối tắt</h3><p>Truy cập nhanh công cụ học tập.</p></div></div>
              <button className="quick-link" onClick={() => setTab('notes')}><div className="quick-icon violet"><FileText size={17}/></div><span><strong>Ghi chú kiến thức</strong><small>Lưu lại điều quan trọng</small></span><ChevronRight size={16}/></button>
              <button className="quick-link" onClick={() => setTab('exercises')}><div className="quick-icon teal"><Code2 size={17}/></div><span><strong>Luyện tập thực hành</strong><small>Áp dụng kiến thức đã học</small></span><ChevronRight size={16}/></button>
              <button className="quick-link" onClick={() => setTab('resources')}><div className="quick-icon amber"><BookOpen size={17}/></div><span><strong>Thư viện tài liệu</strong><small>Nguồn học chính thống</small></span><ChevronRight size={16}/></button>
            </div>
          </div>
        </section>}

        {tab === 'roadmap' && openEntry && <LessonReader
          key={openEntry.lesson.id}
          lesson={openEntry.lesson}
          stage={openEntry.stage}
          position={openEntry.stage.lessons.findIndex(l => l.id === openEntry.lesson.id) + 1}
          total={openEntry.stage.lessons.length}
          completed={!!progress[openEntry.lesson.id]}
          prev={flatLessons[openIndex - 1]}
          next={flatLessons[openIndex + 1]}
          onBack={() => { setExpanded(old => old.includes(openEntry.stage.id) ? old : [...old, openEntry.stage.id]); setOpenLessonId(null) }}
          onToggle={() => toggleLesson(openEntry.lesson.id)}
          onOpen={openLesson}
        />}

        {tab === 'roadmap' && !openEntry && <section>
          <div className="page-heading"><div className="eyebrow"><GraduationCap size={14}/> LEARNING PATH</div><h1>Lộ trình học <span className="accent">.NET</span></h1><p className="lead">{stages.length} giai đoạn dành cho Flutter developer: học C# qua Dart, đi đến xây dựng backend thực tế và kết nối với app Flutter. Bấm vào từng bài để học ngay trên web.</p></div>
          <div className="roadmap-summary"><div><strong>{percent}%</strong><span>hoàn thành tổng lộ trình</span></div><div className="summary-track"><div style={{width: `${percent}%`}}/></div><span className="summary-count">{completedCount}/{totalLessons} lessons</span></div>
          <div className="roadmap-list">
            {stageStats.map(stage => <div className="roadmap-card" key={stage.id}>
              <button className="roadmap-card-head" onClick={() => setExpanded(old => old.includes(stage.id) ? old.filter(x => x !== stage.id) : [...old, stage.id])}>
                <div className={`roadmap-index ${stage.percent === 100 ? 'done' : ''}`}>{stage.percent === 100 ? <Check size={18}/> : `0${stage.id}`}</div>
                <div className="roadmap-info"><div className="roadmap-title">{stage.title}</div><p>{stage.subtitle}</p><div className="roadmap-meta"><span>{stage.lessons.length} bài học</span><span>•</span><span>{stage.duration}</span></div></div>
                <div className="roadmap-progress"><strong>{stage.percent}%</strong><small>{stage.done}/{stage.lessons.length}</small></div>
                {expanded.includes(stage.id) ? <ChevronDown size={19}/> : <ChevronRight size={19}/>}
              </button>
              {expanded.includes(stage.id) && <div className="lesson-list">{stage.lessons.map((lesson, idx) => <div className={`lesson-item ${progress[lesson.id] ? 'completed' : ''}`} key={lesson.id}>
                <button className="check-button" onClick={() => toggleLesson(lesson.id)} aria-label="Đánh dấu hoàn thành">{progress[lesson.id] && <Check size={14}/>}</button>
                <button className="lesson-content lesson-open" onClick={() => openLesson(lesson.id)}>
                  <strong>{String(idx + 1).padStart(2, '0')}. {lesson.title}</strong><p>{lesson.detail}</p>
                  <span className="lesson-minutes">~{lesson.minutes} phút đọc</span>
                </button>
                <span className={`lesson-status ${progress[lesson.id] ? 'is-done' : ''}`}>{progress[lesson.id] ? 'Completed' : 'To do'}</span>
              </div>)}</div>}
            </div>)}
          </div>
        </section>}

        {tab === 'notes' && <section>
          <div className="page-heading"><div className="eyebrow"><FileText size={14}/> KNOWLEDGE BASE</div><h1>Ghi chú <span className="accent">của bạn</span></h1><p className="lead">Lưu lại khái niệm, ví dụ code và những điều bạn muốn ghi nhớ.</p></div>
          <div className="notes-layout">
            <div className="panel note-editor"><div className="panel-title"><div><h3>{editingNote ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới'}</h3><p>Ghi lại kiến thức trong quá trình học.</p></div><div className="panel-icon"><Plus size={18}/></div></div>
              <label>TIÊU ĐỀ</label><input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Ví dụ: Dependency Injection là gì?"/>
              <label>NỘI DUNG</label><textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Viết ghi chú của bạn tại đây..." rows={9}/>
              <div className="editor-actions">{editingNote && <button className="ghost-button" onClick={() => {setEditingNote(null);setNoteTitle('');setNoteContent('')}}>Hủy</button>}<button className="primary-button" onClick={saveNote}><Check size={15}/> {editingNote ? 'Cập nhật ghi chú' : 'Lưu ghi chú'}</button></div>
            </div>
            <div className="notes-list-wrap"><div className="list-toolbar"><div><h3>Ghi chú đã lưu</h3><span>{notes.length} ghi chú</span></div><div className="search-box"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ghi chú..."/></div></div>
              {notes.filter(n => (n.title+n.content).toLowerCase().includes(search.toLowerCase())).length === 0 ? <div className="empty-card"><FileText size={25}/><strong>Chưa có ghi chú</strong><p>Ghi chú đầu tiên của bạn sẽ xuất hiện ở đây.</p></div> :
                notes.filter(n => (n.title+n.content).toLowerCase().includes(search.toLowerCase())).map(note => <article className="note-card" key={note.id}><div className="note-card-top"><span className="note-tag">PERSONAL NOTE</span><div><button className="icon-button" onClick={() => editNote(note)} title="Sửa"><FileText size={15}/></button><button className="icon-button danger" onClick={() => deleteNote(note.id)} title="Xóa"><Trash2 size={15}/></button></div></div><h4>{note.title}</h4><p>{note.content}</p><small>{new Date(note.updatedAt).toLocaleString('vi-VN')}</small></article>)}
            </div>
          </div>
        </section>}

        {tab === 'resources' && <section>
          <div className="page-heading"><div className="eyebrow"><BookOpen size={14}/> RESOURCE LIBRARY</div><h1>Thư viện <span className="accent">tài liệu</span></h1><p className="lead">Ưu tiên tài liệu chính thức và nguồn học có chất lượng.</p></div>
          <div className="resource-grid">{resources.map((r, i) => <article className="resource-card" key={r.title}><div className="resource-top"><div className={`resource-icon color-${i % 4}`}><BookOpen size={19}/></div><span>{r.type}</span></div><h3>{r.title}</h3><p>{r.description}</p><a href={r.url} target="_blank" rel="noreferrer">Mở tài liệu <ExternalLink size={14}/></a></article>)}</div>
        </section>}

        {tab === 'exercises' && <section>
          <div className="page-heading"><div className="eyebrow"><Code2 size={14}/> PRACTICE & PROJECTS</div><h1>Bài tập & <span className="accent">dự án</span></h1><p className="lead">Học bằng cách xây dựng sản phẩm, từ bài tập nhỏ đến dự án tổng hợp.</p></div>
          <div className="exercise-grid">{exercises.map((ex, i) => <article className="exercise-card" key={ex.title}><div className="exercise-top"><span className={`level ${ex.level.toLowerCase()}`}>{ex.level}</span><span className="exercise-number">PROJECT 0{i+1}</span></div><h3>{ex.title}</h3><div className="exercise-stage">{ex.stage}</div><p>{ex.description}</p><div className="exercise-footer"><span>{ex.tasks.length} nhiệm vụ</span><button className="text-button" onClick={() => setSelectedExercise(selectedExercise === i ? null : i)}>{selectedExercise === i ? 'Thu gọn' : 'Xem nhiệm vụ'} <ChevronRight size={15}/></button></div>
              {selectedExercise === i && <div className="task-list">{ex.tasks.map((task, j) => {const key = `${i}-${j}`;return <label key={key} className="task-row"><input type="checkbox" checked={!!exerciseChecks[key]} onChange={e => setExerciseChecks(old => ({...old, [key]: e.target.checked}))}/><span>{task}</span></label>})}</div>}
            </article>)}</div>
        </section>}
        <footer className="footer"><span>© 2026 DotNetHub</span><span>Built for your .NET learning journey <span className="footer-heart">♥</span></span></footer>
      </div>
    </main>
  </div>
}

export default App
