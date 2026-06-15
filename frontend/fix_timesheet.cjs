const fs = require('fs');
const file = 'c:/Users/DINO/Desktop/DINO - Copy/frontend/src/pages/employee/TodayTimesheet.jsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add savedTasks state
content = content.replace(
  '  const [rows, setRows] = useState([emptyRow()]);',
  '  const [rows, setRows] = useState([emptyRow()]);\n  const [savedTasks, setSavedTasks] = useState([]);'
);

// 2. Fix validateRows
content = content.replace('const validateRows = (isSubmit) => {', 'const validateRows = (type) => {');
content = content.replace(
  'if (!r.planned_start || !r.planned_end) {\n        setError(`Row ${rowNum}: Please select planned start and end times.`);\n        return false;\n      }',
  `if (type === 'planned') {
        if (!r.planned_start || !r.planned_end) {
          setError(\`Row \${rowNum}: Please select planned start and end times.\`);
          return false;
        }
      }`
);

content = content.replace('if (isSubmit) {', 'if (type === \'actual\') {');
content = content.replace(
  'setError(`Row ${rowNum}: Please select actual start and end times for final submission.`);',
  'setError(`Row ${rowNum}: Please select actual start and end times.`);'
);

// second isSubmit for actualTotal
content = content.replace('if (isSubmit) {\n      if (actualTotal > 8 * 60) {', 'if (type === \'actual\') {\n      if (actualTotal > 8 * 60) {');

// 3. Replace handleSaveDraft and handleSubmitReport with the decoupled versions
const saveOpsStart = content.indexOf('  const handleSaveDraft = async () => {');
const saveOpsEnd = content.indexOf('  return (\n    <DashboardLayout>');

const newSaveOps = `  const handleSavePlannedTime = async () => {
    if (!validateRows('planned')) return;
    setSaving(true); setError(''); setMessage('');
    try {
      for (const row of rows) {
        const payload = {
          project_name: row.project_name,
          milestone_name: row.milestone_name,
          task_name: row.task_name,
          task_type: 'Development',
          planned_start: row.planned_start || null,
          planned_end: row.planned_end || null,
          actual_start: row.actual_start || null,
          actual_end: row.actual_end || null,
          remarks: row.task_name,
        };
        if (row.isExisting) {
          await updateTimesheet(row.id, payload);
        } else {
          await createTimesheet(payload);
        }
      }
      setMessage('Planned Time Saved Successfully.');
      await loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveActualTime = async () => {
    if (!validateRows('actual')) return;
    setSaving(true); setError(''); setMessage('');
    try {
      for (const row of rows) {
        const payload = {
          project_name: row.project_name,
          milestone_name: row.milestone_name,
          task_name: row.task_name,
          task_type: 'Development',
          planned_start: row.planned_start || null,
          planned_end: row.planned_end || null,
          actual_start: row.actual_start || null,
          actual_end: row.actual_end || null,
          remarks: row.task_name,
        };
        if (row.isExisting) {
          await updateTimesheet(row.id, payload);
        } else {
          await createTimesheet(payload);
        }
      }
      setMessage('Actual Time Saved Successfully.');
      await loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

`;

content = content.substring(0, saveOpsStart) + newSaveOps + content.substring(saveOpsEnd);

// 4. Update loadData to populate savedTasks
const loadDataFind = `        if (allEntries.length === 0) {
          setRows([emptyRow()]);
        } else {
          setRows(
            allEntries.map((e) => ({
              id: e.id,
              isExisting: true,
              project_name: e.project_name,
              milestone_name: e.milestone_name,
              task_name: e.task_name,
              planned_start: e.planned_start ? e.planned_start.substring(0, 5) : '',
              planned_end: e.planned_end ? e.planned_end.substring(0, 5) : '',
              actual_start: e.actual_start ? e.actual_start.substring(0, 5) : '',
              actual_end: e.actual_end ? e.actual_end.substring(0, 5) : '',
              status: e.status,
            }))
          );
        }`;

const loadDataReplace = `        const mapped = allEntries.map((e) => ({
          id: e.id,
          isExisting: true,
          project_name: e.project_name,
          milestone_name: e.milestone_name,
          task_name: e.task_name,
          planned_start: e.planned_start ? e.planned_start.substring(0, 5) : '',
          planned_end: e.planned_end ? e.planned_end.substring(0, 5) : '',
          actual_start: e.actual_start ? e.actual_start.substring(0, 5) : '',
          actual_end: e.actual_end ? e.actual_end.substring(0, 5) : '',
          status: e.status,
        }));

        if (mapped.length > 0) {
          setRows(mapped);
          setSavedTasks(mapped);
        } else {
          setRows([emptyRow()]);
          setSavedTasks([]);
        }`;

content = content.replace(loadDataFind, loadDataReplace);

// 5. Replace the buttons and add the Today's Saved Tasks table
const targetButtons = `                <div className="flex flex-wrap gap-2.5">
                  <button
                    className={\`\${buttonClass.outline} min-h-10\`}
                    disabled={saving || rows.every(r => r.status === 'submitted')}
                    onClick={handleSaveDraft}
                    type="button"
                  >
                    Save as Draft
                  </button>
                  <button
                    className={\`\${buttonClass.primary} min-h-10\`}
                    disabled={saving || rows.every(r => r.status === 'submitted')}
                    onClick={handleSubmitReport}
                    type="button"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                  >
                    <SendHorizontal size={15} /> Submit Report
                  </button>
                </div>
              </div>

            </div>

          </div>`;

const newTable = `                <div className="flex flex-wrap gap-2.5">
                  <button
                    className={\`\${buttonClass.primary} min-h-10 bg-blue-600 hover:bg-blue-700\`}
                    disabled={saving}
                    onClick={handleSavePlannedTime}
                    type="button"
                  >
                    Save Planned Time
                  </button>
                  <button
                    className={\`\${buttonClass.primary} min-h-10 bg-orange-600 hover:bg-orange-700 border-orange-600\`}
                    disabled={saving}
                    onClick={handleSaveActualTime}
                    type="button"
                  >
                    Save Actual Time
                  </button>
                </div>
              </div>
            </div>

            {/* ── Today's Saved Tasks ── */}
            {savedTasks && savedTasks.length > 0 && (
              <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h3 className="font-bold text-slate-800">Today's Saved Tasks</h3>
                  <p className="text-xs text-slate-500 mt-1">Read-only overview of your saved planned and actual tasks for today.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Project</th>
                        <th className="px-4 py-3 font-semibold">Milestone</th>
                        <th className="px-4 py-3 font-semibold">Task</th>
                        <th className="px-4 py-3 font-semibold text-center text-blue-600 border-l border-slate-200" colSpan={3}>Planned Time</th>
                        <th className="px-4 py-3 font-semibold text-center text-orange-600 border-l border-slate-200" colSpan={3}>Actual Time</th>
                        <th className="px-4 py-3 font-semibold text-center border-l border-slate-200">Status</th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wide">
                        <th colSpan={3}></th>
                        <th className="px-2 py-1.5 text-center border-l border-slate-200">From</th>
                        <th className="px-2 py-1.5 text-center">To</th>
                        <th className="px-2 py-1.5 text-center">Duration</th>
                        <th className="px-2 py-1.5 text-center border-l border-slate-200">From</th>
                        <th className="px-2 py-1.5 text-center">To</th>
                        <th className="px-2 py-1.5 text-center">Duration</th>
                        <th className="border-l border-slate-200"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {savedTasks.map((task, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 font-medium">{task.project_name || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{task.milestone_name || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{task.task_name || '—'}</td>
                          
                          <td className="px-2 py-3 text-center text-slate-600 border-l border-slate-100">{formatTimeAMPM(task.planned_start) || '—'}</td>
                          <td className="px-2 py-3 text-center text-slate-600">{formatTimeAMPM(task.planned_end) || '—'}</td>
                          <td className="px-2 py-3 text-center text-blue-600 font-bold bg-blue-50/30">{calculateDuration(task.planned_start, task.planned_end) || '—'}</td>
                          
                          <td className="px-2 py-3 text-center text-slate-600 border-l border-slate-100">{formatTimeAMPM(task.actual_start) || '—'}</td>
                          <td className="px-2 py-3 text-center text-slate-600">{formatTimeAMPM(task.actual_end) || '—'}</td>
                          <td className="px-2 py-3 text-center text-orange-600 font-bold bg-orange-50/30">{calculateDuration(task.actual_start, task.actual_end) || '—'}</td>
                          <td className="px-4 py-3 text-center border-l border-slate-100">
                             <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold \${task.actual_start && task.actual_end ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}\`}>
                               {task.actual_start && task.actual_end ? 'Actual Updated' : 'Planned'}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>`;

content = content.replace(targetButtons, newTable);

fs.writeFileSync(file, content, 'utf-8');
