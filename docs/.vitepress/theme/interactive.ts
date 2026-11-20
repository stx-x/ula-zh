/**
 * Progressive enhancement for exercises.
 *
 * Two layouts are supported:
 *   A) a "查看解答" details containing options and a nested "查看答案"
 *   B) options (A. B. C. ...) followed by a standalone "查看答案" details
 * Matching exercises ("查看参考配对") get a select-based pairing widget.
 */

const CHOICE_ANSWER = /正确答案[：:]\s*([A-Z](?:\s*[、,，]\s*[A-Z])*)/
const PAIR_ANSWER = /(\d+)\s*[–—\-]\s*([A-Z])/g

type Group = { letter: string; nodes: HTMLElement[] }

function textOf(el: Element | null): string {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim()
}

function make(tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag)
  if (className) el.className = className
  return el
}

function groupOptions(nodes: HTMLElement[]): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  for (const el of nodes) {
    const m = el.tagName === 'P' ? textOf(el).match(/^([A-Z])\./) : null
    if (m) {
      current = { letter: m[1], nodes: [el] }
      groups.push(current)
    } else if (current) {
      current.nodes.push(el)
    }
  }
  return groups
}

function buildChoiceQuiz(groups: Group[], correct: Set<string>): HTMLElement {
  const multi = correct.size > 1
  const wrap = make('div', 'ula-quiz')
  const prompt = make('p', 'ula-quiz-prompt')
  prompt.textContent = multi ? '选择所有正确选项，然后提交。' : '选择一个答案。'
  wrap.appendChild(prompt)

  const list = make('div', 'ula-quiz-options')
  const buttons: HTMLButtonElement[] = []
  const chosen = new Set<string>()
  let solved = false

  const actions = make('div', 'ula-quiz-actions')
  const submitBtn = document.createElement('button')
  submitBtn.type = 'button'
  submitBtn.className = 'ula-quiz-btn primary'
  submitBtn.textContent = '提交'
  submitBtn.disabled = true
  submitBtn.hidden = !multi

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'ula-quiz-btn'
  resetBtn.textContent = '重做'
  resetBtn.hidden = true

  const feedback = make('div', 'ula-quiz-feedback')
  feedback.setAttribute('aria-live', 'polite')

  function markResult() {
    for (const b of buttons) {
      const letter = b.dataset.letter || ''
      b.disabled = true
      if (correct.has(letter)) b.classList.add('is-correct')
      if (chosen.has(letter) && !correct.has(letter)) b.classList.add('is-wrong')
    }
  }

  function evaluate() {
    if (solved) return
    const ok =
      chosen.size === correct.size &&
      Array.from(chosen).every((l) => correct.has(l))
    markResult()
    solved = true
    resetBtn.hidden = false
    submitBtn.hidden = true
    feedback.className = `ula-quiz-feedback ${ok ? 'ok' : 'no'}`
    feedback.textContent = ok
      ? '回答正确。'
      : `再想想。正确答案是 ${Array.from(correct).join('、')}。`
  }

  for (const g of groups) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'ula-opt'
    btn.dataset.letter = g.letter
    btn.innerHTML = g.nodes.map((n) => n.outerHTML).join('')
    btn.addEventListener('click', () => {
      if (btn.disabled) return
      if (!multi) {
        chosen.clear()
        chosen.add(g.letter)
        evaluate()
        return
      }
      if (chosen.has(g.letter)) {
        chosen.delete(g.letter)
        btn.classList.remove('is-selected')
      } else {
        chosen.add(g.letter)
        btn.classList.add('is-selected')
      }
      submitBtn.disabled = chosen.size === 0
    })
    buttons.push(btn)
    list.appendChild(btn)
  }
  wrap.appendChild(list)

  submitBtn.addEventListener('click', evaluate)
  resetBtn.addEventListener('click', () => {
    solved = false
    chosen.clear()
    feedback.textContent = ''
    feedback.className = 'ula-quiz-feedback'
    resetBtn.hidden = true
    submitBtn.hidden = !multi
    submitBtn.disabled = true
    for (const b of buttons) {
      b.disabled = false
      b.classList.remove('is-correct', 'is-wrong', 'is-selected')
    }
  })

  actions.append(submitBtn, resetBtn)
  wrap.appendChild(actions)
  wrap.appendChild(feedback)
  return wrap
}

/* ------------------------------------------------------------ choices */

function enhanceDetailsChoice(details: HTMLDetailsElement): boolean {
  if (details.dataset.quizDone) return false
  const nested = Array.from(details.children).find(
    (el) => el.tagName === 'DETAILS'
  ) as HTMLDetailsElement | undefined
  if (!nested) return false

  const match = textOf(nested).match(CHOICE_ANSWER)
  if (!match) return false
  const correct = new Set(match[1].match(/[A-Z]/g) || [])
  if (!correct.size) return false

  const nodes = Array.from(details.children).filter(
    (el) => el.tagName !== 'DETAILS'
  ) as HTMLElement[]
  const groups = groupOptions(nodes)
  if (groups.length < 2) return false

  details.dataset.quizDone = '1'
  details.replaceWith(buildChoiceQuiz(groups, correct))
  details.closest('.ula-exercise')?.classList.add('is-interactive')
  return true
}

function enhanceStandaloneChoice(root: HTMLElement): boolean {
  if (root.dataset.standaloneDone) return false
  const kids = Array.from(root.children) as HTMLElement[]
  const det = kids.find(
    (el) =>
      el.tagName === 'DETAILS' &&
      textOf(el.querySelector('summary')).includes('查看答案')
  ) as HTMLDetailsElement | undefined
  if (!det) return false

  const match = textOf(det).match(CHOICE_ANSWER)
  if (!match) return false
  const correct = new Set(match[1].match(/[A-Z]/g) || [])
  if (!correct.size) return false

  const detIdx = kids.indexOf(det)
  const start = kids.findIndex(
    (el, i) => i < detIdx && el.tagName === 'P' && /^A\./.test(textOf(el))
  )
  if (start < 0) return false
  const optionNodes = kids.slice(start, detIdx)
  const groups = groupOptions(optionNodes)
  if (groups.length < 2) return false

  root.dataset.standaloneDone = '1'
  const wrap = buildChoiceQuiz(groups, correct)
  root.insertBefore(wrap, optionNodes[0])
  for (const el of optionNodes) el.remove()
  det.remove()
  root.classList.add('is-interactive')
  return true
}

/* ----------------------------------------------------------- matching */

function enhanceMatching(root: HTMLElement): boolean {
  if (root.dataset.matchDone) return false
  const details = Array.from(root.querySelectorAll('details')).find((d) =>
    textOf(d.querySelector('summary')).includes('参考配对')
  )
  if (!details) return false

  const pairs: Record<string, string> = {}
  for (const m of textOf(details).matchAll(PAIR_ANSWER)) {
    pairs[m[1]] = m[2]
  }
  const nums = Object.keys(pairs)
  if (nums.length < 2) return false

  const rightLabel = Array.from(root.querySelectorAll('p')).find(
    (p) => textOf(p) === '右侧'
  )
  if (!rightLabel) return false
  const rightTop = rightLabel.getBoundingClientRect().top + window.scrollY

  const marks = Array.from(root.querySelectorAll('strong')).filter((s) =>
    /^\d+\.$/.test(textOf(s))
  )
  const leftMarks = marks.filter((s) => {
    const p = s.closest('p')
    if (!p) return false
    return p.getBoundingClientRect().top + window.scrollY < rightTop
  })
  if (leftMarks.length < 2) return false

  const letters = Array.from(new Set(nums.map((n) => pairs[n]))).sort()
  const selects = new Map<string, HTMLSelectElement>()

  for (const strong of leftMarks) {
    const num = textOf(strong).replace('.', '')
    const p = strong.closest('p')
    if (!p) continue
    const sel = document.createElement('select')
    sel.className = 'ula-match-select'
    sel.setAttribute('aria-label', `第 ${num} 项配对`)
    const blank = document.createElement('option')
    blank.value = ''
    blank.textContent = '选择'
    sel.appendChild(blank)
    for (const l of letters) {
      const opt = document.createElement('option')
      opt.value = l
      opt.textContent = l
      sel.appendChild(opt)
    }
    p.appendChild(document.createTextNode(' '))
    p.appendChild(sel)
    selects.set(num, sel)
  }

  const wrap = make('div', 'ula-quiz ula-quiz-match')
  const prompt = make('p', 'ula-quiz-prompt')
  prompt.textContent = '为左侧每一项选择右侧对应的字母，然后提交。'
  wrap.appendChild(prompt)

  const actions = make('div', 'ula-quiz-actions')
  const submit = document.createElement('button')
  submit.type = 'button'
  submit.className = 'ula-quiz-btn primary'
  submit.textContent = '提交配对'
  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'ula-quiz-btn'
  reset.textContent = '重做'
  reset.hidden = true
  actions.append(submit, reset)
  wrap.appendChild(actions)

  const feedback = make('div', 'ula-quiz-feedback')
  feedback.setAttribute('aria-live', 'polite')
  wrap.appendChild(feedback)

  let solved = false

  submit.addEventListener('click', () => {
    if (solved) return
    let ok = true
    for (const [num, sel] of selects) {
      const good = sel.value === pairs[num]
      sel.classList.toggle('is-correct', good)
      sel.classList.toggle('is-wrong', !good)
      sel.disabled = true
      if (!good) ok = false
    }
    solved = true
    submit.hidden = true
    reset.hidden = false
    feedback.className = `ula-quiz-feedback ${ok ? 'ok' : 'no'}`
    feedback.textContent = ok ? '配对正确。' : '有配对不正确，绿色为正确项。'
  })

  reset.addEventListener('click', () => {
    solved = false
    submit.hidden = false
    reset.hidden = true
    feedback.textContent = ''
    feedback.className = 'ula-quiz-feedback'
    for (const sel of selects.values()) {
      sel.value = ''
      sel.disabled = false
      sel.classList.remove('is-correct', 'is-wrong')
    }
  })

  details.parentElement?.insertBefore(wrap, details)
  details.hidden = true
  root.classList.add('is-interactive')
  root.dataset.matchDone = '1'
  return true
}

/* -------------------------------------------------------------- setup */

function enhanceAll() {
  if (typeof document === 'undefined') return
  const doc = document.querySelector('.vp-doc')
  if (!doc) return

  for (const det of Array.from(
    doc.querySelectorAll<HTMLDetailsElement>('.ula-exercise details')
  )) {
    if (det.querySelector('summary')?.textContent?.includes('查看解答')) {
      enhanceDetailsChoice(det)
    }
  }

  for (const ex of Array.from(
    doc.querySelectorAll<HTMLElement>('.ula-exercise')
  )) {
    enhanceStandaloneChoice(ex)
    enhanceMatching(ex)
  }
}

let scheduled = false
function schedule() {
  if (scheduled) return
  scheduled = true
  window.setTimeout(() => {
    scheduled = false
    enhanceAll()
  }, 80)
}

export function setupInteractive() {
  if (typeof window === 'undefined') return
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule)
  } else {
    schedule()
  }

  const observer = new MutationObserver(() => schedule())
  const start = () => {
    const app = document.querySelector('#app') || document.body
    observer.observe(app, { childList: true, subtree: true })
    schedule()
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
}
