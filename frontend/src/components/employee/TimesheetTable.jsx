import { tdClass, thClass } from '../uiClasses';

const TimesheetTable = ({ entries, emptyText = 'No work logs found.' }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {['#', 'Project', 'Milestone', 'Task', 'Planned Hours', 'Actual Hours'].map((header) => (
              <th key={header} className={thClass}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={6}>{emptyText}</td>
            </tr>
          ) : entries.map((entry, index) => (
            <tr key={entry.id} className="transition hover:bg-sky-50/40">
              <td className={`${tdClass} text-slate-400 font-medium`}>{index + 1}</td>
              <td className={tdClass}>{entry.project_name}</td>
              <td className={tdClass}>{entry.milestone_name}</td>
              <td className={tdClass}>{entry.task_name}</td>
              <td className={tdClass}>{entry.planned_hours}</td>
              <td className={tdClass}>{entry.actual_hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TimesheetTable;
