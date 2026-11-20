/**
 * Progressive enhancement for exercises.
 *
 * The translated pages contain static exercise blocks:
 *   - multiple-choice options (A. B. C. ...) plus a nested "查看答案" details
 *   - matching exercises plus a "查看参考配对" details
 *
 * This module turns them into interactive widgets in the browser without
 * touching the Markdown sources.
 */

const CHOICE_ANSWER = /正确答案[：:]\s*([A-Z](?:\s*[、,，]\s*[A-Z])*)/
const PAIR_ANSWER = /(\d+)\s*[–—\-]\s*([A-Z])/g

function textOf(el: Element | null): string {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim()
}

function make(tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag)
  if (className) el.className = className
  return el
}

/* ------------------------------------------------------------ choices */

function enhanceChoice(details: HTMLDetailsElement): boolean {
  if (details.dataset.quizDone) return false
  const nested = Array.from(details.children).find(
    (el) => el.tagName === 'DETAILS'
  ) as HTMLDetailsElement | undefined
  if (!nested) return false

  const match = textOf(nested).match(CHOICE_ANSWER)
  if (!match) return false
  const correct = new Set(match[1].match(/[A-Z]/g) || [])
  if (!correct.size) return false

  const options = Array.from(details.children).filter((el) => {
    if (el.tagName !== 'P') return false
    return /^[A-Z]\./.test(textOf(el))
  }) as HTMLElement[]
  if (options.length < 2) return false

  details.dataset.quizDone = '1'
  const multi = correct.size > 1

  const wrap = make('div', 'ula-quiz')
  const prompt = make('p', 'ula-quiz-prompt')
  prompt.textContent = multi ? '选择所有正确选项，然后提交。' : '选择一个答案。'
  wrap.appendChild(prompt)

  const list = make('div', 'ula-quiz-options')
  const buttons: HTMLButtonElement[] = []
  const chosen = new Set<string>()

  for (const p of options) {
    const letter = textOf(p).charAt(0)
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'ula-opt'
    btn.dataset.letter = letter
    btn.innerHTML = p.innerHTML
    btn.addEventListener('click', () => {
      if (btn.disabled) return
      if (!multi) {
        chosen.clear()
        chosen.add(letter)
        evaluate()
        return
      }
      if (chosen.has(letter)) {
        chosen.delete(letter)
        btn.classList.remove('is-selected')
      } else {
        chosen.add(letter)
        btn.classList.add('is-selected')
      }
      submitBtn.disabled = chosen.size === 0
    })
    buttons.push(btn)
    list.appendChild(btn)
  }
  wrap.appendChild(list)

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
  const revealBtn = document.createElement('button')
  revealBtn.type = 'button'
  revealBtn.className = 'ula-quiz-btn ghost'
  revealBtn.textContent = '显示答案'
  revealBtn.hidden = true

  actions.append(submitBtn, resetBtn, revealBtn)
  wrap.appendChild(actions)

  const feedback = make('div', 'ula-quiz-feedback')
  feedback.setAttribute('aria-live', 'polite')
  wrap.appendChild(feedback)

  let solved = false

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
    revealBtn.hidden = true
    submitBtn.hidden = true
    feedback.className = `ula-quiz-feedback ${ok ? 'ok' : 'no'}`
    feedback.textContent = ok
      ? '回答正确。'
      : `再想想。正确答案是 ${Array.from(correct).join('、')}。`
  }

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

  revealBtn.addEventListener('click', () => {
    feedback.className = 'ula-quiz-feedback'
    feedback.textContent = `正确答案：${Array.from(correct).join('、')}`
  })

  details.replaceWith(wrap)
  details.closest('.ula-exercise')?.classList.add('is-interactive')
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

  const letters = Array.from(
    new Set(nums.map((n) => pairs[n]))
  ).sort()
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
      const right = pairs[num]
      const good = sel.value === right
      sel.classList.toggle('is-correct', good)
      sel.classList.toggle('is-wrong', !good)
      sel.disabled = true
      if (!good) ok = false
    }
    solved = true
    submit.hidden = true
    reset.hidden = false
    feedback.className = `ula-quiz-feedback ${ok ? 'ok' : 'no'}`
    feedback.textContent = ok
      ? '配对正确。'
      : '有配对不正确，绿色为正确项。'
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
      enhanceChoice(det)
    }
  }

  for (const ex of Array.from(
    doc.querySelectorAll<HTMLElement>('.ula-exercise')
  )) {
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
