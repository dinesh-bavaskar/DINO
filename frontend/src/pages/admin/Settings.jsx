import { useEffect, useState } from 'react';
import { Plus, Trash2, Flag } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass } from '../../components/uiClasses';
import {
  createProject, deleteProject, getAdminProjects,
  createMilestone, deleteMilestone, getAdminMilestones,
} from '../../services/timesheetService';

const Settings = () => {
  // ── Projects ──────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [projectError, setProjectError] = useState('');

  // ── Milestones ────────────────────────────────────────────
  const [milestones, setMilestones] = useState([]);
  const [milestoneProject, setMilestoneProject] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState('');

  // ── Data loaders ──────────────────────────────────────────
  const loadProjects = () => {
    setLoadingProjects(true);
    getAdminProjects()
      .then((res) => setProjects(res.data))
      .catch((err) => setProjectError(err.response?.data?.detail || 'Unable to load projects.'))
      .finally(() => setLoadingProjects(false));
  };

  const loadMilestones = () => {
    setLoadingMilestones(true);
    getAdminMilestones()
      .then((res) => setMilestones(res.data))
      .catch((err) => setMilestoneError(err.response?.data?.detail || 'Unable to load milestones.'))
      .finally(() => setLoadingMilestones(false));
  };

  useEffect(() => {
    loadProjects();
    loadMilestones();
  }, []);

  // ── Project actions ───────────────────────────────────────
  const addProject = async (event) => {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    setSavingProject(true);
    setProjectError('');
    try {
      await createProject({ name, is_active: true });
      setProjectName('');
      loadProjects();
    } catch (err) {
      setProjectError(err.response?.data?.name?.[0] || 'Unable to add project.');
    } finally {
      setSavingProject(false);
    }
  };

  const removeProject = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? All associated milestones will also be deleted.`)) return;
    setProjectError('');
    try {
      await deleteProject(project.id);
      loadProjects();
      loadMilestones();
    } catch (err) {
      setProjectError(err.response?.data?.detail || 'Unable to delete project.');
    }
  };

  // ── Milestone actions ─────────────────────────────────────
  const addMilestone = async (event) => {
    event.preventDefault();
    const name = milestoneName.trim();
    if (!milestoneProject || !name) return;
    setSavingMilestone(true);
    setMilestoneError('');
    try {
      await createMilestone({ project: milestoneProject, name, is_active: true });
      setMilestoneName('');
      loadMilestones();
    } catch (err) {
      const data = err.response?.data;
      setMilestoneError(
        data?.name?.[0] || data?.project?.[0] || data?.non_field_errors?.[0] || data?.detail || 'Unable to add milestone.'
      );
    } finally {
      setSavingMilestone(false);
    }
  };

  const removeMilestone = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.name}"?`)) return;
    setMilestoneError('');
    try {
      await deleteMilestone(milestone.id);
      loadMilestones();
    } catch (err) {
      setMilestoneError(err.response?.data?.detail || 'Unable to delete milestone.');
    }
  };

  return (
    <DashboardLayout>
      <Navbar title="Settings" subtitle="Manage projects and milestones" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mx-auto max-w-3xl space-y-8">

          {/* ── Project Settings ───────────────────────────────── */}
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-slate-950">Project Settings</h1>
                <p className="mt-1 text-sm text-slate-500">These project names appear in the employee Timesheet dropdown.</p>
              </div>

              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addProject}>
                <input
                  className={inputClass}
                  id="project-name-input"
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  value={projectName}
                />
                <button className={buttonClass.primary} disabled={savingProject} type="submit" id="add-project-btn">
                  <Plus size={16} /> {savingProject ? 'Adding...' : 'Add Project'}
                </button>
              </form>

              {projectError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {projectError}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-950">Project Names</h2>
              </div>
              {loadingProjects ? <Loader text="Loading projects..." /> : (
                <div className="divide-y divide-slate-100">
                  {projects.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">No projects added yet.</div>
                  ) : projects.map((project) => (
                    <div className="flex items-center justify-between gap-3 px-4 py-3" key={project.id}>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{project.name}</p>
                        <p className="text-xs text-slate-400">{project.is_active ? 'Active' : 'Inactive'}</p>
                      </div>
                      <button
                        className={buttonClass.ghost}
                        id={`delete-project-${project.id}`}
                        onClick={() => removeProject(project)}
                        type="button"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Milestone Settings ─────────────────────────────── */}
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                  <Flag size={16} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Milestone Settings</h2>
                  <p className="mt-1 text-sm text-slate-500">Milestones are linked to a project and appear in the Timesheet form when that project is selected.</p>
                </div>
              </div>

              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addMilestone}>
                <select
                  className={inputClass}
                  id="milestone-project-select"
                  onChange={(e) => setMilestoneProject(e.target.value)}
                  value={milestoneProject}
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  id="milestone-name-input"
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="Milestone name"
                  value={milestoneName}
                />
                <button
                  className={buttonClass.primary}
                  disabled={savingMilestone || !milestoneProject}
                  id="add-milestone-btn"
                  type="submit"
                >
                  <Plus size={16} /> {savingMilestone ? 'Adding...' : 'Add Milestone'}
                </button>
              </form>

              {milestoneError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {milestoneError}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-indigo-50 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-950">Milestones</h2>
              </div>
              {loadingMilestones ? <Loader text="Loading milestones..." /> : (
                <div className="divide-y divide-slate-100">
                  {milestones.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">No milestones added yet.</div>
                  ) : milestones.map((milestone) => (
                    <div className="flex items-center justify-between gap-3 px-4 py-3" key={milestone.id}>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{milestone.name}</p>
                        <p className="text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            {milestone.project_name}
                          </span>
                        </p>
                      </div>
                      <button
                        className={buttonClass.ghost}
                        id={`delete-milestone-${milestone.id}`}
                        onClick={() => removeMilestone(milestone)}
                        type="button"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </main>
    </DashboardLayout>
  );
};

export default Settings;
