#!/usr/bin/env node
/**
 * Cutline issue generator — the "issue creation loop".
 *
 * Single source of truth: PLANNING.md → "## Issue inventory" tables.
 * This script parses those tables (in priority/dependency order), composes a
 * self-contained issue body per the templates, and creates GitHub issues via
 * `gh`. Per-issue scope can be enriched in scope.json without touching the plan.
 *
 * Idempotent: an issue is skipped if pid-map.json already records it OR a repo
 * issue already carries its `pid:<ID>` label.
 *
 * Usage:
 *   node create-issues.mjs --list                 # show parsed, ordered inventory
 *   node create-issues.mjs --pids T-00,M1-01      # create specific PIDs
 *   node create-issues.mjs --from 1 --to 2        # create the first 2 (1-indexed, by priority order)
 *   node create-issues.mjs --all                  # create every issue
 *   node create-issues.mjs --pids T-00 --dry-run  # print body, create nothing
 *   node create-issues.mjs --pids T-00 --update   # refresh title+body of an already-created issue
 *   node create-issues.mjs --relink               # rewrite "Blocked by" with resolved #numbers
 *
 * Env: REPO (default gabepsilva/Cutline), PLAN (default ../../PLANNING.md)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.REPO || 'gabepsilva/Cutline';
const PLAN = process.env.PLAN || resolve(__dirname, '../../PLANNING.md');
const MAP_FILE = resolve(__dirname, 'pid-map.json');
const SCOPE_FILE = resolve(__dirname, 'scope.json');
const DESIGN = 'design-by-claude/Cutline.dc.html';

// ---------- args ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
	const i = args.indexOf(f);
	return i >= 0 ? args[i + 1] : undefined;
};
const DRY = has('--dry-run');
const UPDATE = has('--update');

// ---------- helpers ----------
const sh = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8' }).trim();
const loadJSON = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : d);
const saveMap = (m) => writeFileSync(MAP_FILE, JSON.stringify(m, null, 2) + '\n');

const pidMap = loadJSON(MAP_FILE, {});
const scopeBook = loadJSON(SCOPE_FILE, {});

const milestoneTitles = {
	M0: 'M0 — Test infrastructure',
	M1: 'M1 — Foundation',
	M2: 'M2 — Layout shells',
	M3: 'M3 — Auth UI',
	M4: 'M4 — Dashboard (data-backed)',
	M5: 'M5 — Editor (data-backed)',
	M6: 'M6 — Editor features (data-backed)'
};

const milestoneOf = (id) => (id.startsWith('T-') ? 'M0' : 'M' + id[1]);
const stripTicks = (s) => s.replace(/`/g, '').trim();
const cell = (s) => s.trim();

// expand "M2-01–M2-04" style ranges + comma lists into PID arrays
function parseDeps(raw) {
	const text = stripTicks(raw).replace(/—|–/g, (m) => (m === '—' ? '' : '\u2013'));
	if (!text || /^-+$/.test(text.trim())) return { pids: [], notes: [] };
	const pids = new Set();
	const notes = [];
	for (let part of text.split(',')) {
		part = part.trim();
		if (!part) continue;
		const range = part.match(/^(T-|M\d-)(\d+)[a-z]?\u2013(?:(T-|M\d-))?(\d+)[a-z]?$/);
		const single = part.match(/^(T-\d+|M\d-\d+[a-z]?)$/);
		if (range) {
			const prefix = range[1];
			const a = parseInt(range[2], 10);
			const b = parseInt(range[4], 10);
			for (let n = a; n <= b; n++) pids.add(prefix + String(n).padStart(2, '0'));
		} else if (single) {
			pids.add(single[1]);
		} else {
			notes.push(part); // e.g. "Schema PR"
		}
	}
	return { pids: [...pids], notes };
}

// ---------- parse PLANNING.md inventory ----------
function parseInventory() {
	const md = readFileSync(PLAN, 'utf8');
	const start = md.indexOf('## Issue inventory');
	const end = md.indexOf('## Dependency graph');
	const section = md.slice(start, end > 0 ? end : undefined);
	const lines = section.split('\n');

	const issues = [];
	let header = null;
	for (const line of lines) {
		if (!line.trim().startsWith('|')) {
			// header table boundary reset on non-table lines (but keep last header for contiguous tables)
			if (line.startsWith('### ') || line.startsWith('## ')) header = null;
			continue;
		}
		const cells = line.split('|').slice(1, -1).map(cell);
		const isSep = cells.every((c) => /^-+$/.test(c.replace(/\s/g, '')));
		if (isSep) continue;
		if (cells[0] === 'ID') {
			header = cells;
			continue;
		}
		if (!header) continue;
		if (!/^(T-\d+|M\d-\d+[a-z]?)$/.test(cells[0])) continue;
		const row = {};
		header.forEach((h, i) => (row[h] = cells[i] ?? ''));
		issues.push(row);
	}

	// design line ranges from "**<PID> design ref:** ... <range>"
	const lineRefs = {};
	const refRe = /\*\*([TM][\w-]+) design ref:\*\*[^\n]*?(\d+\s*[–-]\s*\d+)/g;
	let m;
	while ((m = refRe.exec(md))) lineRefs[m[1]] = m[2].replace(/\s/g, '');

	return issues.map((row) => {
		const id = row['ID'];
		const ms = milestoneOf(id);
		const labels = stripTicks(row['Labels'] || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const files = stripTicks(row['Target file(s)'] || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const deps = parseDeps(row['Depends on'] || '');
		return {
			id,
			ms,
			title: stripTicks(row['Title'] || '').replace(/\*\*/g, ''),
			labels,
			files,
			deps,
			data: row['Data required'] ? stripTicks(row['Data required']) : '',
			status: stripTicks(row['Status'] || ''),
			lines: lineRefs[id] || ''
		};
	});
}

// ---------- classify ----------
function typeOf(it) {
	if (it.id.startsWith('T-')) return 'infra';
	if (it.id === 'M1-01' || it.id === 'M1-02') return 'style';
	if (it.id === 'M1-14') return 'infra';
	const svelte = it.files.some(
		(f) => f.endsWith('.svelte') || f.endsWith('/*.svelte') || f.includes('*.svelte')
	);
	const route = it.files.some((f) => f.includes('+page.server') || f.includes('+page.svelte'));
	if (route && it.labels.includes('size:compose')) return 'data';
	if (svelte) return 'component';
	if (it.files.every((f) => f.endsWith('.ts') || f.endsWith('.css') || f.includes('*.ts')))
		return 'util';
	return 'component';
}

// ---------- body composition ----------
function header(it) {
	const sc = scopeBook[it.id] || {};
	const blockedBy =
		it.deps.pids.length || it.deps.notes.length
			? [
					...it.deps.pids.map((p) => (pidMap[p] ? `${p} (#${pidMap[p]})` : p)),
					...it.deps.notes
				].join(', ')
			: '—';
	const readFirst =
		typeOf(it) === 'util' || typeOf(it) === 'infra'
			? 'Agent runbook & conventions · Testing strategy · Shared type contracts'
			: 'Agent runbook & conventions · Design → Svelte translation guide · Design tokens reference · Shared type contracts · Reading the design file';
	void sc;
	return [
		`> **Planning-ID:** \`${it.id}\`  ·  **Milestone:** \`${it.ms}\``,
		`> **Read first** in \`PLANNING.md\`: ${readFirst}`,
		it.lines
			? `> **Design source:** \`${DESIGN}\` (lines ${it.lines})`
			: `> **Design source:** \`${DESIGN}\``,
		`> **Blocked by:** ${blockedBy}`
	].join('\n');
}

const goalOf = (it, fallback) => (scopeBook[it.id] && scopeBook[it.id].goal) || fallback;

function scopeList(it, fallback) {
	const sc = scopeBook[it.id] || {};
	const items = sc.scope && sc.scope.length ? sc.scope : fallback;
	return items.map((s) => `- ${s}`).join('\n');
}

function filesList(it) {
	return it.files.map((f) => `- \`${f}\``).join('\n') || '- _see PLANNING.md target files_';
}

const TQR_COMPONENT = `## Test quality review (required before merge)

- [ ] **Traceability:** each \`it(...)\` maps to a "Tests to write" row or acceptance criterion
- [ ] **Failure test:** removing the feature breaks at least one test
- [ ] **No hollow assertions:** no \`expect(true).toBe(true)\` / mount-only \`toBeDefined()\`
- [ ] **Real interactions:** \`click\` / \`keyboard\` / \`fill\` — not direct handler calls
- [ ] **Meaningful fixtures:** \`src/lib/test/fixtures/*\` (prod mocks live in \`src/lib/mocks/*\`)
- [ ] **Coverage:** meets milestone target (or \`N/A (pre-T-01)\` if merged before the coverage gate lands)`;

const SVELTE_CHECK = `## Svelte checklist (AGENTS.md)

- [ ] **Svelte MCP:** \`svelte-autofixer\` clean on changed \`.svelte\` files
- [ ] \`$props()\` with typed props · BEM class names · keyed \`{#each}\`
- [ ] \`{#snippet}\`/\`{@render}\` for slots where applicable
- [ ] Interactive elements are \`<button>\`/\`<a>\` with a11y labels
- [ ] File within size target; split if needed`;

function bodyComponent(it) {
	return `${header(it)}

## Goal
${goalOf(it, `Implement \`${it.title}\` from the Claude design as a presentational Svelte 5 component (props in, callbacks out).`)}

## Design reference
- \`${DESIGN}\`${it.lines ? ` lines ${it.lines}` : ''}

## Target files
${filesList(it)}

## Scope
${scopeList(it, [
	'Translate the design region per the Design → Svelte translation guide (BEM, clsx variants, keyed lists).',
	'No backend wiring; consume data via typed props only.',
	'Use design tokens (M1-01) — no hardcoded hex; no ported inline-style strings.'
])}

${SVELTE_CHECK}

## Tests to write
| Test | Asserts |
|------|---------|
| renders default | visible text/role/structure from design |
| variant/prop | output changes on prop change |
| interaction | \`click\`/\`keyboard\` → callback fires / DOM updates |
| a11y | role, \`aria-*\`, labelled control |
| empty/null props | graceful, no crash |

${TQR_COMPONENT}

## Acceptance criteria
- [ ] Matches design tokens; presentational (props in / callbacks out)
- [ ] Co-located \`*.svelte.spec.ts\` passes (\`bun run test:unit -- --run\`)
- [ ] \`svelte-autofixer\` clean; \`bun run check\` + \`bun run lint\` pass
- [ ] Test quality review checked; PR links this issue`;
}

function bodyData(it) {
	return `${header(it)}

## Goal
${goalOf(it, `Wire \`${it.title}\` to real server data (thin route composition + server \`load\`).`)}

## Design reference
- \`${DESIGN}\`${it.lines ? ` lines ${it.lines}` : ''}

## Data required
${(it.data ? [it.data] : ['See PLANNING.md']).map((d) => `- [ ] ${d}`).join('\n')}

## Target files
${filesList(it)}

## Scope
${scopeList(it, [
	'Server `load` returns real DB data — or documented mocks from `$lib/mocks/*` with `MOCK:` + `TODO(backend)` during the UI phase.',
	'Page is thin composition (~50–80 lines); empty state uses `EmptyState` (M1-13).'
])}

## Tests to write
| Layer | File | Asserts |
|-------|------|---------|
| Server | \`+page.server.spec.ts\` | empty DB → \`[]\`; seeded → shape; unauthorized → redirect/error |
| E2E | \`<flow>.e2e.ts\` | login → navigate → assert real/empty state (no hardcoded placeholder) |

${TQR_COMPONENT}

## Acceptance criteria
- [ ] \`load\` returns real data or documented mocks (issue stays open until backend replaces them)
- [ ] Empty state covered; route is thin composition
- [ ] Tests pass; quality review checked; PR links this issue`;
}

function bodyUtil(it) {
	return `${header(it)}

## Goal
${goalOf(it, `Implement \`${it.title}\` as pure, DOM-free, fully tested code.`)}

## Target files
${filesList(it)}

## Scope
${scopeList(it, [
	'Pure functions / typed model derived from the Shared type contracts in PLANNING.md.',
	'No DOM, no `$effect` mutating derived state — prefer `$derived`.'
])}

## Tests to write (table-driven)
| Case | Input | Expected |
|------|-------|----------|
| normal | … | … |
| boundary | … | … |
| invalid | … | graceful |

## Test quality review (required before merge)
- [ ] One test per public function for normal + boundary input
- [ ] Wrong math/formula fails tests
- [ ] Node environment (no DOM)
- [ ] Coverage meets area target (or \`N/A (pre-T-01)\`)

## Acceptance criteria
- [ ] \`*.spec.ts\` passes (\`bun run test:unit -- --run\`)
- [ ] Test quality review checked; PR links this issue`;
}

function bodyStyle(it) {
	return `${header(it)}

## Goal
${goalOf(it, `Extract \`${it.title}\` into shared CSS — the single source of truth consumed by all components.`)}

## Design reference
- \`${DESIGN}\`${it.lines ? ` lines ${it.lines}` : ''}
- Use the **Design tokens reference (extracted)** section of PLANNING.md as the canonical token list.

## Target files
${filesList(it)}

## Scope
${scopeList(it, [
	'Define CSS custom properties for every token in the reference; derive accent/danger tints from `--accent` via `color-mix` where possible.',
	'No component markup; values consumed via `var(--token)` elsewhere — never hardcoded hex downstream.'
])}

## Acceptance criteria
- [ ] All tokens from the reference are present with the documented names
- [ ] \`bun run lint\` passes; no hardcoded hex introduced downstream
- [ ] Publishes the final token names before dependent issues (M1-04+) start
- [ ] PR links this issue`;
}

function bodyInfra(it) {
	return `${header(it)}

## Goal
${goalOf(it, it.title)}

## Target files
${filesList(it)}

## Scope
${scopeList(it, ['See PLANNING.md → Testing strategy and the T-* notes for exact requirements.'])}

## Acceptance criteria
- [ ] Commands run and pass locally and in CI
- [ ] Gate enforced where applicable; dev-loop change documented in AGENTS.md/README
- [ ] PR links this issue`;
}

function bodyEpic() {
	return `## Summary
Tracking issue for implementing the Claude design (\`${DESIGN}\`) as structured Svelte 5 components.

## Reference
- Implementation plan: \`PLANNING.md\`
- Design source: \`${DESIGN}\`
- Conventions: \`AGENTS.md\`

## Milestones
- M0 Test infrastructure · M1 Foundation · M2 Layout shells · M3 Auth UI · M4 Dashboard · M5 Editor · M6 Editor features

## Child issues
_Created incrementally; checked off as they merge._

## Planning-ID → GitHub # map
| Planning ID | GitHub # | Planning ID | GitHub # |
|-------------|----------|-------------|----------|
| _(filled as issues are created)_ | | | |`;
}

function composeBody(it) {
	switch (typeOf(it)) {
		case 'data':
			return bodyData(it);
		case 'util':
			return bodyUtil(it);
		case 'style':
			return bodyStyle(it);
		case 'infra':
			return bodyInfra(it);
		default:
			return bodyComponent(it);
	}
}

// ---------- gh actions ----------
function ensureLabel(name, color = 'ededed', desc = '') {
	if (DRY) return;
	try {
		execFileSync(
			'gh',
			['label', 'create', name, '--color', color, '--description', desc, '--force', '--repo', REPO],
			{
				stdio: 'ignore'
			}
		);
	} catch {
		/* ignore */
	}
}

function existingPidIssue(id) {
	if (pidMap[id]) return pidMap[id];
	try {
		const out = sh('gh', [
			'issue',
			'list',
			'--repo',
			REPO,
			'--label',
			`pid:${id}`,
			'--state',
			'all',
			'--json',
			'number',
			'--jq',
			'.[0].number'
		]);
		return out ? parseInt(out, 10) : null;
	} catch {
		return null;
	}
}

function createIssue(it) {
	const title = `${it.id}: ${it.title}`;
	const body = composeBody(it);
	const labels = [...new Set([...it.labels, `pid:${it.id}`])];

	const existing = existingPidIssue(it.id);
	if (existing) {
		pidMap[it.id] = existing;
		if (!UPDATE) {
			console.log(`skip  ${it.id} (already #${existing})`);
			return;
		}
		if (DRY) {
			console.log(`\n===== DRY UPDATE #${existing} ${title} =====\n${body}`);
			return;
		}
		ensureLabel(`pid:${it.id}`, 'd0d7de', `Planning ID ${it.id}`);
		for (const l of it.labels) ensureLabel(l);
		const ea = [
			'issue',
			'edit',
			String(existing),
			'--repo',
			REPO,
			'--title',
			title,
			'--body',
			body,
			'--milestone',
			milestoneTitles[it.ms]
		];
		for (const l of labels) ea.push('--add-label', l);
		sh('gh', ea);
		saveMap(pidMap);
		console.log(`update ${it.id} → #${existing}`);
		return;
	}

	if (DRY) {
		console.log(`\n===== DRY ${title} =====`);
		console.log(`labels: ${labels.join(', ')} | milestone: ${milestoneTitles[it.ms]}`);
		console.log(body);
		return;
	}

	ensureLabel(`pid:${it.id}`, 'd0d7de', `Planning ID ${it.id}`);
	for (const l of it.labels) ensureLabel(l);

	const a = [
		'issue',
		'create',
		'--repo',
		REPO,
		'--title',
		title,
		'--body',
		body,
		'--milestone',
		milestoneTitles[it.ms]
	];
	for (const l of labels) a.push('--label', l);
	const url = sh('gh', a);
	const num = parseInt(url.split('/').pop(), 10);
	pidMap[it.id] = num;
	saveMap(pidMap);
	console.log(`create ${it.id} → #${num}  ${url}`);
}

function createEpic() {
	if (pidMap['EPIC']) {
		console.log(`skip  EPIC (already #${pidMap['EPIC']})`);
		return;
	}
	if (DRY) {
		console.log('\n===== DRY Epic =====\n' + bodyEpic());
		return;
	}
	ensureLabel('epic', '3e1f92', 'Parent / tracking issue');
	const url = sh('gh', [
		'issue',
		'create',
		'--repo',
		REPO,
		'--title',
		'Epic: Implement Claude design in Svelte',
		'--body',
		bodyEpic(),
		'--label',
		'epic',
		'--label',
		'ui'
	]);
	pidMap['EPIC'] = parseInt(url.split('/').pop(), 10);
	saveMap(pidMap);
	console.log(`create EPIC → #${pidMap['EPIC']}  ${url}`);
}

// ---------- main ----------
const inventory = parseInventory();

if (has('--list')) {
	inventory.forEach((it, i) =>
		console.log(
			`${String(i + 1).padStart(2)}  ${it.id.padEnd(7)} ${it.ms}  [${typeOf(it)}]  ${it.title}` +
				(it.deps.pids.length ? `  ⟵ ${it.deps.pids.join(',')}` : '')
		)
	);
	console.log(`\nTotal: ${inventory.length} issues (+ epic).`);
	process.exit(0);
}

if (has('--epic')) createEpic();

let selected = [];
if (has('--all')) selected = inventory;
else if (val('--pids')) {
	const want = val('--pids')
		.split(',')
		.map((s) => s.trim());
	selected = want.map((p) => inventory.find((it) => it.id === p)).filter(Boolean);
} else if (val('--from')) {
	const from = parseInt(val('--from'), 10) - 1;
	const to = val('--to') ? parseInt(val('--to'), 10) : from + 1;
	selected = inventory.slice(from, to);
}

if (!selected.length && !has('--epic')) {
	console.log('Nothing selected. Use --list, --epic, --pids, --from/--to, or --all.');
	process.exit(0);
}

for (const it of selected) createIssue(it);
console.log(`\nDone. PID map: ${MAP_FILE}`);
