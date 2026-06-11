import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, Pencil } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass, labelClass } from '../../components/uiClasses';
import {
  createProject, deleteProject, getAdminProjects, updateProject,
  createMilestone, deleteMilestone, getAdminMilestones, updateMilestone,
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

  // Project selection & edit dialog states
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');

  // ── Milestones ────────────────────────────────────────────
  const [milestones, setMilestones] = useState([]);
  const [milestoneName, setMilestoneName] = useState('');
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState('');

  // Milestone edit dialog states
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);
  const [editMilestoneName, setEditMilestoneName] = useState('');

  // Derived state
  const selectedProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);
  const projectMilestones = selectedProject
    ? milestones.filter((m) => Number(m.project_id ?? m.project) === Number(selectedProject.id))
    : [];

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
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) {
          if (!res.data.some(p => p.id === selectedProjectId)) {
            setSelectedProjectId(res.data[0].id);
          }
        } else {
          setSelectedProjectId(null);
        }
      })
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
      setIsAddProjectOpen(false);
      loadProjects();
    } catch (err) {
      setProjectError(err.response?.data?.name?.[0] || 'Unable to add project.');
    } finally {
      setSavingProject(false);
    }
  };

  const editProject = async (event) => {
    event.preventDefault();
    const name = editProjectName.trim();
    if (!projectToEdit || !name) return;
    setSavingProject(true);
    setProjectError('');
    try {
      await updateProject(projectToEdit.id, { name });
      setEditProjectName('');
      setProjectToEdit(null);
      setIsEditProjectOpen(false);
      loadProjects();
    } catch (err) {
      setProjectError(err.response?.data?.name?.[0] || 'Unable to edit project.');
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
    if (!selectedProject || !name) return;
    setSavingMilestone(true);
    setMilestoneError('');
    try {
      await createMilestone({ project: selectedProject.id, name, is_active: true });
      setMilestoneName('');
      setIsAddMilestoneOpen(false);
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

  const editMilestone = async (event) => {
    event.preventDefault();
    const name = editMilestoneName.trim();
    if (!milestoneToEdit || !name) return;
    setSavingMilestone(true);
    setMilestoneError('');
    try {
      await updateMilestone(milestoneToEdit.id, { name });
      setEditMilestoneName('');
      setMilestoneToEdit(null);
      setIsEditMilestoneOpen(false);
      loadMilestones();
    } catch (err) {
      const data = err.response?.data;
      setMilestoneError(
        data?.name?.[0] || data?.project?.[0] || data?.non_field_errors?.[0] || data?.detail || 'Unable to edit milestone.'
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

  const toggleMilestoneStatus = async (milestone) => {
    setMilestoneError('');
    try {
      await updateMilestone(milestone.id, { is_active: !milestone.is_active });
      loadMilestones();
    } catch (err) {
      setMilestoneError(err.response?.data?.detail || 'Unable to update milestone status.');
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel - Projects (Col-span 5) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Projects</h3>
                  <p className="text-xs text-slate-500">Select a project to view milestones</p>
                </div>
                <button
                  onClick={() => {
                    setProjectName('');
                    setProjectError('');
                    setIsAddProjectOpen(true);
                  }}
                  className={`${buttonClass.primary} h-9 px-3 text-xs flex items-center gap-1.5`}
                  id="open-add-project-dialog-btn"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              {/* Panel Content (Projects list) */}
              <div className="flex-1 overflow-auto max-h-[600px] divide-y divide-slate-100">
                {loadingProjects ? (
                  <Loader text="Loading projects..." />
                ) : projects.length === 0 ? (
                  <div className="px-5 py-12 text-center text-sm text-slate-400 italic">No projects found.</div>
                ) : (
                  projects.map((project) => {
                    const isSelected = selectedProject && selectedProject.id === project.id;
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          }`}
                      >
                        <div className="min-w-0 pr-4">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                            {project.name}
                          </p>
                          <span className={`text-xs font-medium ${project.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`toggle-project-${project.id}`}
                              checked={project.is_active}
                              onCheckedChange={() => toggleProjectStatus(project)}
                            />
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${project.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                              {project.is_active ? 'ON' : 'OFF'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setProjectToEdit(project);
                              setEditProjectName(project.name);
                              setProjectError('');
                              setIsEditProjectOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Project"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => removeProject(project)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel - Milestones (Col-span 7) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedProject ? `Milestones — ${selectedProject.name}` : 'Milestones'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedProject ? 'Manage milestones linked to this project' : 'Select a project to manage milestones'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMilestoneName('');
                    setMilestoneError('');
                    setIsAddMilestoneOpen(true);
                  }}
                  disabled={!selectedProject || !selectedProject.is_active}
                  className={`${buttonClass.primary} h-9 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                  id="open-add-milestone-dialog-btn"
                >
                  <Plus size={14} /> Add Milestone
                </button>
              </div>

              {/* Panel Content (Milestones list) */}
              <div className="flex-1 overflow-auto max-h-[600px] divide-y divide-slate-100">
                {loadingProjects || loadingMilestones ? (
                  <Loader text="Loading milestones..." />
                ) : !selectedProject ? (
                  <div className="px-5 py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                    <span className="text-slate-300">📁</span>
                    <span>Select a project from the left panel to manage its milestones.</span>
                  </div>
                ) : projectMilestones.length === 0 ? (
                  <div className="px-5 py-16 text-center text-sm text-slate-400 italic flex flex-col items-center justify-center gap-2">
                    <span>No milestones created for this project yet.</span>
                    {selectedProject.is_active ? (
                      <button
                        onClick={() => {
                          setMilestoneName('');
                          setMilestoneError('');
                          setIsAddMilestoneOpen(true);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline mt-1"
                      >
                        Create the first milestone
                      </button>
                    ) : (
                      <span className="text-xs text-amber-500">Activate this project to add milestones.</span>
                    )}
                  </div>
                ) : (
                  projectMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {milestone.name}
                        </p>
                        <span className={`text-xs font-medium ${milestone.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                          {milestone.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`toggle-milestone-${milestone.id}`}
                            checked={milestone.is_active}
                            onCheckedChange={() => toggleMilestoneStatus(milestone)}
                          />
                          <span className={`text-[10px] font-bold tracking-wider uppercase ${milestone.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                            {milestone.is_active ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setMilestoneToEdit(milestone);
                            setEditMilestoneName(milestone.name);
                            setMilestoneError('');
                            setIsEditMilestoneOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Milestone"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => removeMilestone(milestone)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Milestone"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Add Project Dialog ─────────────────────────────── */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">Add Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={addProject} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="add-project-name" className={labelClass}>Project Name</label>
              <input
                id="add-project-name"
                className={inputClass}
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />
            </div>
            {projectError && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {projectError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className={buttonClass.outline}
                onClick={() => setIsAddProjectOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={buttonClass.primary}
                disabled={savingProject || !projectName.trim()}
              >
                {savingProject ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project Dialog ─────────────────────────────── */}
      <Dialog open={isEditProjectOpen} onOpenChange={(open) => {
        setIsEditProjectOpen(open);
        if (!open) setProjectToEdit(null);
      }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={editProject} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-project-name" className={labelClass}>Project Name</label>
              <input
                id="edit-project-name"
                className={inputClass}
                placeholder="Enter project name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                autoFocus
              />
            </div>
            {projectError && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {projectError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className={buttonClass.outline}
                onClick={() => {
                  setIsEditProjectOpen(false);
                  setProjectToEdit(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={buttonClass.primary}
                disabled={savingProject || !editProjectName.trim()}
              >
                {savingProject ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Milestone Dialog ─────────────────────────────── */}
      <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">Add Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={addMilestone} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className={labelClass}>Project</label>
              <input
                className={`${inputClass} bg-slate-50 cursor-not-allowed`}
                value={selectedProject ? selectedProject.name : ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="add-milestone-name" className={labelClass}>Milestone Name</label>
              <input
                id="add-milestone-name"
                className={inputClass}
                placeholder="Enter milestone name"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                autoFocus
              />
            </div>
            {milestoneError && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {milestoneError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className={buttonClass.outline}
                onClick={() => setIsAddMilestoneOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={buttonClass.primary}
                disabled={savingMilestone || !milestoneName.trim()}
              >
                {savingMilestone ? 'Adding...' : 'Add Milestone'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Milestone Dialog ─────────────────────────────── */}
      <Dialog open={isEditMilestoneOpen} onOpenChange={(open) => {
        setIsEditMilestoneOpen(open);
        if (!open) setMilestoneToEdit(null);
      }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={editMilestone} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-milestone-name" className={labelClass}>Milestone Name</label>
              <input
                id="edit-milestone-name"
                className={inputClass}
                placeholder="Enter milestone name"
                value={editMilestoneName}
                onChange={(e) => setEditMilestoneName(e.target.value)}
                autoFocus
              />
            </div>
            {milestoneError && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {milestoneError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className={buttonClass.outline}
                onClick={() => {
                  setIsEditMilestoneOpen(false);
                  setMilestoneToEdit(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={buttonClass.primary}
                disabled={savingMilestone || !editMilestoneName.trim()}
              >
                {savingMilestone ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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