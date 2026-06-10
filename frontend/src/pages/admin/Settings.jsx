import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass } from '../../components/uiClasses';
import {
  createProject, deleteProject, getAdminProjects, updateProject,
  createMilestone, deleteMilestone, getAdminMilestones,
} from '../../services/timesheetService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';

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

  const toggleProjectStatus = async (project) => {
    setProjectError('');
    try {
      await updateProject(project.id, { is_active: !project.is_active });
      loadProjects();
    } catch (err) {
      setProjectError(err.response?.data?.detail || 'Unable to update project status.');
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

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-950">Project & Milestone Settings</h1>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <form className="space-y-3" onSubmit={addProject}>
                <h2 className="text-sm font-bold text-slate-700">Add Project</h2>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className={inputClass}
                    id="project-name-input"
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project name"
                    value={projectName}
                  />
                  <button className={`${buttonClass.primary} whitespace-nowrap shrink-0`} disabled={savingProject} type="submit" id="add-project-btn">
                    <Plus size={16} /> {savingProject ? 'Adding...' : 'Add Project'}
                  </button>
                </div>
              </form>

              <form className="space-y-3" onSubmit={addMilestone}>
                <h2 className="text-sm font-bold text-slate-700">Add Milestone</h2>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_auto]">
                  <select
                    className={inputClass}
                    id="milestone-project-select"
                    onChange={(e) => setMilestoneProject(e.target.value)}
                    value={milestoneProject}
                  >
                    <option value="">Select Project</option>
                    {projects.filter((p) => p.is_active).map((p) => (
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
                    className={`${buttonClass.primary} whitespace-nowrap shrink-0`}
                    disabled={savingMilestone || !milestoneProject}
                    id="add-milestone-btn"
                    type="submit"
                  >
                    <Plus size={16} /> {savingMilestone ? 'Adding...' : 'Add Milestone'}
                  </button>
                </div>
              </form>
            </div>

            {(projectError || milestoneError) && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {projectError || milestoneError}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-950">Projects & Milestones</h2>
            </div>
            <div>
              {loadingProjects || loadingMilestones ? (
                <Loader text="Loading projects and milestones..." />
              ) : projects.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">No projects added yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projects.map((project) => {
                    const projectMilestones = milestones.filter((m) => Number(m.project_id ?? m.project) === Number(project.id));
                    return (
                      <div className="flex flex-col gap-3 px-4 py-4 hover:bg-slate-50 transition-colors" key={project.id}>
                        <div className="flex items-center justify-between gap-4">
                          {/* Project Name - Left */}
                          <div className="w-20 flex-shrink-0 sm:w-24">
                            <p className="text-sm font-semibold text-slate-950">{project.name}</p>
                            <p className={`text-xs font-medium ${project.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                              {project.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>

                          {/* Milestones - Middle */}
                          <div className="flex min-h-9 flex-1 items-center min-w-0">
                            {projectMilestones.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {projectMilestones.map((milestone) => (
                                  <span
                                    key={milestone.id}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3"
                                  >
                                    <span className="text-xs font-medium text-green-700">{milestone.name}</span>
                                    <button
                                      className="flex h-4 w-4 items-center justify-center text-sm font-bold leading-none text-green-500 hover:text-green-700"
                                      id={`delete-milestone-${milestone.id}`}
                                      onClick={() => removeMilestone(milestone)}
                                      type="button"
                                      title="Remove milestone"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No milestones</span>
                            )}
                          </div>

                          {/* Action Buttons - Right */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`toggle-project-${project.id}`}
                                checked={project.is_active}
                                onCheckedChange={() => toggleProjectStatus(project)}
                              />
                              <span className={`text-xs font-medium ${project.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                                {project.is_active ? 'ON' : 'OFF'}
                              </span>
                            </div>
                            <button
                              className={buttonClass.ghost}
                              id={`delete-project-${project.id}`}
                              onClick={() => removeProject(project)}
                              type="button"
                              title="Delete project"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Other Settings Dialog ─────────────────────────────── */}
      <Dialog open={isOtherSettingsOpen} onOpenChange={setIsOtherSettingsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="text-blue-600" size={20} />
              Other Settings
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveOtherSettings} className="space-y-6 py-4">
            <div className="flex flex-col gap-5">

              {/* Roles Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Roles</label>
                {/* Input row at top */}
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Add role..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, handleAddRole)}
                  />
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className={`${buttonClass.primary} px-5 shrink-0`}
                  >
                    Add
                  </button>
                </div>
                {/* Tags below */}
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 min-h-[56px]">
                  {draftRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="text-slate-400 hover:text-slate-600 font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {draftRoles.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No roles added</span>
                  )}
                </div>
              </div>

              {/* Departments Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Departments</label>
                {/* Input row at top */}
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Add department..."
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, handleAddDept)}
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className={`${buttonClass.primary} px-5 shrink-0`}
                  >
                    Add
                  </button>
                </div>
                {/* Tags below */}
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 min-h-[56px]">
                  {draftDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {dept}
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(dept)}
                        className="text-slate-400 hover:text-slate-600 font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {draftDepartments.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No departments added</span>
                  )}
                </div>
              </div>

              {/* Designations Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Designations</label>
                {/* Input row at top */}
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Add designation..."
                    value={newDesg}
                    onChange={(e) => setNewDesg(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, handleAddDesg)}
                  />
                  <button
                    type="button"
                    onClick={handleAddDesg}
                    className={`${buttonClass.primary} px-5 shrink-0`}
                  >
                    Add
                  </button>
                </div>
                {/* Tags below */}
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 min-h-[56px]">
                  {draftDesignations.map((desg) => (
                    <span
                      key={desg}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {desg}
                      <button
                        type="button"
                        onClick={() => handleRemoveDesg(desg)}
                        className="text-slate-400 hover:text-slate-600 font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {draftDesignations.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No designations added</span>
                  )}
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