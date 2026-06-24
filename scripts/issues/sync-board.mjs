#!/usr/bin/env node
/**
 * Create + sync the "Cutline UI" GitHub Project (v2) board.
 *
 * Works around a bug in gh 2.87.0 where `gh project create` injects a stray
 * `items.query` variable ("Variable $query is used by CreateProjectV2 but not
 * declared") by calling the GraphQL API directly.
 *
 * Idempotent. Run after creating issues to add them to the board:
 *   gh auth refresh -s project,read:project   # one-time, grants scope
 *   node scripts/issues/sync-board.mjs
 *
 * - Ensures the board exists (by title).
 * - Ensures the Status field has columns: Backlog · Ready · In progress · Blocked · Done.
 * - Adds every repo issue to the board.
 * - Sets Status from labels: epic → In progress; blocked:* → Blocked; else Ready.
 *   (Only sets Status for items that don't already have one, so manual moves stick.)
 */
import { execFileSync } from 'node:child_process';

const OWNER = process.env.OWNER || 'gabepsilva';
const REPO = process.env.REPO || 'gabepsilva/Cutline';
const TITLE = process.env.TITLE || 'Cutline UI';

const COLUMNS = [
  ['Backlog', 'GRAY', 'Not started'],
  ['Ready', 'BLUE', 'Unblocked, can be assigned'],
  ['In progress', 'YELLOW', 'Active work'],
  ['Blocked', 'RED', 'Waiting on data, schema, or dependency'],
  ['Done', 'GREEN', 'Merged to master']
];

const gh = (a) => execFileSync('gh', a, { encoding: 'utf8' }).trim();
const gql = (query, vars = {}) => {
  const a = ['api', 'graphql', '-f', `query=${query}`];
  for (const [k, v] of Object.entries(vars)) a.push(typeof v === 'number' ? '-F' : '-f', `${k}=${v}`);
  return JSON.parse(gh(a)).data;
};

// scope check
try {
  gh(['project', 'list', '--owner', OWNER, '--limit', '1']);
} catch {
  console.error("ERROR: gh is missing the 'project' scope. Run: gh auth refresh -s project,read:project");
  process.exit(1);
}

const ownerId = gql('query($l:String!){user(login:$l){id}}', { l: OWNER }).user.id;

// find or create project by title
let projects = gql(
  'query($l:String!){user(login:$l){projectsV2(first:100){nodes{id number title}}}}',
  { l: OWNER }
).user.projectsV2.nodes;
let proj = projects.find((p) => p.title === TITLE);
if (!proj) {
  const created = gql(
    'mutation($o:ID!,$t:String!){createProjectV2(input:{ownerId:$o,title:$t}){projectV2{id number title}}}',
    { o: ownerId, t: TITLE }
  ).createProjectV2.projectV2;
  proj = created;
  console.log(`created board #${proj.number}: ${TITLE}`);
} else {
  console.log(`reusing board #${proj.number}: ${TITLE}`);
}

// link board to the repo so it shows under the repo's Projects tab (idempotent)
try {
  const repoId = gql('query($o:String!,$r:String!){repository(owner:$o,name:$r){id}}', {
    o: OWNER,
    r: REPO.split('/')[1]
  }).repository.id;
  gql('mutation($p:ID!,$r:ID!){linkProjectV2ToRepository(input:{projectId:$p,repositoryId:$r}){repository{name}}}', {
    p: proj.id,
    r: repoId
  });
  console.log(`linked board to ${REPO}`);
} catch {
  /* already linked */
}

// ensure Status columns
const statusField = gql(
  'query($l:String!,$n:Int!){user(login:$l){projectV2(number:$n){field(name:"Status"){... on ProjectV2SingleSelectField{id options{id name}}}}}}',
  { l: OWNER, n: proj.number }
).user.projectV2.field;

let options = statusField.options;
const wanted = COLUMNS.map((c) => c[0]).join(',');
if (options.map((o) => o.name).join(',') !== wanted) {
  const opts = COLUMNS.map(([name, color, description]) => `{name:"${name}",color:${color},description:"${description}"}`).join(',');
  options = gql(
    `mutation($f:ID!){updateProjectV2Field(input:{fieldId:$f,singleSelectOptions:[${opts}]}){projectV2Field{... on ProjectV2SingleSelectField{options{id name}}}}}`,
    { f: statusField.id }
  ).updateProjectV2Field.projectV2Field.options;
  console.log(`set columns: ${options.map((o) => o.name).join(' · ')}`);
}
const optId = (name) => options.find((o) => o.name === name).id;

// current board items
const items = gql(
  'query($l:String!,$n:Int!){user(login:$l){projectV2(number:$n){items(first:100){nodes{id content{... on Issue{number}} fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}',
  { l: OWNER, n: proj.number }
).user.projectV2.items.nodes;
const onBoard = new Map(items.filter((i) => i.content?.number).map((i) => [i.content.number, i]));

// all repo issues with labels
const issues = JSON.parse(gh(['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '300', '--json', 'number,labels']));

const statusFor = (labels) => {
  const names = labels.map((l) => l.name);
  if (names.includes('epic')) return 'In progress';
  if (names.some((n) => n.startsWith('blocked:'))) return 'Blocked';
  return 'Ready';
};

let added = 0;
let set = 0;
for (const iss of issues) {
  let item = onBoard.get(iss.number);
  if (!item) {
    const res = gql('mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}', {
      p: proj.id,
      c: issueNodeId(iss.number)
    });
    item = { id: res.addProjectV2ItemById.item.id, fieldValueByName: null };
    added++;
  }
  if (!item.fieldValueByName) {
    const want = statusFor(iss.labels);
    gql(
      'mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){projectV2Item{id}}}',
      { p: proj.id, i: item.id, f: statusField.id, o: optId(want) }
    );
    set++;
  }
}

function issueNodeId(number) {
  return gql('query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){id}}}', {
    o: OWNER,
    r: REPO.split('/')[1],
    n: number
  }).repository.issue.id;
}

console.log(`board synced: ${added} added, ${set} status set. https://github.com/users/${OWNER}/projects/${proj.number}`);
