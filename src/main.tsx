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
  Languages,
  ListChecks,
  LockKeyhole,
  Plus,
  Radar,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import "./styles.css";

type AccessLevel = "read" | "write" | "admin";
type DataClass = "public" | "internal" | "confidential" | "restricted";
type ApprovalMode = "none" | "sampled" | "before-write" | "every-action";
type AuditLevel = "none" | "basic" | "structured" | "immutable";
type Language = "en" | "zh";

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

type RiskFactor = {
  id: string;
  label: string;
  detail: string;
  value: number;
  impact: number;
  tone: "critical" | "warning" | "ready";
};

const STORAGE_KEY = "agentguard-lab-projects";
const LANGUAGE_KEY = "agentguard-lab-language";

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

const copy = {
  en: {
    appName: "AgentGuard Lab",
    heroTitle: "Decide if an AI agent is ready to pilot.",
    heroBody:
      "Turn a vague agent idea into a launch decision. Define what it can do, what it can touch, who approves actions, and which controls are missing.",
    purposeLabel: "Clear outcome",
    purposeTitle: "From idea to launch decision",
    purposeItems: [
      "Can this agent enter a limited pilot?",
      "Which risks block launch today?",
      "What controls must be added next?",
    ],
    newWorkflow: "New workflow",
    exportReport: "Export report",
    languageToggle: "中文",
    languageLabel: "Language",
    workflows: "Workflows",
    savedLocally: "saved locally",
    addWorkflow: "Add workflow",
    fastStarts: "Fast starts",
    resetSampleData: "Reset sample data",
    controlSurface: "Control surface",
    workflowProfile: "Workflow profile",
    report: "Report",
    delete: "Delete",
    name: "Name",
    owner: "Owner",
    mission: "Mission",
    autonomy: "Autonomy",
    autonomyHint: "How much can it decide without a person?",
    externalActions: "External actions",
    externalActionsHint: "Systems it can call or change.",
    userImpact: "User impact",
    userImpactHint: "How visible or consequential mistakes are.",
    injectionExposure: "Injection exposure",
    injectionExposureHint: "How much untrusted content it reads.",
    dataClass: "Data class",
    toolAccess: "Tool access",
    approval: "Approval",
    auditTrail: "Audit trail",
    killSwitch: "Kill switch",
    killSwitchDescription: "Immediate token revocation and run pause.",
    manualFallback: "Manual fallback",
    manualFallbackDescription: "A documented path if the agent is disabled.",
    retentionWindow: "Retention window",
    days: "days",
    launchReadiness: "Launch readiness",
    riskDrivers: "Risk drivers",
    whyThisScore: "Why this score",
    recommendations: "Recommendations",
    nextControls: "Next controls",
    reviewNotes: "Review notes",
    addControlNote: "Add a control note",
    on: "On",
    off: "Off",
    impact: "impact",
    newProjectName: "New Agent Workflow",
    newProjectMission: "Describe the job this agent will perform.",
    productOwner: "Product",
    reportTitle: "Launch Review",
    reportMission: "Mission",
    reportControls: "Controls",
    reportRecommendations: "Recommendations",
    reportNotes: "Notes",
    none: "None",
    labels: {
      public: "public",
      internal: "internal",
      confidential: "confidential",
      restricted: "restricted",
      read: "read",
      write: "write",
      admin: "admin",
      none: "none",
      sampled: "sampled",
      "before-write": "before-write",
      "every-action": "every-action",
      basic: "basic",
      structured: "structured",
      immutable: "immutable",
    },
    bands: {
      critical: "Launch Blocked",
      warning: "Needs Controls",
      ready: "Launch Ready",
    },
    factorDetails: {
      autonomy: "Decision freedom",
      data: "Sensitivity of data touched",
      access: "Permission level",
      approval: "Human review strength",
      audit: "Traceability depth",
      actions: "External system reach",
      injection: "Untrusted input exposure",
    },
    recommendationsText: {
      humanGateTitle: "Put a human gate before external writes",
      humanGateBody:
        "Write-capable agents should require explicit approval before changing customer, finance, or production systems.",
      retentionTitle: "Shorten retention for restricted data",
      retentionBody:
        "Keep sensitive context windows small and expire run artifacts quickly unless a legal hold requires otherwise.",
      hostileInputTitle: "Treat incoming content as hostile input",
      hostileInputBody:
        "Add source isolation, instruction hierarchy checks, and allowlisted tool calls for untrusted documents or messages.",
      killSwitchTitle: "Add a kill switch",
      killSwitchBody:
        "Teams need an immediate stop control that revokes tool tokens and pauses scheduled runs without a deploy.",
      auditTitle: "Upgrade the audit trail",
      auditBody:
        "Record model input summaries, tool calls, approvals, and final actions in a structured event stream.",
      pilotTitle: "Ready for a constrained pilot",
      pilotBody:
        "Run with a narrow user cohort, compare agent outcomes against manual baselines, and review incidents weekly.",
    },
  },
  zh: {
    appName: "AgentGuard Lab",
    heroTitle: "判断 AI Agent 能不能进入试点。",
    heroBody:
      "把模糊的 Agent 想法变成清晰的上线判断：它能做什么、能碰什么数据、谁来审批、还缺哪些控制措施。",
    purposeLabel: "明确目标",
    purposeTitle: "从想法到上线决策",
    purposeItems: [
      "这个 Agent 现在能不能小范围试点？",
      "今天阻塞上线的风险是什么？",
      "下一步必须补哪些控制措施？",
    ],
    newWorkflow: "新建工作流",
    exportReport: "导出报告",
    languageToggle: "English",
    languageLabel: "语言",
    workflows: "工作流",
    savedLocally: "个本地保存",
    addWorkflow: "添加工作流",
    fastStarts: "快速模板",
    resetSampleData: "重置示例数据",
    controlSurface: "控制台",
    workflowProfile: "工作流画像",
    report: "报告",
    delete: "删除",
    name: "名称",
    owner: "负责人",
    mission: "任务目标",
    autonomy: "自主程度",
    autonomyHint: "它能在多大程度上自己做决定？",
    externalActions: "外部动作",
    externalActionsHint: "它能调用或改变多少外部系统？",
    userImpact: "用户影响",
    userImpactHint: "出错后对用户或业务的影响程度。",
    injectionExposure: "注入暴露",
    injectionExposureHint: "它会读取多少不可信内容。",
    dataClass: "数据等级",
    toolAccess: "工具权限",
    approval: "审批方式",
    auditTrail: "审计日志",
    killSwitch: "紧急停止",
    killSwitchDescription: "立即撤销工具令牌并暂停运行。",
    manualFallback: "人工兜底",
    manualFallbackDescription: "Agent 停用时可切回人工流程。",
    retentionWindow: "保留周期",
    days: "天",
    launchReadiness: "上线准备度",
    riskDrivers: "风险来源",
    whyThisScore: "分数原因",
    recommendations: "治理建议",
    nextControls: "下一步控制",
    reviewNotes: "评审备注",
    addControlNote: "添加控制备注",
    on: "开",
    off: "关",
    impact: "影响",
    newProjectName: "新的 Agent 工作流",
    newProjectMission: "描述这个 Agent 要完成的任务。",
    productOwner: "产品",
    reportTitle: "上线评审",
    reportMission: "任务目标",
    reportControls: "控制措施",
    reportRecommendations: "治理建议",
    reportNotes: "备注",
    none: "无",
    labels: {
      public: "公开",
      internal: "内部",
      confidential: "机密",
      restricted: "受限",
      read: "读取",
      write: "写入",
      admin: "管理员",
      none: "无",
      sampled: "抽样审批",
      "before-write": "写入前审批",
      "every-action": "每次操作审批",
      basic: "基础",
      structured: "结构化",
      immutable: "不可变",
    },
    bands: {
      critical: "阻塞上线",
      warning: "需要补控制",
      ready: "可以试点",
    },
    factorDetails: {
      autonomy: "自主决策空间",
      data: "接触数据敏感度",
      access: "工具权限级别",
      approval: "人工审核强度",
      audit: "可追溯程度",
      actions: "外部系统触达",
      injection: "不可信输入暴露",
    },
    recommendationsText: {
      humanGateTitle: "外部写入前加入人工审批",
      humanGateBody:
        "具备写入能力的 Agent 在改动客户、财务或生产系统前，应要求明确审批。",
      retentionTitle: "缩短受限数据保留周期",
      retentionBody:
        "敏感上下文和运行记录应尽快过期，除非存在明确的合规或法律保留要求。",
      hostileInputTitle: "把外来内容视为不可信输入",
      hostileInputBody:
        "对文档和消息增加来源隔离、指令层级校验，并限制可调用工具范围。",
      killSwitchTitle: "加入紧急停止能力",
      killSwitchBody:
        "团队需要无需发版就能立即撤销工具令牌、暂停定时任务的停止控制。",
      auditTitle: "升级审计日志",
      auditBody:
        "用结构化事件记录模型输入摘要、工具调用、审批记录和最终动作。",
      pilotTitle: "适合受限试点",
      pilotBody:
        "先面向小范围用户运行，对比人工基线，并每周复盘异常和事件。",
    },
  },
} as const;

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

const getRiskBand = (score: number, language: Language) => {
  if (score >= 75) return { label: copy[language].bands.critical, tone: "critical" };
  if (score >= 50) return { label: copy[language].bands.warning, tone: "warning" };
  return { label: copy[language].bands.ready, tone: "ready" };
};

const buildRecommendations = (
  project: Project,
  score: number,
  language: Language,
): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const text = copy[language].recommendationsText;

  if (project.toolAccess !== "read" && project.approvalMode === "none") {
    recommendations.push({
      title: text.humanGateTitle,
      body: text.humanGateBody,
      severity: "critical",
    });
  }

  if (project.dataClass === "restricted" && project.retentionDays > 14) {
    recommendations.push({
      title: text.retentionTitle,
      body: text.retentionBody,
      severity: "warning",
    });
  }

  if (project.promptInjectionExposure > 55) {
    recommendations.push({
      title: text.hostileInputTitle,
      body: text.hostileInputBody,
      severity: "warning",
    });
  }

  if (!project.killSwitch) {
    recommendations.push({
      title: text.killSwitchTitle,
      body: text.killSwitchBody,
      severity: "critical",
    });
  }

  if (project.auditLevel === "none" || project.auditLevel === "basic") {
    recommendations.push({
      title: text.auditTitle,
      body: text.auditBody,
      severity: "warning",
    });
  }

  if (score < 50) {
    recommendations.push({
      title: text.pilotTitle,
      body: text.pilotBody,
      severity: "ready",
    });
  }

  return recommendations.slice(0, 4);
};

const buildRiskFactors = (project: Project, language: Language): RiskFactor[] => {
  const labels = copy[language].factorDetails;
  const factors: RiskFactor[] = [
    {
      id: "autonomy",
      label: copy[language].autonomy,
      detail: labels.autonomy,
      value: project.autonomy,
      impact: Math.round(project.autonomy * 0.18),
      tone: project.autonomy > 70 ? "critical" : project.autonomy > 45 ? "warning" : "ready",
    },
    {
      id: "data",
      label: copy[language].dataClass,
      detail: labels.data,
      value: dataClassWeight[project.dataClass],
      impact: dataClassWeight[project.dataClass],
      tone:
        project.dataClass === "restricted"
          ? "critical"
          : project.dataClass === "confidential"
            ? "warning"
            : "ready",
    },
    {
      id: "access",
      label: copy[language].toolAccess,
      detail: labels.access,
      value: toolAccessWeight[project.toolAccess],
      impact: toolAccessWeight[project.toolAccess],
      tone: project.toolAccess === "admin" ? "critical" : project.toolAccess === "write" ? "warning" : "ready",
    },
    {
      id: "approval",
      label: copy[language].approval,
      detail: labels.approval,
      value: approvalWeight[project.approvalMode],
      impact: approvalWeight[project.approvalMode],
      tone:
        project.approvalMode === "none"
          ? "critical"
          : project.approvalMode === "sampled"
            ? "warning"
            : "ready",
    },
    {
      id: "audit",
      label: copy[language].auditTrail,
      detail: labels.audit,
      value: auditWeight[project.auditLevel],
      impact: auditWeight[project.auditLevel],
      tone:
        project.auditLevel === "none"
          ? "critical"
          : project.auditLevel === "basic"
            ? "warning"
            : "ready",
    },
    {
      id: "actions",
      label: copy[language].externalActions,
      detail: labels.actions,
      value: project.externalActions,
      impact: Math.round(project.externalActions * 2.6),
      tone: project.externalActions > 8 ? "critical" : project.externalActions > 3 ? "warning" : "ready",
    },
    {
      id: "injection",
      label: copy[language].injectionExposure,
      detail: labels.injection,
      value: project.promptInjectionExposure,
      impact: Math.round(project.promptInjectionExposure * 0.18),
      tone:
        project.promptInjectionExposure > 70
          ? "critical"
          : project.promptInjectionExposure > 45
            ? "warning"
            : "ready",
    },
  ];

  return factors.sort((left, right) => right.impact - left.impact).slice(0, 5);
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

const loadLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === "en" || stored === "zh") return stored;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
};

const saveLanguage = (language: Language) => {
  localStorage.setItem(LANGUAGE_KEY, language);
};

function App() {
  const [projects, setProjects] = useStoredProjects();
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [activeId, setActiveId] = useState(projects[0]?.id ?? templates[0].project.id);
  const [noteDraft, setNoteDraft] = useState("");

  const t = copy[language];
  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0];
  const score = calculateRisk(activeProject);
  const riskBand = getRiskBand(score, language);
  const recommendations = buildRecommendations(activeProject, score, language);
  const riskFactors = buildRiskFactors(activeProject, language);
  const readiness = Math.round(
    clamp(
      100 -
        score +
        (activeProject.auditLevel === "immutable" ? 8 : 0) +
        (activeProject.approvalMode === "every-action" ? 6 : 0),
    ),
  );

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    saveLanguage(nextLanguage);
  };

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
      name: t.newProjectName,
      mission: t.newProjectMission,
      owner: t.productOwner,
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
      `# ${activeProject.name} ${t.reportTitle}`,
      "",
      `${t.owner}: ${activeProject.owner}`,
      `${t.riskDrivers}: ${score}/100 (${riskBand.label})`,
      `${t.launchReadiness}: ${readiness}%`,
      "",
      `## ${t.reportMission}`,
      activeProject.mission,
      "",
      `## ${t.reportControls}`,
      `- ${t.dataClass}: ${t.labels[activeProject.dataClass]}`,
      `- ${t.toolAccess}: ${t.labels[activeProject.toolAccess]}`,
      `- ${t.approval}: ${t.labels[activeProject.approvalMode]}`,
      `- ${t.auditTrail}: ${t.labels[activeProject.auditLevel]}`,
      `- ${t.killSwitch}: ${activeProject.killSwitch ? t.on : t.off}`,
      `- ${t.manualFallback}: ${activeProject.fallbackReady ? t.on : t.off}`,
      "",
      `## ${t.reportRecommendations}`,
      ...recommendations.map((item) => `- ${item.title}: ${item.body}`),
      "",
      `## ${t.reportNotes}`,
      ...(activeProject.notes.length ? activeProject.notes.map((note) => `- ${note}`) : [`- ${t.none}`]),
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
            <p className="eyebrow">{t.appName}</p>
            <h1>{t.heroTitle}</h1>
          </div>
          <button
            className="language-button"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            title={t.languageLabel}
          >
            <Languages size={17} />
            {t.languageToggle}
          </button>
        </div>

        <div className="hero-grid">
          <div className="summary-copy">
            <p>{t.heroBody}</p>
            <div className="purpose-card">
              <div>
                <p className="eyebrow">{t.purposeLabel}</p>
                <strong>{t.purposeTitle}</strong>
              </div>
              <ul>
                {t.purposeItems.map((item) => (
                  <li key={item}>
                    <Target size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-actions">
              <button className="primary-action" onClick={addBlankProject}>
                <Plus size={18} />
                {t.newWorkflow}
              </button>
              <button className="ghost-action" onClick={exportReport}>
                <ArrowDownToLine size={18} />
                {t.exportReport}
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
              <p className="eyebrow">{t.workflows}</p>
              <strong>
                {projects.length} {t.savedLocally}
              </strong>
            </div>
            <button className="icon-button" onClick={addBlankProject} title={t.addWorkflow}>
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
            <p className="eyebrow">{t.fastStarts}</p>
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
            {t.resetSampleData}
          </button>
        </aside>

        <section className="editor" aria-label="Workflow editor">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.controlSurface}</p>
              <h2>{t.workflowProfile}</h2>
            </div>
            <div className="button-group">
              <button className="compact-button" onClick={exportReport}>
                <FileText size={16} />
                {t.report}
              </button>
              <button className="compact-button danger" onClick={deleteProject} disabled={projects.length === 1}>
                <Trash2 size={16} />
                {t.delete}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field span-two">
              <span>{t.name}</span>
              <input
                value={activeProject.name}
                onChange={(event) => updateProject("name", event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.owner}</span>
              <input
                value={activeProject.owner}
                onChange={(event) => updateProject("owner", event.target.value)}
              />
            </label>
            <label className="field span-three">
              <span>{t.mission}</span>
              <textarea
                value={activeProject.mission}
                onChange={(event) => updateProject("mission", event.target.value)}
              />
            </label>
          </div>

          <div className="control-grid">
            <MetricSlider
              icon={<Zap size={18} />}
              label={t.autonomy}
              hint={t.autonomyHint}
              value={activeProject.autonomy}
              onChange={(value) => updateProject("autonomy", value)}
            />
            <MetricSlider
              icon={<GitBranch size={18} />}
              label={t.externalActions}
              hint={t.externalActionsHint}
              value={activeProject.externalActions}
              max={12}
              onChange={(value) => updateProject("externalActions", value)}
            />
            <MetricSlider
              icon={<Fingerprint size={18} />}
              label={t.userImpact}
              hint={t.userImpactHint}
              value={activeProject.userImpact}
              onChange={(value) => updateProject("userImpact", value)}
            />
            <MetricSlider
              icon={<ShieldAlert size={18} />}
              label={t.injectionExposure}
              hint={t.injectionExposureHint}
              value={activeProject.promptInjectionExposure}
              onChange={(value) => updateProject("promptInjectionExposure", value)}
            />
          </div>

          <div className="choice-grid">
            <SelectField
              icon={<Database size={18} />}
              label={t.dataClass}
              value={activeProject.dataClass}
              options={["public", "internal", "confidential", "restricted"].map((value) => ({
                value,
                label: t.labels[value as DataClass],
              }))}
              onChange={(value) => updateProject("dataClass", value as DataClass)}
            />
            <SelectField
              icon={<KeyRound size={18} />}
              label={t.toolAccess}
              value={activeProject.toolAccess}
              options={["read", "write", "admin"].map((value) => ({
                value,
                label: t.labels[value as AccessLevel],
              }))}
              onChange={(value) => updateProject("toolAccess", value as AccessLevel)}
            />
            <SelectField
              icon={<ClipboardCheck size={18} />}
              label={t.approval}
              value={activeProject.approvalMode}
              options={["none", "sampled", "before-write", "every-action"].map((value) => ({
                value,
                label: t.labels[value as ApprovalMode],
              }))}
              onChange={(value) => updateProject("approvalMode", value as ApprovalMode)}
            />
            <SelectField
              icon={<Archive size={18} />}
              label={t.auditTrail}
              value={activeProject.auditLevel}
              options={["none", "basic", "structured", "immutable"].map((value) => ({
                value,
                label: t.labels[value as AuditLevel],
              }))}
              onChange={(value) => updateProject("auditLevel", value as AuditLevel)}
            />
          </div>

          <div className="switch-grid">
            <ToggleCard
              icon={<LockKeyhole size={20} />}
              label={t.killSwitch}
              description={t.killSwitchDescription}
              checked={activeProject.killSwitch}
              onChange={(value) => updateProject("killSwitch", value)}
              onLabel={t.on}
              offLabel={t.off}
            />
            <ToggleCard
              icon={<Workflow size={20} />}
              label={t.manualFallback}
              description={t.manualFallbackDescription}
              checked={activeProject.fallbackReady}
              onChange={(value) => updateProject("fallbackReady", value)}
              onLabel={t.on}
              offLabel={t.off}
            />
            <label className="retention-card">
              <span>
                <Archive size={18} />
                {t.retentionWindow}
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
              <small>{t.days}</small>
            </label>
          </div>
        </section>

        <aside className="insights" aria-label="Risk insights">
          <div className="score-block">
            <div className="score-header">
              <Gauge size={20} />
              <span>{t.launchReadiness}</span>
            </div>
            <strong>{readiness}%</strong>
            <div className="meter">
              <span style={{ width: `${readiness}%` }} />
            </div>
          </div>

          <div className="drivers-panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{t.riskDrivers}</p>
                <h2>{t.whyThisScore}</h2>
              </div>
              <ListChecks size={20} />
            </div>
            <div className="driver-list">
              {riskFactors.map((factor) => (
                <div className={`driver ${factor.tone}`} key={factor.id}>
                  <div>
                    <strong>{factor.label}</strong>
                    <small>
                      {factor.detail} · {t.impact} +{factor.impact}
                    </small>
                  </div>
                  <span className="driver-track">
                    <i style={{ width: `${clamp(factor.impact * 3)}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="signal-grid">
            <Signal icon={<Database size={18} />} label={t.dataClass} value={t.labels[activeProject.dataClass]} />
            <Signal icon={<KeyRound size={18} />} label={t.toolAccess} value={t.labels[activeProject.toolAccess]} />
            <Signal icon={<BarChart3 size={18} />} label={t.auditTrail} value={t.labels[activeProject.auditLevel]} />
            <Signal icon={<Save size={18} />} label={t.retentionWindow} value={`${activeProject.retentionDays}${language === "zh" ? t.days : "d"}`} />
          </div>

          <div className="recommendation-list">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{t.recommendations}</p>
                <h2>{t.nextControls}</h2>
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
            <p className="eyebrow">{t.reviewNotes}</p>
            <div className="note-input">
              <input
                placeholder={t.addControlNote}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addNote();
                }}
              />
              <button className="icon-button" onClick={addNote} title={t.addControlNote}>
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
  hint,
  value,
  max = 100,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="metric-card">
      <span className="metric-label">
        <span>
          {icon}
          {label}
        </span>
        <small>{hint}</small>
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
  options: Array<{ value: string; label: string }>;
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
          <option key={option.value} value={option.value}>
            {option.label}
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
  onLabel,
  offLabel,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel: string;
  offLabel: string;
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
      <em>{checked ? onLabel : offLabel}</em>
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
