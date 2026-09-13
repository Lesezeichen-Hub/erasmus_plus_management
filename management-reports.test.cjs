const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = (id, status = 'Aktiv') => ({ id, name: id, status, startDate: '2026-01-01', endDate: '2026-12-31', budget: 100, fundingBudgetId: 'f' });
const state = {
  projects: [project('p1'), project('p2'), project('archive', 'Archiviert')],
  students: [{ id: 's1', name: 'PRIVATE_NAME', projectIds: ['p1', 'p2'] }],
  expenses: [{ projectId: 'p1', amount: 0.1, category: 'Reise', receiptStatus: 'Vorhanden' }, { projectId: 'p1', amount: 0.2, category: 'Reise', receiptStatus: 'Fehlend' }],
  tasks: [{ projectId: 'p1', status: 'Offen', dueDate: '2020-01-01' }],
  fundingBudgets: [{ id: 'f', name: 'Foerderung', amount: 500, status: 'Aktiv' }],
};
const c = vm.createContext({ state, Intl, Date, Set, Map,
  projectStudents: id => state.students.filter(s => s.projectIds.includes(id)),
  effectiveProjectFundingBudgetId: p => p.fundingBudgetId,
  projectOverlapsFundingBudget: () => true,
  isOverdue: date => date < '2026-01-01', missingDocs: () => ['Versicherung'],
  money: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  formatDate: d => d, getTemplateDefaults: () => ({sendingInstitution: 'Testschule'}),
  escapeHtml: s => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch])),
});
vm.runInContext(readFileSync(require('node:path').join(__dirname, 'management-reports.js'), 'utf8'), c);
const rows = c.managementReportRows({});
assert.equal(rows.length, 2);
assert.equal(rows[0].spent, 30);
assert.equal(rows[0].remaining, 9970);
assert.equal(rows[0].missingReceipts, 1);
assert.equal(rows[0].overdue, 1);
assert.equal(c.managementReportRows({from:'2026-12-31',to:'2026-12-31'}).length, 2);
assert.equal(c.managementReportRows({from:'2027-01-01'}).length, 0);
assert.equal(c.managementReportRows({status:'Archiviert'}).length, 1);
assert.equal(c.managementReportRows({includeArchived:'on'}).length, 3);
assert.equal(c.managementReportRows({projectId:'p2'}).length, 1);
for (const type of ['summary', 'finance', 'status']) {
  const html = c.buildManagementReport({reportType:type, comment:'<script>test</script>'}, rows);
  assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
  assert.ok(!html.includes('PRIVATE_NAME'));
  assert.ok(html.includes('<strong>1</strong><span>Zugeordnete'));
  assert.ok(html.includes('size: A4 portrait'));
  if (type === 'finance') assert.ok(html.includes('300,00'), 'Funding allocations include the archived project outside the selection');
}
console.log('OK: cent sums, filters, archive, unique students, funding scope, escaping and all report types');
