import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass } from '../../components/uiClasses';
import {
  createProject, deleteProject, getAdminProjects,
  createMilestone, deleteMilestone, getAdminMilestones,
} from '../../services/timesheetService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

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

  // ── other settings state & persistence ──────────────────────
  const [isOtherSettingsOpen, setIsOtherSettingsOpen] = useState(false);
  const [otherSettings, setOtherSettings] = useState(() => {
    const saved = localStorage.getItem('system-other-settings');
    return saved ? JSON.parse(saved) : {
      roles: ['Employee', 'Admin'],
      departments: ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance'],
      designations: ['Software Engineer', 'Senior Engineer', 'HR Manager', 'Sales Executive', 'Product Manager'],
    };
  });

  const [draftRoles, setDraftRoles] = useState([]);
  const [draftDepartments, setDraftDepartments] = useState([]);
  const [draftDesignations, setDraftDesignations] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesg, setNewDesg] = useState('');

  const openOtherSettings = () => {
    setDraftRoles(otherSettings.roles || ['Employee', 'Admin']);
    setDraftDepartments(otherSettings.departments || ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance']);
    setDraftDesignations(otherSettings.designations || ['Software Engineer', 'Senior Engineer', 'HR Manager', 'Sales Executive', 'Product Manager']);
    setNewRole('');
    setNewDept('');
    setNewDesg('');
    setIsOtherSettingsOpen(true);
  };

  const handleSaveOtherSettings = (e) => {
    e.preventDefault();
    const updated = {
      roles: draftRoles,
      departments: draftDepartments,
      designations: draftDesignations,
    };
    setOtherSettings(updated);
    localStorage.setItem('system-other-settings', JSON.stringify(updated));
    setIsOtherSettingsOpen(false);
  };

  const handleAddRole = () => {
    const val = newRole.trim();
    if (val && !draftRoles.some(r => r.toLowerCase() === val.toLowerCase())) {
      setDraftRoles([...draftRoles, val]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (role) => {
    setDraftRoles(draftRoles.filter((r) => r !== role));
  };

  const handleAddDept = () => {
    const val = newDept.trim();
    if (val && !draftDepartments.some(d => d.toLowerCase() === val.toLowerCase())) {
      setDraftDepartments([...draftDepartments, val]);
      setNewDept('');
    }
  };

  const handleRemoveDept = (dept) => {
    setDraftDepartments(draftDepartments.filter((d) => d !== dept));
  };

  const handleAddDesg = () => {
    const val = newDesg.trim();
    if (val && !draftDesignations.some(d => d.toLowerCase() === val.toLowerCase())) {
      setDraftDesignations([...draftDesignations, val]);
      setNewDesg('');
    }
  };

  const handleRemoveDesg = (desg) => {
    setDraftDesignations(draftDesignations.filter((d) => d !== desg));
  };

  const handleInputKeyDown = (e, addFn) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFn();
    }
  };

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
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex justify-end">
            <button
              onClick={openOtherSettings}
              className={`${buttonClass.outline} flex items-center gap-2 bg-white shadow-sm hover:bg-slate-50`}
              type="button"
            >
              <SettingsIcon size={14} className="text-slate-500" /> Other Settings
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 items-start">

          {/* ── Project Settings ───────────────────────────────── */}
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-slate-950">Project Settings</h1>
              </div>

              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addProject}>
                <input
                  className={`${inputClass} sm:max-w-xs`}
                  id="project-name-input"
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  value={projectName}
                />
                <button className={`${buttonClass.primary} whitespace-nowrap shrink-0`} disabled={savingProject} type="submit" id="add-project-btn">
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
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-950">Milestone Settings</h2>
              </div>

              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addMilestone}>
                <select
                  className={`${inputClass} sm:w-44`}
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
                  className={`${inputClass} sm:max-w-xs`}
                  id="milestone-name-input"
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="Milestone name"
                  value={milestoneName}
                />
                <button
                  className={`${buttonClass.primary} whitespace-nowrap shrink-0`}
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
      </div>
    </main>

    <Dialog open={isOtherSettingsOpen} onOpenChange={setIsOtherSettingsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="text-blue-600" size={20} />
            Other Settings
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveOtherSettings} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Roles Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Roles</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50 min-h-[120px] max-h-[185px] overflow-y-auto align-content-start">
                {draftRoles.map((role) => (
                  <span key={role} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {role}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="text-blue-500 hover:text-blue-700 font-bold ml-1 text-sm leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  className={`${inputClass} text-xs h-8`}
                  placeholder="Add role..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, handleAddRole)}
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className={`${buttonClass.primary} h-8 text-xs px-2.5`}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Departments Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Departments</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50 min-h-[120px] max-h-[185px] overflow-y-auto align-content-start">
                {draftDepartments.map((dept) => (
                  <span key={dept} className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {dept}
                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept)}
                      className="text-emerald-500 hover:text-emerald-700 font-bold ml-1 text-sm leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  className={`${inputClass} text-xs h-8`}
                  placeholder="Add dept..."
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, handleAddDept)}
                />
                <button
                  type="button"
                  onClick={handleAddDept}
                  className={`${buttonClass.primary} h-8 text-xs px-2.5`}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Designations Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Designations</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50 min-h-[120px] max-h-[185px] overflow-y-auto align-content-start">
                {draftDesignations.map((desg) => (
                  <span key={desg} className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {desg}
                    <button
                      type="button"
                      onClick={() => handleRemoveDesg(desg)}
                      className="text-indigo-500 hover:text-indigo-700 font-bold ml-1 text-sm leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  className={`${inputClass} text-xs h-8`}
                  placeholder="Add desg..."
                  value={newDesg}
                  onChange={(e) => setNewDesg(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, handleAddDesg)}
                />
                <button
                  type="button"
                  onClick={handleAddDesg}
                  className={`${buttonClass.primary} h-8 text-xs px-2.5`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              className={buttonClass.outline}
              onClick={() => setIsOtherSettingsOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={buttonClass.admin}
              type="submit"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </DashboardLayout>
);
};

export default Settings;
