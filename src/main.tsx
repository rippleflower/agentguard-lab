import { StrictMode, useState, type CSSProperties, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Plus,
  Radar,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import "./styles.css";

type AccessLevel = "read" | "write" | "admin";
type DataClass = "public" | "internal" | "confidential" | "restricted";
type ApprovalMode = "none" | "sampled" | "before-write" | "every-action";
type AuditLevel = "none" | "basic" | "structured" | "immutable";

type Project = {
  id: string;
  name: string;
  mission: string;
  owner: string;
  autonomy: number;
  dataClass: DataClass;
  toolAccess: AccessLevel;
  approvalMode: ApprovalMode;
  auditLevel: AuditLevel;
  externalActions: number;
  userImpact: number;
  promptInjectionExposure: number;
  fallbackReady: boolean;
  killSwitch: boolean;
  retentionDays: number;
  notes: string[];
};

type Template = {
  id: string;
  name: string;
  description: string;
  project: Project;
};

type Recommendation = {
  title: string;
  body: string;
  severity: "critical" | "warning" | "ready";
};

const STORAGE_KEY = "agentguard-lab-projects";

const dataClassWeight: Record<DataClass, number> = {
  public: 4,
  internal: 12,
  confidential: 22,
  restricted: 34,
};

const toolAccessWeight: Record<AccessLevel, number> = {
  read: 6,
  write: 18,
  admin: 34,
};

const approvalWeight: Record<ApprovalMode, number> = {
  none: 24,
  sampled: 14,
  "before-write": 6,
  "every-action": 0,
};

const auditWeight: Record<AuditLevel, number> = {
  none: 22,
  basic: 12,
  structured: 5,
  immutable: 0,
};

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: crypto.randomUUID(),
  name: "Procurement Co-Pilot",
  mission: "Review vendor requests, match them to policy, and draft approval packets.",
  owner: "Operations",
  autonomy: 48,
  dataClass: "confidential",
  toolAccess: "write",
  approvalMode: "before-write",
  auditLevel: "structured",
  externalActions: 4,
  userImpact: 58,
  promptInjectionExposure: 42,
  fallbackReady: true,
  killSwitch: true,
  retentionDays: 30,
  notes: [
    "Human approval before purchase order creation.",
    "Vendor documents are treated as untrusted input.",
  ],
  ...overrides,
});

const templates: Template[] = [
  {
    id: "procurement",
    name: "Procurement Co-Pilot",
    description: "Policy matching, vendor packets, approval handoffs.",
    project: createProject(),
  },
  {
    id: "support",
    name: "Support Triage Agent",
    description: "Classifies tickets, drafts responses, escalates risky cases.",
    project: createProject({
      name: "Support Triage Agent",
      mission:
        "Classify incoming tickets, draft replies, and escalate incidents before SLA breach.",
      owner: "Customer Experience",
      autonomy: 62,
      dataClass: "internal",
      toolAccess: "write",
      approvalMode: "sampled",
      auditLevel: "structured",
      externalActions: 7,
      userImpact: 76,
      promptInjectionExposure: 68,
      retentionDays: 14,
      notes: ["Customer attachments are sandboxed.", "Incident labels require audit trail."],
    }),
  },
  {
    id: "finance",
    name: "Finance Close Analyst",
    description: "Reconciliation assistant with restricted data exposure.",
    project: createProject({
      name: "Finance Close Analyst",
      mission:
        "Compare ledger anomalies, reconcile month-end variance, and prepare reviewer notes.",
      owner: "Finance",
      autonomy: 36,
      dataClass: "restricted",
      toolAccess: "read",
      approvalMode: "every-action",
      auditLevel: "immutable",
      externalActions: 1,
      userImpact: 42,
      promptInjectionExposure: 28,
      fallbackReady: true,
      killSwitch: true,
      retentionDays: 7,
      notes: ["No write access to ERP.", "Reviewer notes are archived with immutable logs."],
    }),
  },
];

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const calculateRisk = (project: Project) => {
  const raw =
    project.autonomy * 0.18 +
    dataClassWeight[project.dataClass] +
    toolAccessWeight[project.toolAccess] +
    approvalWeight[project.approvalMode] +
    auditWeight[project.auditLevel] +
    project.externalActions * 2.6 +
    project.userImpact * 0.12 +
    project.promptInjectionExposure * 0.18 -
    (project.fallbackReady ? 8 : 0) -
    (project.killSwitch ? 10 : 0) +
    Math.max(project.retentionDays - 30, 0) * 0.18;

  return Math.round(clamp(raw));
};

const getRiskBand = (score: number) => {
  if (score >= 75) return { label: "Launch Blocked", tone: "critical" };
  if (score >= 50) return { label: "Needs Controls", tone: "warning" };
  return { label: "Launch Ready", tone: "ready" };
};

const buildRecommendations = (project: Project, score: number): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (project.toolAccess !== "read" && project.approvalMode === "none") {
    recommendations.push({
      title: "Put a human gate before external writes",
      body: "Write-capable agents should require explicit approval before changing customer, finance, or production systems.",
      severity: "critical",
    });
  }

  if (project.dataClass === "restricted" && project.retentionDays > 14) {
    recommendations.push({
      title: "Shorten retention for restricted data",
      body: "Keep sensitive context windows small and expire run artifacts quickly unless a legal hold requires otherwise.",
      severity: "warning",
    });
  }

  if (project.promptInjectionExposure > 55) {
    recommendations.push({
      title: "Treat incoming content as hostile input",
      body: "Add source isolation, instruction hierarchy checks, and allowlisted tool calls for untrusted documents or messages.",
      severity: "warning",
    });
  }

  if (!project.killSwitch) {
    recommendations.push({
      title: "Add a kill switch",
      body: "Teams need an immediate stop control that revokes tool tokens and pauses scheduled runs without a deploy.",
      severity: "critical",
    });
  }

  if (project.auditLevel === "none" || project.auditLevel === "basic") {
    recommendations.push({
      title: "Upgrade the audit trail",
      body: "Record model input summaries, tool calls, approvals, and final actions in a structured event stream.",
      severity: "warning",
    });
  }

  if (score < 50) {
    recommendations.push({
      title: "Ready for a constrained pilot",
      body: "Run with a narrow user cohort, compare agent outcomes against manual baselines, and review incidents weekly.",
      severity: "ready",
    });
  }

  return recommendations.slice(0, 4);
};

const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return templates.map((template) => template.project);
    const parsed = JSON.parse(raw) as Project[];
    return parsed.length ? parsed : templates.map((template) => template.project);
  } catch {
    return templates.map((template) => template.project);
  }
};

const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

function App() {
  const [projects, setProjects] = useStoredProjects();
  const [activeId, setActiveId] = useState(projects[0]?.id ?? templates[0].project.id);
  const [noteDraft, setNoteDraft] = useState("");

  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0];
  const score = calculateRisk(activeProject);
  const riskBand = getRiskBand(score);
  const recommendations = buildRecommendations(activeProject, score);
  const readiness = Math.round(
    clamp(
      100 -
        score +
        (activeProject.auditLevel === "immutable" ? 8 : 0) +
        (activeProject.approvalMode === "every-action" ? 6 : 0),
    ),
  );

  const updateProject = <K extends keyof Project>(key: K, value: Project[K]) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === activeProject.id ? { ...project, [key]: value } : project,
      ),
    );
  };

  const duplicateFromTemplate = (template: Template) => {
    const project = { ...template.project, id: crypto.randomUUID() };
    setProjects((current) => [project, ...current]);
    setActiveId(project.id);
  };

  const addBlankProject = () => {
    const project = createProject({
      id: crypto.randomUUID(),
      name: "New Agent Workflow",
      mission: "Describe the job this agent will perform.",
      owner: "Product",
      notes: [],
    });
    setProjects((current) => [project, ...current]);
    setActiveId(project.id);
  };

  const deleteProject = () => {
    if (projects.length === 1) return;
    const next = projects.filter((project) => project.id !== activeProject.id);
    setProjects(next);
    setActiveId(next[0].id);
  };

  const resetProjects = () => {
    const fresh = templates.map((template) => ({ ...template.project, id: crypto.randomUUID() }));
    setProjects(fresh);
    setActiveId(fresh[0].id);
  };

  const addNote = () => {
    if (!noteDraft.trim()) return;
    updateProject("notes", [...activeProject.notes, noteDraft.trim()]);
    setNoteDraft("");
  };

  const removeNote = (index: number) => {
    updateProject(
      "notes",
      activeProject.notes.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const exportReport = () => {
    const report = [
      `# ${activeProject.name} Launch Review`,
      "",
      `Owner: ${activeProject.owner}`,
      `Risk score: ${score}/100 (${riskBand.label})`,
      `Readiness: ${readiness}%`,
      "",
      "## Mission",
      activeProject.mission,
      "",
      "## Controls",
      `- Data class: ${activeProject.dataClass}`,
      `- Tool access: ${activeProject.toolAccess}`,
      `- Approval mode: ${activeProject.approvalMode}`,
      `- Audit level: ${activeProject.auditLevel}`,
      `- Kill switch: ${activeProject.killSwitch ? "yes" : "no"}`,
      `- Manual fallback: ${activeProject.fallbackReady ? "yes" : "no"}`,
      "",
      "## Recommendations",
      ...recommendations.map((item) => `- ${item.title}: ${item.body}`),
      "",
      "## Notes",
      ...(activeProject.notes.length ? activeProject.notes.map((note) => `- ${note}`) : ["- None"]),
    ].join("\n");

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-review.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="shell">
      <section className="hero-panel" aria-label="Project summary">
        <div className="brand-row">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="eyebrow">AgentGuard Lab</p>
            <h1>Model AI agent risk before launch.</h1>
          </div>
        </div>

        <div className="hero-grid">
          <div className="summary-copy">
            <p>
              A local-first readiness console for teams turning AI agents into production
              workflows. Map autonomy, data exposure, tool access, approvals, and audit depth
              before the first pilot goes live.
            </p>
            <div className="hero-actions">
              <button className="primary-action" onClick={addBlankProject}>
                <Plus size={18} />
                New workflow
              </button>
              <button className="ghost-action" onClick={exportReport}>
                <ArrowDownToLine size={18} />
                Export report
              </button>
            </div>
          </div>

          <div className="radar-card" aria-label="Risk score">
            <div className="radar-visual" style={{ "--score": score } as CSSProperties}>
              <Radar size={88} />
              <span>{score}</span>
            </div>
            <div>
              <p className={`status-pill ${riskBand.tone}`}>{riskBand.label}</p>
              <h2>{activeProject.name}</h2>
              <p>{activeProject.mission}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="rail" aria-label="Saved workflows">
          <div className="rail-head">
            <div>
              <p className="eyebrow">Workflows</p>
              <strong>{projects.length} saved locally</strong>
            </div>
            <button className="icon-button" onClick={addBlankProject} title="Add workflow">
              <Plus size={18} />
            </button>
          </div>

          <div className="project-list">
            {projects.map((project) => {
              const projectScore = calculateRisk(project);
              return (
                <button
                  className={`project-row ${project.id === activeProject.id ? "active" : ""}`}
                  key={project.id}
                  onClick={() => setActiveId(project.id)}
                >
                  <span className="row-icon">
                    <Bot size={18} />
                  </span>
                  <span>
                    <strong>{project.name}</strong>
                    <small>{project.owner}</small>
                  </span>
                  <em>{projectScore}</em>
                </button>
              );
            })}
          </div>

          <div className="template-stack">
            <p className="eyebrow">Fast starts</p>
            {templates.map((template) => (
              <button
                className="template-button"
                key={template.id}
                onClick={() => duplicateFromTemplate(template)}
              >
                <span>
                  <strong>{template.name}</strong>
                  <small>{template.description}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

          <button className="reset-button" onClick={resetProjects}>
            <RotateCcw size={16} />
            Reset sample data
          </button>
        </aside>

        <section className="editor" aria-label="Workflow editor">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Control surface</p>
              <h2>Workflow profile</h2>
            </div>
            <div className="button-group">
              <button className="compact-button" onClick={exportReport}>
                <FileText size={16} />
                Report
              </button>
              <button className="compact-button danger" onClick={deleteProject} disabled={projects.length === 1}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field span-two">
              <span>Name</span>
              <input
                value={activeProject.name}
                onChange={(event) => updateProject("name", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Owner</span>
              <input
                value={activeProject.owner}
                onChange={(event) => updateProject("owner", event.target.value)}
              />
            </label>
            <label className="field span-three">
              <span>Mission</span>
              <textarea
                value={activeProject.mission}
                onChange={(event) => updateProject("mission", event.target.value)}
              />
            </label>
          </div>

          <div className="control-grid">
            <MetricSlider
              icon={<Zap size={18} />}
              label="Autonomy"
              value={activeProject.autonomy}
              onChange={(value) => updateProject("autonomy", value)}
            />
            <MetricSlider
              icon={<GitBranch size={18} />}
              label="External actions"
              value={activeProject.externalActions}
              max={12}
              onChange={(value) => updateProject("externalActions", value)}
            />
            <MetricSlider
              icon={<Fingerprint size={18} />}
              label="User impact"
              value={activeProject.userImpact}
              onChange={(value) => updateProject("userImpact", value)}
            />
            <MetricSlider
              icon={<ShieldAlert size={18} />}
              label="Injection exposure"
              value={activeProject.promptInjectionExposure}
              onChange={(value) => updateProject("promptInjectionExposure", value)}
            />
          </div>

          <div className="choice-grid">
            <SelectField
              icon={<Database size={18} />}
              label="Data class"
              value={activeProject.dataClass}
              options={["public", "internal", "confidential", "restricted"]}
              onChange={(value) => updateProject("dataClass", value as DataClass)}
            />
            <SelectField
              icon={<KeyRound size={18} />}
              label="Tool access"
              value={activeProject.toolAccess}
              options={["read", "write", "admin"]}
              onChange={(value) => updateProject("toolAccess", value as AccessLevel)}
            />
            <SelectField
              icon={<ClipboardCheck size={18} />}
              label="Approval"
              value={activeProject.approvalMode}
              options={["none", "sampled", "before-write", "every-action"]}
              onChange={(value) => updateProject("approvalMode", value as ApprovalMode)}
            />
            <SelectField
              icon={<Archive size={18} />}
              label="Audit trail"
              value={activeProject.auditLevel}
              options={["none", "basic", "structured", "immutable"]}
              onChange={(value) => updateProject("auditLevel", value as AuditLevel)}
            />
          </div>

          <div className="switch-grid">
            <ToggleCard
              icon={<LockKeyhole size={20} />}
              label="Kill switch"
              description="Immediate token revocation and run pause."
              checked={activeProject.killSwitch}
              onChange={(value) => updateProject("killSwitch", value)}
            />
            <ToggleCard
              icon={<Workflow size={20} />}
              label="Manual fallback"
              description="A documented path if the agent is disabled."
              checked={activeProject.fallbackReady}
              onChange={(value) => updateProject("fallbackReady", value)}
            />
            <label className="retention-card">
              <span>
                <Archive size={18} />
                Retention window
              </span>
              <input
                type="number"
                min={1}
                max={365}
                value={activeProject.retentionDays}
                onChange={(event) =>
                  updateProject("retentionDays", Number(event.target.value))
                }
              />
              <small>days</small>
            </label>
          </div>
        </section>

        <aside className="insights" aria-label="Risk insights">
          <div className="score-block">
            <div className="score-header">
              <Gauge size={20} />
              <span>Launch readiness</span>
            </div>
            <strong>{readiness}%</strong>
            <div className="meter">
              <span style={{ width: `${readiness}%` }} />
            </div>
          </div>

          <div className="signal-grid">
            <Signal icon={<Database size={18} />} label="Data" value={activeProject.dataClass} />
            <Signal icon={<KeyRound size={18} />} label="Access" value={activeProject.toolAccess} />
            <Signal icon={<BarChart3 size={18} />} label="Audit" value={activeProject.auditLevel} />
            <Signal icon={<Save size={18} />} label="Retain" value={`${activeProject.retentionDays}d`} />
          </div>

          <div className="recommendation-list">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Recommendations</p>
                <h2>Next controls</h2>
              </div>
            </div>
            {recommendations.map((item) => (
              <article className={`recommendation ${item.severity}`} key={item.title}>
                {item.severity === "ready" ? <Check size={18} /> : <AlertTriangle size={18} />}
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="notes-panel">
            <p className="eyebrow">Review notes</p>
            <div className="note-input">
              <input
                placeholder="Add a control note"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addNote();
                }}
              />
              <button className="icon-button" onClick={addNote} title="Add note">
                <Plus size={16} />
              </button>
            </div>
            <div className="notes-list">
              {activeProject.notes.map((note, index) => (
                <button key={`${note}-${index}`} onClick={() => removeNote(index)}>
                  <Sparkles size={14} />
                  <span>{note}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function useStoredProjects() {
  const [projects, setProjectsState] = useState<Project[]>(loadProjects);

  const setProjects: React.Dispatch<React.SetStateAction<Project[]>> = (value) => {
    setProjectsState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      saveProjects(next);
      return next;
    });
  };

  return [projects, setProjects] as const;
}

function MetricSlider({
  icon,
  label,
  value,
  max = 100,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="metric-card">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-card">
      <span>
        {icon}
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleCard({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`toggle-card ${checked ? "checked" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <em>{checked ? "On" : "Off"}</em>
    </label>
  );
}

function Signal({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="signal">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
