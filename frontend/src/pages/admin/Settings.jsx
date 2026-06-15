import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, Pencil, FolderGit2, Clock, Sliders } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { buttonClass, inputClass, labelClass } from '../../components/uiClasses';
import {
  createProject, deleteProject, getAdminProjects, updateProject,
  createMilestone, deleteMilestone, getAdminMilestones, updateMilestone,
  getTimesheetSettings, updateTimesheetSettings,
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

  // ── Tab state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('projects-milestones'); // 'projects-milestones', 'timesheet', 'other'

  // ── Timesheet Time Window Settings state ───────────────────
  const [plannedStart, setPlannedStart] = useState('06:00');
  const [plannedEnd, setPlannedEnd] = useState('12:00');
  const [actualStart, setActualStart] = useState('12:00');
  const [actualEnd, setActualEnd] = useState('23:59');
  const [savingTimeWindows, setSavingTimeWindows] = useState(false);

  const loadTimeWindowSettings = () => {
    getTimesheetSettings()
      .then((res) => {
        const cleanTime = (t) => t ? t.substring(0, 5) : '';
        setPlannedStart(cleanTime(res.data.planned_start_time) || '06:00');
        setPlannedEnd(cleanTime(res.data.planned_end_time) || '12:00');
        setActualStart(cleanTime(res.data.actual_start_time) || '12:00');
        setActualEnd(cleanTime(res.data.actual_end_time) || '23:59');
      })
      .catch((err) => {
        console.error('Failed to load time window settings:', err);
      });
  };

  const handleSaveTimeWindowSettings = (e) => {
    e.preventDefault();
    setSavingTimeWindows(true);
    updateTimesheetSettings({
      planned_start_time: plannedStart,
      planned_end_time: plannedEnd,
      actual_start_time: actualStart,
      actual_end_time: actualEnd,
    })
      .then((res) => {
        const cleanTime = (t) => t ? t.substring(0, 5) : '';
        setPlannedStart(cleanTime(res.data.planned_start_time) || '06:00');
        setPlannedEnd(cleanTime(res.data.planned_end_time) || '12:00');
        setActualStart(cleanTime(res.data.actual_start_time) || '12:00');
        setActualEnd(cleanTime(res.data.actual_end_time) || '23:59');
        alert('Timesheet time windows saved successfully!');
      })
      .catch((err) => {
        alert('Failed to save timesheet windows: ' + (err.response?.data?.detail || 'Unknown error'));
      })
      .finally(() => {
        setSavingTimeWindows(false);
      });
  };

  // ── other settings state & persistence ──────────────────────
  const [otherSettings, setOtherSettings] = useState(() => {
    const saved = localStorage.getItem('system-other-settings');
    return saved ? JSON.parse(saved) : {
      roles: ['Employee', 'Admin'],
      departments: ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance'],
      designations: ['Software Engineer', 'Senior Engineer', 'HR Manager', 'Sales Executive', 'Product Manager'],
    };
  });

  const [draftRoles, setDraftRoles] = useState(() => otherSettings.roles || ['Employee', 'Admin']);
  const [draftDepartments, setDraftDepartments] = useState(() => otherSettings.departments || ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance']);
  const [draftDesignations, setDraftDesignations] = useState(() => otherSettings.designations || ['Software Engineer', 'Senior Engineer', 'HR Manager', 'Sales Executive', 'Product Manager']);
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesg, setNewDesg] = useState('');

  const handleSaveOtherSettings = (e) => {
    e.preventDefault();
    const updated = {
      roles: draftRoles,
      departments: draftDepartments,
      designations: draftDesignations,
    };
    setOtherSettings(updated);
    localStorage.setItem('system-other-settings', JSON.stringify(updated));
    alert('System attributes saved successfully!');
  };

  // ── Timesheet settings state & persistence ──────────────────
  const [timesheetSettings, setTimesheetSettings] = useState(() => {
    const saved = localStorage.getItem('system-timesheet-settings');
    return saved ? JSON.parse(saved) : {
      dailyTargetHours: 8,
      weeklyTargetHours: 40,
      allowOverlap: false,
      requireMilestone: false,
      taskTypes: ['Development', 'Bug Fix', 'Testing', 'Research', 'Documentation', 'Meeting', 'Support', 'Code Review']
    };
  });

  const [draftDailyHours, setDraftDailyHours] = useState(() => timesheetSettings.dailyTargetHours || 8);
  const [draftWeeklyHours, setDraftWeeklyHours] = useState(() => timesheetSettings.weeklyTargetHours || 40);
  const [draftAllowOverlap, setDraftAllowOverlap] = useState(() => timesheetSettings.allowOverlap || false);
  const [draftRequireMilestone, setDraftRequireMilestone] = useState(() => timesheetSettings.requireMilestone || false);

  const handleSaveTimesheetSettings = (e) => {
    e.preventDefault();
    const updated = {
      dailyTargetHours: Number(draftDailyHours),
      weeklyTargetHours: Number(draftWeeklyHours),
      allowOverlap: draftAllowOverlap,
      requireMilestone: draftRequireMilestone
    };
    setTimesheetSettings(updated);
    localStorage.setItem('system-timesheet-settings', JSON.stringify(updated));
    alert('Timesheet settings saved successfully!');
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
    loadTimeWindowSettings();
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
      <Navbar title="Settings" subtitle="Configure system components, timesheets, and attributes" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Tabs Selector */}
          <div className="flex flex-col sm:flex-row gap-2 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab('projects-milestones')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 outline-none ${activeTab === 'projects-milestones'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              type="button"
            >
              <FolderGit2 size={16} />
              <span>Project and Milestone</span>
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 outline-none ${activeTab === 'timesheet'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              type="button"
            >
              <Clock size={16} />
              <span>Timesheet</span>
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 outline-none ${activeTab === 'other'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              type="button"
            >
              <Sliders size={16} />
              <span>Other Setting</span>
            </button>
          </div>

          {activeTab === 'projects-milestones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Panel - Projects */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
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

              {/* Right Panel - Milestones */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      {selectedProject ? (
                        <>
                          <span>Milestones —</span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-200">
                            {selectedProject.name}
                          </span>
                        </>
                      ) : (
                        'Milestones'
                      )}
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
          )}

          {/* Timesheet Settings Tab Panel */}
          {activeTab === 'timesheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Time Window Settings (Top) */}
              <form onSubmit={handleSaveTimeWindowSettings} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Timesheet Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure Planned and Actual time entry windows for employees.</p>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Planned Time Window */}
                    <div className="space-y-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Planned Time Entry Window</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                          <input
                            type="time"
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={plannedStart}
                            onChange={(e) => setPlannedStart(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                          <input
                            type="time"
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={plannedEnd}
                            onChange={(e) => setPlannedEnd(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actual Time Window */}
                    <div className="space-y-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700">Actual Time Entry Window</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                          <input
                            type="time"
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={actualStart}
                            onChange={(e) => setActualStart(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                          <input
                            type="time"
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={actualEnd}
                            onChange={(e) => setActualEnd(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className={buttonClass.admin}
                    disabled={savingTimeWindows}
                  >
                    {savingTimeWindows ? 'Saving...' : 'Save Timesheet Windows'}
                  </button>
                </div>
              </form>

              {/* Timesheet Configuration (Bottom) */}
              <form onSubmit={handleSaveTimesheetSettings} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Timesheet Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure target working hours, timesheet entries, and task types.</p>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-5">
                  {/* Target Hours Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={labelClass}>Daily Target Hours</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={draftDailyHours}
                        onChange={(e) => setDraftDailyHours(e.target.value)}
                        min={1}
                        max={24}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Weekly Target Hours</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={draftWeeklyHours}
                        onChange={(e) => setDraftWeeklyHours(e.target.value)}
                        min={1}
                        max={168}
                      />
                    </div>
                  </div>

                  {/* Overlap & Milestone Toggles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Allow Overlapping Tasks</p>
                        <p className="text-xs text-slate-500">Allow users to log tasks with overlapping timeslots.</p>
                      </div>
                      <Switch
                        checked={draftAllowOverlap}
                        onCheckedChange={setDraftAllowOverlap}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Require Milestone Selection</p>
                        <p className="text-xs text-slate-500">Force users to select a milestone when entering timesheets.</p>
                      </div>
                      <Switch
                        checked={draftRequireMilestone}
                        onCheckedChange={setDraftRequireMilestone}
                      />
                    </div>
                  </div>


                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className={buttonClass.admin}
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Other Settings (System Attributes) Tab Panel */}
          {activeTab === 'other' && (
            <form onSubmit={handleSaveOtherSettings} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">System Attributes</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage user roles, departments, and designations available in the system.</p>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-6">
                {/* Roles Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Roles</label>
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
                  className={buttonClass.admin}
                  type="submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
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
    </DashboardLayout>
  );
};

export default Settings;