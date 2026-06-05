import { Edit2, Trash2 } from 'lucide-react';
import { Badge, StatusBadge } from '../ui';
import { buttonClass, tdClass, thClass } from '../uiClasses';

const TimesheetTable = ({ entries, onEdit, onDelete, onSubmit, emptyText = 'No work logs found.' }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {['Project', 'Milestone', 'Task', 'Type', 'Planned Hours', 'Actual Hours', 'Status', 'Actions'].map((header) => (
              <th key={header} className={thClass}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={8}>{emptyText}</td>
            </tr>
          ) : entries.map((entry) => (
            <tr key={entry.id} className="transition hover:bg-sky-50/40">
              <td className={tdClass}>{entry.project_name}</td>
              <td className={tdClass}>{entry.milestone_name}</td>
              <td className={tdClass}>{entry.task_name}</td>
              <td className={tdClass}><Badge>{entry.task_type}</Badge></td>
              <td className={tdClass}>{entry.planned_hours}</td>
              <td className={tdClass}>{entry.actual_hours}</td>
              <td className={tdClass}><StatusBadge status={entry.status} /></td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div className="flex gap-2">
                  {onSubmit && entry.status === 'draft' && (
                    <button className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50" onClick={() => onSubmit(entry)} type="button">
                      Submit
                    </button>
                  )}
                  {onEdit && (
                    <button className={buttonClass.ghost} onClick={() => onEdit(entry)} type="button" title="Edit">
                      <Edit2 size={15} />
                    </button>
                  )}
                  {onDelete && (
                    <button className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 transition hover:bg-red-50" onClick={() => onDelete(entry)} type="button" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TimesheetTable;
