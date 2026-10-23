"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock3,
  Command,
  FileCheck2,
  ListChecks,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import styles from "@/app/agent-preview/agent-preview.module.css";

type Section = "Chat" | "Memory" | "Skills" | "Playbooks" | "Capabilities" | "Inference" | "Approvals" | "Audit trail";
type Approval = {
  id: string;
  area: "Listings" | "Reviews";
  title: string;
  detail: string;
  status: "pending" | "approved" | "changes";
};
type Memory = { id: number; scope: "Workspace" | "LocalSync QA Cafe"; title: string; value: string };
type Message = { role: "assistant" | "you"; text: string };

const navigation: { label: Section; icon: typeof MessageSquareText }[] = [
  { label: "Chat", icon: MessageSquareText },
  { label: "Memory", icon: Brain },
  { label: "Skills", icon: Zap },
  { label: "Playbooks", icon: ListChecks },
  { label: "Capabilities", icon: Command },
  { label: "Inference", icon: Sparkles },
  { label: "Approvals", icon: ShieldCheck },
  { label: "Audit trail", icon: Activity },
];

const seedApprovals: Approval[] = [
  {
    id: "sample-hours",
    area: "Listings",
    title: "Confirm Saturday hours",
    detail: "A synthetic profile has no confirmed Saturday hours. Check the master profile before preparing an update.",
    status: "pending",
  },
  {
    id: "sample-reply",
    area: "Reviews",
    title: "Review a response draft",
    detail: "This example uses invented review text. No customer review or personal information is included.",
    status: "pending",
  },
];

const seedMemories: Memory[] = [
  { id: 1, scope: "Workspace", title: "Approval policy", value: "Require a person to review every external change." },
  { id: 2, scope: "LocalSync QA Cafe", title: "Reply tone", value: "Warm, direct, and never promise a same-day resolution." },
];

const skills = [
  { name: "Check listing consistency", group: "Listings", description: "Compare a business profile with its approved source facts." },
  { name: "Draft a review response", group: "Reviews", description: "Prepare a reply for a person to review before it is used." },
  { name: "Summarize publisher handoffs", group: "Operations", description: "Turn internal handoff notes into a concise status summary." },
];

const sectionDescriptions: Record<Section, string> = {
  Chat: "A shared workspace for questions, decisions, and follow-through.",
  Memory: "Approved context for this workspace and location.",
  Skills: "Focused tasks the agent can prepare for human review.",
  Playbooks: "Repeatable workflows, ready to rehearse with sample data.",
  Capabilities: "Connected tools and the access available to this workspace.",
  Inference: "A transparent example of how a request would be routed.",
  Approvals: "Drafts stay here until a person reviews them.",
  "Audit trail": "A readable record of preview-only activity.",
};

export function AgentWorkspacePreview() {
  const [section, setSection] = useState<Section>("Chat");
  const [approvals, setApprovals] = useState(seedApprovals);
  const [memories, setMemories] = useState(seedMemories);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "This QA workspace has one synthetic publisher handoff in progress. Google Business Profile is not connected, and no listing changes have been sent.",
    },
  ]);
  const [activity, setActivity] = useState(["Preview opened · synthetic workspace"]);
  const [request, setRequest] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"All" | "Listings" | "Reviews">("All");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [memoryFormOpen, setMemoryFormOpen] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryValue, setMemoryValue] = useState("");
  const [memoryScope, setMemoryScope] = useState<Memory["scope"]>("LocalSync QA Cafe");
  const [skillQuery, setSkillQuery] = useState("");
  const [playbookRun, setPlaybookRun] = useState(false);
  const [toast, setToast] = useState("");

  const pendingCount = approvals.filter((item) => item.status === "pending").length;
  const filteredApprovals = approvals.filter((item) => approvalFilter === "All" || item.area === approvalFilter);
  const filteredSkills = useMemo(
    () => skills.filter((skill) => `${skill.name} ${skill.group}`.toLowerCase().includes(skillQuery.toLowerCase())),
    [skillQuery],
  );

  function logActivity(message: string) {
    setActivity((current) => [`${message} · preview only`, ...current].slice(0, 8));
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = request.trim();
    if (!prompt) return;
    setMessages((current) => [
      ...current,
      { role: "you", text: prompt },
      { role: "assistant", text: "This prototype does not call an AI service. Your message stayed in this browser; no listing, review, or publisher was changed." },
    ]);
    logActivity("Sent a local demo prompt");
    setRequest("");
  }

  function decideApproval(status: "approved" | "changes") {
    if (!selectedApproval) return;
    setApprovals((current) => current.map((item) => item.id === selectedApproval.id ? { ...item, status } : item));
    logActivity(status === "approved" ? "Approved a sample draft" : "Requested changes to a sample draft");
    setToast(status === "approved" ? "Sample approved in this preview only." : "Sample sent back in this preview only.");
    setSelectedApproval(null);
    window.setTimeout(() => setToast(""), 3200);
  }

  function saveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = memoryTitle.trim();
    const value = memoryValue.trim();
    if (!title || !value) return;
    setMemories((current) => [...current, { id: Date.now(), scope: memoryScope, title, value }]);
    logActivity("Added a sample memory");
    setMemoryTitle("");
    setMemoryValue("");
    setMemoryFormOpen(false);
    setToast("Memory added to this browser preview only.");
    window.setTimeout(() => setToast(""), 3200);
  }

  function startPlaybook() {
    setPlaybookRun(true);
    logActivity("Simulated a playbook run");
    setToast("Sample run complete. No external changes were made.");
    window.setTimeout(() => setToast(""), 3200);
  }

  function openSkillInChat(skillName: string) {
    setSection("Chat");
    setRequest(`Show me how “${skillName}” would work in the QA workspace.`);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="LocalSync home">
          <Image src="/brand/localsync/mark-teal.svg" alt="" width={29} height={29} priority />
          <span>LocalSync</span>
        </Link>
        <div className={styles.workspaceSelect} aria-label="Current workspace">
          <span className={styles.workspaceGlyph}>L</span>
          <span className={styles.workspaceName}>LocalSync QA Cafe</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.demoTag}><span /> QA workspace</span>
          <span className={styles.avatar} aria-label="Demo account">D</span>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Agent navigation">
          <div className={styles.sidebarHeading}>
            <span className={styles.sidebarEyebrow}>WORKSPACE</span>
            <div className={styles.workspaceMenu} aria-label="Current workspace details">
              <span className={styles.locationDot}><span /></span>
              <span><strong>LocalSync QA Cafe</strong><small>1 location · demo data</small></span>
            </div>
          </div>
          <div className={styles.navLabel}>AGENT</div>
          <nav className={styles.navList}>
            {navigation.map(({ label, icon: Icon }) => (
              <button
                className={`${styles.navItem} ${section === label ? styles.navActive : ""}`}
                key={label}
                onClick={() => setSection(label)}
                type="button"
                aria-current={section === label ? "page" : undefined}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
                {label === "Approvals" && pendingCount > 0 && <span className={styles.navCount}>{pendingCount}</span>}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarBottom}>
            <div className={styles.workspaceHealth}>
              <span className={styles.healthTitle}>Workspace status</span>
              <span className={styles.healthRow}><span className={styles.healthDot} /> Preview mode</span>
              <span className={styles.healthNote}>No publisher actions enabled</span>
            </div>
            <button className={styles.settingsButton} type="button" onClick={() => setSection("Capabilities")}>
              <Settings2 size={16} aria-hidden="true" /> Settings & connections
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.breadcrumb}>Agent <span>/</span> {section}</div>
              <h1>{section === "Chat" ? "Good morning, Demo" : section}</h1>
              <p>{sectionDescriptions[section]}</p>
            </div>
            <div className={styles.headerActions}>
              {section === "Chat" && <button type="button" className={styles.secondaryButton} onClick={() => { setMessages([]); logActivity("Started a new demo conversation"); }}><Plus size={15} /> New chat</button>}
              <span className={styles.dateStamp}><Clock3 size={15} /> Preview session</span>
            </div>
          </div>

          <div className={styles.sandboxNotice}>
            <Sparkles size={16} aria-hidden="true" />
            <span><strong>Sandbox preview</strong> Decisions are temporary and clear on refresh. Nothing is sent to a publisher or AI service.</span>
          </div>

          {section === "Chat" && (
            <div className={styles.chatLayout}>
              <section className={styles.chatPanel} aria-label="Agent conversation">
                <div className={styles.panelHeader}>
                  <div className={styles.agentIdentity}><span className={styles.agentAvatar}><Sparkles size={17} /></span><div><strong>LocalSync Agent</strong><small>Example conversation · LocalSync QA Cafe</small></div></div>
                  <span className={styles.sessionBadge}>Local-only session</span>
                </div>
                <div className={styles.messageArea} aria-live="polite">
                  {messages.length === 0 ? (
                    <div className={styles.emptyConversation}><span className={styles.emptyIcon}><MessageSquareText size={20} /></span><strong>Start with a question</strong><p>Try a sample request. The preview will show a local-only response.</p></div>
                  ) : messages.map((message, index) => (
                    <div className={message.role === "you" ? styles.userMessage : styles.agentMessage} key={`${message.role}-${index}`}>
                      {message.role === "assistant" && <span className={styles.messageMark}><Sparkles size={14} /></span>}
                      <div><span className={styles.messageRole}>{message.role === "you" ? "You" : "LocalSync Agent"}</span><p>{message.text}</p></div>
                    </div>
                  ))}
                </div>
                <div className={styles.suggestionRow}>
                  <button type="button" onClick={() => setRequest("Summarize the synthetic publisher handoff.")}>Summarize the handoff <ArrowDownRight size={13} /></button>
                  <button type="button" onClick={() => setRequest("What still needs setup in this workspace?")}>What needs setup? <ArrowDownRight size={13} /></button>
                </div>
                <form className={styles.composer} onSubmit={submitRequest}>
                  <label className={styles.srOnly} htmlFor="agent-request">Message LocalSync Agent</label>
                  <textarea id="agent-request" placeholder="Ask about this workspace..." value={request} onChange={(event) => setRequest(event.target.value)} rows={2} />
                  <div className={styles.composerFooter}><span>Demo response only · no external service</span><button type="submit" aria-label="Send demo message" disabled={!request.trim()}><Send size={15} /></button></div>
                </form>
              </section>

              <aside className={styles.contextColumn} aria-label="Workspace context">
                <section className={styles.contextPanel}>
                  <div className={styles.contextHeading}><div><span className={styles.panelEyebrow}>CURRENT WORKSPACE</span><h2>LocalSync QA Cafe</h2></div><span className={styles.roundMark}><Image src="/brand/localsync/mark-ink.svg" alt="" width={20} height={20} /></span></div>
                  <dl className={styles.contextFacts}>
                    <div><dt>Locations</dt><dd>1</dd></div>
                    <div><dt>Google Business Profile</dt><dd><span className={styles.statusWarning}>Needs setup</span></dd></div>
                    <div><dt>Manual handoff</dt><dd><span className={styles.statusInfo}>In progress</span></dd></div>
                  </dl>
                  <Link className={styles.textLink} href="/internal/publisher-fulfillment">Open handoff queue <ArrowRight size={14} /></Link>
                </section>

                <section className={styles.nextStepPanel}>
                  <div className={styles.nextStepTop}><span className={styles.panelEyebrow}>NEXT SAFE STEP</span><span className={styles.stepNumber}>01</span></div>
                  <h2>Complete the master profile</h2>
                  <p>Confirm the business facts before connecting a publisher account.</p>
                  <div className={styles.stepRail}><span className={styles.stepDone}><Check size={12} /></span><span /><span /><span /></div>
                  <div className={styles.stepLabels}><span>Profile</span><span>Connect</span><span>Match</span><span>Verify</span></div>
                </section>

                <section className={styles.activityPreview}>
                  <div className={styles.activityHeader}><h2>Recent activity</h2><button type="button" onClick={() => setSection("Audit trail")}>View all <ArrowRight size={13} /></button></div>
                  <div className={styles.activityLine}><span className={styles.activityIcon}><FileCheck2 size={15} /></span><span><strong>Example Directory handoff in progress</strong><small>LocalSync QA Cafe · synthetic</small></span></div>
                  <div className={styles.activityLine}><span className={styles.activityIconBlue}><CheckCircle2 size={15} /></span><span><strong>Test workspace ready</strong><small>Preview mode · no publisher writes</small></span></div>
                </section>
              </aside>
            </div>
          )}

          {section === "Memory" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Workspace memory</h2><p>Sample facts stay in temporary page state and clear on refresh.</p></div><button className={styles.primaryButton} type="button" onClick={() => setMemoryFormOpen((open) => !open)}><Plus size={15} /> Add memory</button></div>
              {memoryFormOpen && <form className={styles.memoryForm} onSubmit={saveMemory}>
                <label>Memory title<input value={memoryTitle} onChange={(event) => setMemoryTitle(event.target.value)} required maxLength={80} placeholder="e.g. Preferred reply tone" /></label>
                <label>Scope<select value={memoryScope} onChange={(event) => setMemoryScope(event.target.value as Memory["scope"])}><option>LocalSync QA Cafe</option><option>Workspace</option></select></label>
                <label className={styles.memoryWide}>Approved context<textarea value={memoryValue} onChange={(event) => setMemoryValue(event.target.value)} required maxLength={240} rows={3} placeholder="Enter a synthetic preference or policy" /></label>
                <div className={styles.formActions}><button type="button" className={styles.secondaryButton} onClick={() => setMemoryFormOpen(false)}>Cancel</button><button type="submit" className={styles.primaryButton}>Save in preview</button></div>
              </form>}
              <div className={styles.memoryList}>{memories.map((memory) => <article className={styles.memoryRow} key={memory.id}><span className={styles.memoryIcon}><Brain size={17} /></span><div className={styles.memoryContent}><div className={styles.memoryMeta}><strong>{memory.title}</strong><span>{memory.scope}</span></div><p>{memory.value}</p></div><span className={styles.localOnly}>Local only</span></article>)}</div>
            </section>
          )}

          {section === "Skills" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Skills</h2><p>Small, reviewable tasks for the synthetic workspace.</p></div><div className={styles.searchBox}><Search size={15} /><input aria-label="Search skills" placeholder="Search skills" value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} /></div></div>
              <div className={styles.skillTable}><div className={styles.tableHeader}><span>SKILL</span><span>AREA</span><span>MODE</span><span /></div>{filteredSkills.map((skill) => <div className={styles.skillRow} key={skill.name}><div className={styles.skillName}><span className={styles.skillIcon}><Zap size={16} /></span><span><strong>{skill.name}</strong><small>{skill.description}</small></span></div><span className={styles.skillArea}>{skill.group}</span><span className={styles.demoStatus}>Demo</span><button type="button" className={styles.rowAction} onClick={() => openSkillInChat(skill.name)}>Try in chat <ArrowRight size={14} /></button></div>)}</div>
            </section>
          )}

          {section === "Playbooks" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Playbooks</h2><p>Practice a sequence before anything connects to a publisher.</p></div><button className={styles.secondaryButton} type="button" onClick={() => { setPlaybookRun(false); logActivity("Reset the sample playbook"); setToast("Demo reset. No external changes were made."); window.setTimeout(() => setToast(""), 3200); }}><X size={14} /> Reset demo</button></div>
              <div className={styles.playbookFeature}><div className={styles.playbookCopy}><span className={styles.panelEyebrow}>SAMPLE WORKFLOW</span><h3>New location setup</h3><p>A reviewable path from verified business facts to a publisher-ready profile.</p><button type="button" className={styles.primaryButton} onClick={startPlaybook}>{playbookRun ? <Check size={15} /> : <Zap size={15} />}{playbookRun ? "Run simulated" : "Run demo"}</button></div><ol className={styles.playbookSteps}><li className={playbookRun ? styles.playbookStepDone : ""}><span>{playbookRun ? <Check size={13} /> : "1"}</span><div><strong>Confirm master profile</strong><small>Human review · no write</small></div></li><li className={playbookRun ? styles.playbookStepDone : ""}><span>{playbookRun ? <Check size={13} /> : "2"}</span><div><strong>Check connection readiness</strong><small>Read-only check</small></div></li><li><span>3</span><div><strong>Prepare next action</strong><small>Approval required</small></div></li></ol></div>
              <div className={styles.playbookFooter}><span><Clock3 size={15} /> {playbookRun ? "Completed just now" : "Not run yet"}</span><span>All steps simulated locally</span></div>
            </section>
          )}

          {section === "Capabilities" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Capabilities</h2><p>External tools are intentionally disconnected in this preview.</p></div><span className={styles.disabledPill}>No external connections</span></div>
              <div className={styles.capabilityList}><div className={styles.capabilityRow}><span className={styles.capabilityIcon}><BookOpen size={17} /></span><span><strong>Business profile</strong><small>Direct account access is not connected.</small></span><span className={styles.notConnected}>Not connected</span></div><div className={styles.capabilityRow}><span className={styles.capabilityIconBlue}><MessageSquareText size={17} /></span><span><strong>Reviews</strong><small>Example drafts only. No review provider is connected.</small></span><span className={styles.notConnected}>Not connected</span></div><div className={styles.capabilityRow}><span className={styles.capabilityIconOrange}><Activity size={17} /></span><span><strong>Publisher handoffs</strong><small>Read the QA queue; no publisher submission tools are enabled.</small></span><Link className={styles.rowAction} href="/internal/publisher-fulfillment">Open queue <ArrowRight size={14} /></Link></div></div>
            </section>
          )}

          {section === "Inference" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Request routing trace</h2><p>See the evidence and safeguards that shape a suggested next step.</p></div><span className={styles.disabledPill}>Simulated · no model call</span></div>
              <div className={styles.inferenceRequest}><span className={styles.panelEyebrow}>SAMPLE REQUEST</span><p>“Check whether our business hours match across listings.”</p><small>Invented prompt · LocalSync QA Cafe</small></div>
              <div className={styles.inferenceGrid}>
                <article className={styles.inferenceStep}><span className={styles.inferenceNumber}>01</span><span className={styles.panelEyebrow}>INTENT</span><h3>Listing consistency</h3><p>Route to a read-only comparison, not a publisher update.</p></article>
                <article className={styles.inferenceStep}><span className={styles.inferenceNumber}>02</span><span className={styles.panelEyebrow}>AVAILABLE EVIDENCE</span><h3>Master profile incomplete</h3><p>Google Business Profile is not connected in this QA workspace.</p></article>
                <article className={styles.inferenceStep}><span className={styles.inferenceNumber}>03</span><span className={styles.panelEyebrow}>SUGGESTED SKILL</span><h3>Check listing consistency</h3><p>Can prepare a checklist once the business facts are confirmed.</p></article>
              </div>
              <div className={styles.inferenceBoundary}><ShieldCheck size={18} /><span><strong>Human gate</strong><small>No external change can be prepared or sent from this simulation. A person must confirm facts and approve any real action.</small></span></div>
            </section>
          )}

          {section === "Approvals" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Approval inbox</h2><p>Sample drafts only. Decisions below do not leave this page.</p></div><div className={styles.filterGroup} role="group" aria-label="Filter approval drafts">{(["All", "Listings", "Reviews"] as const).map((filter) => <button className={approvalFilter === filter ? styles.filterSelected : ""} type="button" key={filter} onClick={() => setApprovalFilter(filter)}>{filter}</button>)}</div></div>
              <ApprovalList approvals={filteredApprovals} onReview={setSelectedApproval} />
            </section>
          )}

          {section === "Audit trail" && (
            <section className={styles.sectionSurface}>
              <div className={styles.sectionToolbar}><div><h2>Audit trail</h2><p>Local preview actions from this browser session.</p></div><span className={styles.disabledPill}>No external writes</span></div>
              <div className={styles.auditList}>{activity.map((event, index) => <div className={styles.auditRow} key={`${event}-${index}`}><span className={styles.auditMarker}>{index === 0 ? <Activity size={15} /> : <Check size={14} />}</span><span><strong>{event.split(" · ")[0]}</strong><small>{event.split(" · ").slice(1).join(" · ")}</small></span><time>{index === 0 ? "Just now" : "Today"}</time></div>)}</div>
            </section>
          )}
        </main>
      </div>

      {selectedApproval && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedApproval(null); }}><section className={styles.reviewDialog} role="dialog" aria-modal="true" aria-labelledby="review-title"><div className={styles.dialogHeader}><span className={styles.approvalIcon}><FileCheck2 size={18} /></span><button type="button" className={styles.iconButton} aria-label="Close review" onClick={() => setSelectedApproval(null)}><X size={18} /></button></div><span className={styles.panelEyebrow}>SYNTHETIC SAMPLE · {selectedApproval.area.toUpperCase()}</span><h2 id="review-title">{selectedApproval.title}</h2><p>{selectedApproval.detail}</p><div className={styles.dialogNotice}><ShieldCheck size={16} /> Your choice only changes this browser preview. No profile or review will be updated.</div><div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={() => decideApproval("changes")}>Request changes</button><button type="button" className={styles.primaryButton} onClick={() => decideApproval("approved")}><Check size={15} /> Approve sample</button></div></section></div>}
      {toast && <div className={styles.toast} role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  );
}

function ApprovalList({ approvals, onReview }: { approvals: Approval[]; onReview: (approval: Approval) => void }) {
  if (approvals.length === 0) return <div className={styles.emptyApprovals}><CheckCircle2 size={19} /><strong>No sample approvals in this filter</strong><span>Choose another filter to see the remaining demo items.</span></div>;
  return <div className={styles.approvalList}>{approvals.map((approval) => <article className={styles.approvalRow} key={approval.id}>
    <span className={approval.area === "Listings" ? styles.approvalIcon : styles.approvalIconBlue}>{approval.area === "Listings" ? <FileCheck2 size={17} /> : <MessageSquareText size={17} />}</span>
    <div className={styles.approvalDetails}><div className={styles.approvalMeta}><span>{approval.area}</span><span>Sample only</span></div><h3>{approval.title}</h3><p>{approval.detail}</p></div>
    <div className={styles.approvalRight}>{approval.status === "pending" ? <span className={styles.pendingStatus}>Needs review</span> : <span className={styles.doneStatus}>{approval.status === "approved" ? "Approved in demo" : "Changes requested"}</span>}{approval.status === "pending" && <button type="button" className={styles.rowAction} onClick={() => onReview(approval)}>Review <ArrowRight size={14} /></button>}</div>
  </article>)}</div>;
}
