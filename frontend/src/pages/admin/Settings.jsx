import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass } from '../../components/uiClasses';
import { createProject, deleteProject, getAdminProjects } from '../../services/timesheetService';

const Settings = () => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = () => {
    setLoading(true);
    getAdminProjects()
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.response?.data?.detail || 'Unable to load projects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const addProject = async (event) => {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      await createProject({ name, is_active: true });
      setProjectName('');
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Unable to add project.');
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    setError('');
    await deleteProject(project.id);
    loadProjects();
  };

  return (
    <DashboardLayout>
      <Navbar title="Settings" subtitle="Manage timesheet project names" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-950">Project Settings</h1>
              <p className="mt-1 text-sm text-slate-500">These project names appear in the employee Timesheet dropdown.</p>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addProject}>
              <input
                className={inputClass}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                value={projectName}
              />
              <button className={buttonClass.primary} disabled={saving} type="submit">
                <Plus size={16} /> {saving ? 'Adding...' : 'Add Project'}
              </button>
            </form>

            {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-950">Project Names</h2>
            </div>
            {loading ? <Loader text="Loading projects..." /> : (
              <div className="divide-y divide-slate-100">
                {projects.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">No projects added yet.</div>
                ) : projects.map((project) => (
                  <div className="flex items-center justify-between gap-3 px-4 py-3" key={project.id}>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{project.name}</p>
                      <p className="text-xs text-slate-400">{project.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <button className={buttonClass.ghost} onClick={() => removeProject(project)} type="button">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Settings;
