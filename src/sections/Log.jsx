import React, { useMemo, useState } from 'react'
import { SectionLabel } from './About'
import { education } from '../lib/content'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const toYear = (iso) => {
  const [y, m = 1, d = 1] = iso.split('-').map(Number)
  return y + (m - 1) / 12 + (d - 1) / 365
}
const fmt = (t) => `${MONTHS[Math.floor((t % 1) * 12 + 1e-6)]} ${Math.floor(t)}`

// Short fake commit hash, stable per entry.
const sha = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

// Break a description into diff lines at sentence / clause boundaries.
const toLines = (text = '') => text
  .split(/;\s+|(?<=[.!?])\s+(?=[A-Z])/)
  .map((l) => l.trim().replace(/^and\s+/i, '').replace(/[.;]$/, ''))
  .filter(Boolean)
  .map((l) => l[0].toUpperCase() + l.slice(1))

const LANE_W = 18
const TOP = 40 // fixed-height strip holding each row's node and curves
const NODE_Y = 20
const laneX = (l) => 10 + l * LANE_W

const LANE_KIND = { Work: 0, School: 1 }

const buildLog = (experiences, works) => {
  const entries = []

  experiences.forEach((e) => (e.works || []).forEach((w) => {
    const year = parseInt(e.year, 10)
    const start = w.start ? toYear(w.start) : year + 0.5
    const present = !!w.start && !w.end
    entries.push({
      id: `${w.company}-${w.name}`, kind: 'Work', key: start, start, present, big: !!w.highlight,
      end: w.end ? toYear(w.end) : start,
      title: w.name, org: w.company, desc: w.desc,
      when: w.start ? `${fmt(start)} — ${present ? 'now' : fmt(toYear(w.end))}` : String(year),
    })
  }))

  works.filter((w) => w.start).forEach((w) => {
    const start = toYear(w.start)
    const present = !w.end
    entries.push({
      id: `p-${w.title}`, kind: 'Build', key: start, start, present,
      end: present ? Infinity : toYear(w.end),
      title: w.role || 'Project', org: w.title, desc: w.description,
      live: w.projectLink && !/localhost/.test(w.projectLink) ? w.projectLink : null, code: w.codeLink,
      branch: `feature/${w.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      when: present ? `${fmt(start)} — now` : fmt(start) === fmt(toYear(w.end)) ? fmt(start) : `${fmt(start)} — ${fmt(toYear(w.end))}`,
    })
  })

  // Degrees are commits on an "edu" branch, tagged at graduation (May).
  const grads = [...education].sort((a, b) => a.year - b.year)
  grads.forEach((g, i) => {
    const key = g.year + 4 / 12
    entries.push({
      id: `edu-${g.year}`, kind: 'School', key, start: key, present: false, big: true,
      end: i < grads.length - 1 ? grads[i + 1].year + 4 / 12 - 0.001 : key,
      chained: i < grads.length - 1, fromBelow: i > 0,
      title: g.degree, org: g.school, desc: g.detail,
      tag: `v${g.year}-${g.degree.startsWith('M') ? 'ms' : 'bs'}-cs`, when: `May ${g.year}`,
    })
  })

  // Newest first; ongoing work floats to the top.
  entries.sort((a, b) => (b.present - a.present) || (b.key - a.key))
  entries.forEach((e, i) => { e.row = i })

  // Pack project branches into lanes 2+ so overlapping projects sit side by side.
  const laneEnds = []
  ;[...entries].filter((e) => e.kind === 'Build').sort((a, b) => a.start - b.start).forEach((e) => {
    const gap = e.present ? 0.3 : 0
    let lane = laneEnds.findIndex((end) => end < e.start - gap)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = e.end
    e.lane = 2 + lane
  })
  entries.forEach((e) => { if (e.lane === undefined) e.lane = LANE_KIND[e.kind] })

  // Rows above a branch's own commit that it still runs through.
  entries.forEach((e) => {
    if (e.kind === 'Work') return
    let top = e.row
    for (let k = e.row - 1; k >= 0; k--) {
      if (entries[k].key <= e.end && !(entries[k].lane === e.lane && entries[k].fromBelow)) top = k
      else break
    }
    e.top = top
  })

  // Ongoing branches sit at the top but fork off main at their real start date further down.
  entries.forEach((e) => {
    if (!e.present || e.kind === 'Work') return
    const f = entries.findIndex((x, k) => k > e.row && !x.present && x.key < e.start)
    e.forkRow = f === -1 ? entries.length : f
  })

  const lanes = Math.max(2, 2 + laneEnds.length)
  return { entries, lanes }
}

const LANE_COLOR = (l) => (l === 0 ? 'var(--rec)' : l === 1 ? 'var(--school)' : 'var(--build)')

// The graph cell for one row: fixed top strip (SVG with curves) + stretchy strip (straight lines).
const Graph = ({ row, entries, lanes, isLast }) => {
  const w = laneX(lanes - 1) + 10
  const x0 = laneX(0)
  const top = []
  const fill = []

  // main trunk
  top.push(<line key="m" x1={x0} y1={row === 0 ? NODE_Y : 0} x2={x0} y2={TOP} stroke={LANE_COLOR(0)} />)
  if (!isLast) fill.push(0)

  entries.forEach((e) => {
    if (e.kind === 'Work') return
    const x = laneX(e.lane)
    const c = LANE_COLOR(e.lane)
    const mY = row === 0 ? NODE_Y : 0 // where a merge meets main
    if (e.present) {
      if (row === e.row) {
        top.push(<line key={`u${e.id}`} x1={x} y1={0} x2={x} y2={TOP} stroke={c} />)
        fill.push(e.lane)
      } else if (row < e.row || (row > e.row && row < e.forkRow)) {
        top.push(<line key={`p${e.id}`} x1={x} y1={0} x2={x} y2={TOP} stroke={c} />)
        fill.push(e.lane)
      } else if (row === e.forkRow) {
        top.push(<path key={`fk${e.id}`} d={`M${x} 0 C${x} 14, ${x0} ${NODE_Y - 14}, ${x0} ${NODE_Y}`} stroke={c} fill="none" />)
      }
      return
    }
    if (e.row === row) {
      const continuesUp = e.top < e.row
      if (continuesUp) top.push(<line key={`u${e.id}`} x1={x} y1={0} x2={x} y2={NODE_Y} stroke={c} />)
      else top.push(<path key={`mg${e.id}`} d={`M${x} ${NODE_Y} C${x} ${NODE_Y - 12}, ${x0} ${10}, ${x0} ${mY}`} stroke={c} fill="none" />)
      if (e.fromBelow) {
        top.push(<line key={`d${e.id}`} x1={x} y1={NODE_Y} x2={x} y2={TOP} stroke={c} />)
        fill.push(e.lane)
      } else {
        top.push(<path key={`fk${e.id}`} d={`M${x0} ${TOP} C${x0} ${TOP - 10}, ${x} ${NODE_Y + 12}, ${x} ${NODE_Y}`} stroke={c} fill="none" />)
      }
    } else if (row >= e.top && row < e.row) {
      fill.push(e.lane)
      const mergesHere = row === e.top && !e.chained
      if (mergesHere) {
        top.push(<path key={`mg${e.id}`} d={`M${x} ${TOP} L${x} ${NODE_Y + 4} C${x} ${6}, ${x0} ${10}, ${x0} ${mY}`} stroke={c} fill="none" />)
      } else {
        top.push(<line key={`p${e.id}`} x1={x} y1={0} x2={x} y2={TOP} stroke={c} />)
      }
    }
  })

  const me = entries[row]
  return (
    <div className="log__graph" style={{ width: w }} aria-hidden="true">
      <svg width={w} height={TOP} className="log__svg">
        <g strokeWidth="2" strokeLinecap="round">{top}</g>
        {me.big && <circle cx={laneX(me.lane)} cy={NODE_Y} r={9} fill="none" stroke={LANE_COLOR(me.lane)} strokeOpacity="0.4" />}
        <circle
          cx={laneX(me.lane)} cy={NODE_Y}
          r={me.present || me.big ? 6 : me.kind === 'Build' ? 3.2 : 4.5}
          fill={me.present || me.big ? LANE_COLOR(me.lane) : 'var(--ink)'}
          stroke={LANE_COLOR(me.lane)} strokeWidth="2"
          className={me.present ? 'log__node--live' : ''}
        />
      </svg>
      <div className="log__fill">
        {fill.map((l) => <i key={l} style={{ left: laneX(l) - 1, background: LANE_COLOR(l) }} />)}
      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all', label: '--all' },
  { id: 'Work', label: 'main' },
  { id: 'Build', label: 'feature/*' },
  { id: 'School', label: 'edu' },
]

const Log = ({ experiences, works }) => {
  const { entries, lanes } = useMemo(() => buildLog(experiences, works), [experiences, works])
  const [open, setOpen] = useState({})
  const [filter, setFilter] = useState('all')
  const active = entries.filter((e) => e.present).length
  const since = entries.length ? Math.floor(Math.min(...entries.map((e) => e.start))) : ''

  return (
    <section id="timeline" className="log section">
      <SectionLabel n={4}>Commit Log</SectionLabel>

      <div className="log__head">
        <h2 className="display" data-reveal>Commit <em>history</em></h2>
        <div className="log__meta" data-reveal>
          <p className="mono log__cmd"><span>$</span> git log --graph --author="Arshia Behzad"</p>
          <p className="mono log__stats">
            {entries.length} commits · <b>{active} active branches</b> · since {since}
          </p>
          <div className="tuner" role="group" aria-label="Highlight branch">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={filter === f.id ? 'is-active' : ''}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                data-cursor="CHECKOUT"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ol className="log__list" data-reveal>
        {entries.map((e, i) => {
          const featured = e.present
          const school = e.kind === 'School'
          const expanded = featured || e.big || open[e.id]
          const dim = filter !== 'all' && filter !== e.kind
          const lines = toLines(e.desc)
          return (
            <li
              key={e.id}
              className={`commit commit--${e.kind.toLowerCase()} ${featured ? 'commit--head' : ''} ${e.big ? 'commit--big' : ''} ${expanded ? 'is-open' : ''} ${dim ? 'is-dim' : ''}`}
            >
              <Graph row={i} entries={entries} lanes={lanes} isLast={i === entries.length - 1} />
              <div className="commit__main">
                <button
                  className="commit__line"
                  onClick={() => !featured && !e.big && setOpen({ ...open, [e.id]: !open[e.id] })}
                  aria-expanded={e.big ? undefined : expanded}
                  disabled={featured || e.big}
                  data-cursor={featured ? 'HEAD' : expanded ? 'CLOSE' : 'GIT SHOW'}
                >
                  <span className="commit__sha mono">{sha(e.id)}</span>
                  <span className="commit__refs mono">
                    {i === 0 && <em className="ref ref--head">HEAD → main</em>}
                    {e.branch && <em className="ref ref--build">{e.branch}</em>}
                    {e.tag && <em className="ref ref--tag">tag: {e.tag}</em>}
                    {featured && i !== 0 && <em className="ref ref--live">● active</em>}
                  </span>
                  <span className="commit__msg">
                    <strong>{e.org}</strong>
                    <span className="commit__role">{e.title}</span>
                  </span>
                  <span className="commit__when mono">{e.when}</span>
                </button>

                {school && <p className="commit__detail">{e.desc}</p>}

                {expanded && !school && (
                  <div className="commit__diff">
                    <p className="mono commit__hunk">@@ {e.kind === 'Build' ? e.branch : e.kind === 'School' ? 'edu' : 'main'} · {e.when} @@</p>
                    <ul>
                      {lines.map((l) => <li key={l}><span className="mono">+</span>{l}</li>)}
                    </ul>
                    {(e.live || e.code) && (
                      <div className="commit__links">
                        {e.live && <a className="btn btn--solid" href={e.live} target="_blank" rel="noreferrer" data-cursor="VISIT">Live ↗</a>}
                        {e.code && <a className="btn" href={e.code} target="_blank" rel="noreferrer" data-cursor="SOURCE">Source ↗</a>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mono log__end">(END)</p>
    </section>
  )
}

export default Log
