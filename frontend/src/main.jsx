import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertTriangle, ArrowUpRight, Calendar, CheckCircle2, ChevronDown, ChevronRight,
  CircleDot, Clock3, FileText, Filter, LayoutDashboard, Loader2, Mail, MessageSquare,
  Play, RefreshCw, RotateCcw, Send, ShieldCheck, Sparkles, Target, Users, X, Zap
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STAGE_MS = 380;
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const FALLBACK_STAGES = [
  { id: 'pipeline', label: 'Scanning pipeline', detail: 'Reading 127 opportunities from the local CRM snapshot' },
  { id: 'analyze', label: 'Analyzing opportunities', detail: 'Scoring stage, deal value, and recency' },
  { id: 'gaps', label: 'Detecting follow-up gaps', detail: '18 conversations past the expected reply window' },
  { id: 'investigate', label: 'Investigating high-risk deals', detail: 'Opening Acme Corporation, NovaTech, and Zenly Systems' },
  { id: 'signals', label: 'Evaluating risk signals', detail: 'Linking inactivity, objections, missed commitments, and deadlines' },
  { id: 'decide', label: 'Selecting next-best actions', detail: 'Choosing from FOLLOW_UP, CALL, ADDRESS_OBJECTION, SEND_CASE_STUDY, ESCALATE, MONITOR' },
  { id: 'prepare', label: 'Preparing interventions', detail: 'Queuing context-aware follow-ups for the priority list' },
];

const getFormattedHeaderDate = () => {
  const date = new Date(2026, 7, 30); // August 30, 2026 is Sunday
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday} · ${month} ${day}, ${year}`;
};

function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState('acme');
  const [detail, setDetail] = useState(null);
  const [running, setRunning] = useState(false);
  const [scanCompletedMsg, setScanCompletedMsg] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [variant, setVariant] = useState(0);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState(null);

  // Navigation, Inspector, Simulator & Demo State
  const [navTab, setNavTab] = useState('overview');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [animatingSim, setAnimatingSim] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(-1);
  const [expandedStages, setExpandedStages] = useState({
    signal: true,
    risk: true,
    decision: true,
    action: true,
  });

  const stages = data?.scan_stages?.length ? data.scan_stages : FALLBACK_STAGES;

  const load = async () => {
    const r = await fetch(API + '/api/dashboard');
    setData(await r.json());
  };

  const loadDetail = async (id) => {
    setSelected(id);
    setResult(null);
    setComposerOpen(false);
    setEditing(false);
    setVariant(0);
    const r = await fetch(API + '/api/leads/' + id);
    const j = await r.json();
    setDetail(j);
    setSubject(j.subject);
    setBody(j.draft);
  };

  useEffect(() => {
    load().then(() => loadDetail('acme'));
  }, []);

  const scan = async () => {
    if (running) return;
    setRunning(true);
    setScanCompletedMsg(false);
    setStageIndex(0);
    setComposerOpen(false);
    const list = stages;
    for (let i = 0; i < list.length; i++) {
      setStageIndex(i);
      await new Promise((r) => setTimeout(r, STAGE_MS));
    }
    await fetch(API + '/api/scan', { method: 'POST' });
    await load();
    await loadDetail(selected);
    setStageIndex(list.length);
    await new Promise((r) => setTimeout(r, 420));
    setRunning(false);
    setStageIndex(-1);
    setScanCompletedMsg(true);
    setTimeout(() => setScanCompletedMsg(false), 4000);
  };

  const runSimulation = async (scenarioId) => {
    setSimulatorModalOpen(false);
    setAnimatingSim(true);
    setSimStepIndex(0);
    const stepsCount = 5;
    for (let i = 0; i < stepsCount; i++) {
      setSimStepIndex(i);
      await new Promise((r) => setTimeout(r, 360));
    }
    await fetch(API + '/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: selected, scenario_id: scenarioId }),
    });
    await load();
    await loadDetail(selected);
    setAnimatingSim(false);
    setSimStepIndex(-1);
  };

  const resetDemo = async () => {
    await fetch(API + '/api/reset', { method: 'POST' });
    await load();
    await loadDetail('acme');
    setResult(null);
    setComposerOpen(false);
    setScanCompletedMsg(false);
  };

  const openComposer = () => {
    if (!detail) return;
    const d = detail.drafts[variant] || detail.drafts[0];
    setSubject(d.subject);
    setBody(d.body);
    setComposerOpen(true);
    setEditing(false);
  };

  const regenerate = () => {
    if (!detail?.drafts?.length) return;
    const next = (variant + 1) % detail.drafts.length;
    setVariant(next);
    setSubject(detail.drafts[next].subject);
    setBody(detail.drafts[next].body);
    setEditing(false);
  };

  const execute = async () => {
    if (detail?.lead?.intervention_completed) return;
    const r = await fetch(API + '/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: selected, action_type: detail.lead.action, content: body, subject }),
    });
    const j = await r.json();
    setResult(j.action);
    setComposerOpen(false);
    setData((d) => ({
      ...d,
      leads: d.leads.map((x) => (x.id === selected ? j.updated_lead : x)),
      recent_actions: j.already_completed ? d.recent_actions : [j.action, ...(d.recent_actions || [])],
      estimated_recovery_opportunity: j.estimated_recovery_opportunity,
      revenue_at_risk: j.revenue_at_risk,
      at_risk_deals: j.at_risk_deals,
    }));

    await loadDetail(selected);
  };

  const toggleStage = (key) => {
    setExpandedStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSignal = (signal) => {
    setSelectedSignal((curr) => (curr === signal ? null : signal));
  };

  const selectLeadAndNavigate = (id, tab = 'overview') => {
    loadDetail(id);
    if (tab) setNavTab(tab);
  };

  if (!data || !detail)
    return (
      <div className="loading">
        <div>
          <Sparkles size={22} />
          <span>Initializing RE:ACT Agent...</span>
        </div>
      </div>
    );

  const lead = detail.lead;
  const nba = detail.next_best_action;
  const confidence = Math.round((nba?.confidence || 0) * 100);

  // Inspector & Decision path fallbacks
  const inspector = detail.inspector || {
    signal_agent: {
      input_interactions: lead.interaction_count || 3,
      total_signals: lead.signal_count || 14,
      detected_signals: lead.signals || [],
    },
    risk_agent: {
      prior_risk: lead.prior_risk || 72,
      current_risk: lead.risk,
      drivers: detail.agent_reasoning || [],
    },
    decision_agent: {
      candidate_actions: ['FOLLOW_UP', 'CALL', 'ADDRESS_OBJECTION', 'MONITOR'],
      selected: lead.action,
      confidence: nba?.confidence || 0.86,
      why: nba?.why || lead.reason,
    },
    action_agent: {
      prepared: 'Personalized follow-up',
      uses: ['buyer name', 'pricing objection', 'missed commitment', 'procurement deadline', 'previous conversation'],
      status: lead.intervention_completed ? 'EXECUTED' : 'READY FOR APPROVAL',
    },
  };

  const decisionPath = detail.decision_path || {
    nodes: ['Pricing objection', 'Missed commitment', '6 days inactivity', 'Procurement deadline'],
    synthesis: 'HIGH URGENCY = FOLLOW UP TODAY',
  };

  return (
    <div className="app">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            <Zap size={17} />
          </div>
          <div>
            <b>RE:ACT</b>
            <span>DEAL RESCUE AGENT</span>
          </div>
        </div>
        <div className="agent-pill">
          <span className="live-dot" /> LOCAL INTELLIGENCE <ShieldCheck size={14} />
        </div>
        <nav>
          <a className={navTab === 'overview' ? 'active' : ''} onClick={() => setNavTab('overview')}>
            <LayoutDashboard size={17} /> Overview
          </a>
          <a className={navTab === 'pipeline' ? 'active' : ''} onClick={() => setNavTab('pipeline')}>
            <Target size={17} /> Pipeline
          </a>
          <a className={navTab === 'at_risk' ? 'active' : ''} onClick={() => setNavTab('at_risk')}>
            <AlertTriangle size={17} /> At Risk <em>{data.at_risk_deals}</em>
          </a>
          <a className={navTab === 'followups' ? 'active' : ''} onClick={() => setNavTab('followups')}>
            <Clock3 size={17} /> Follow-ups <em>18</em>
          </a>
          <a className={navTab === 'actions' ? 'active' : ''} onClick={() => setNavTab('actions')}>
            <Send size={17} /> Actions
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-card">
            <Sparkles size={16} />
            <div>
              <b>{running ? 'SCANNING PIPELINE' : 'RE:ACT AGENT'}</b>
              <span>
                {running
                  ? 'Evaluating 127 opportunities'
                  : `${data.at_risk_deals} priority interventions ready`}
              </span>
            </div>
          </div>
          <div className="sidebar-footer-row">
            <small>Local Intelligence · Demo Environment</small>
            <button className="reset-demo-btn" onClick={resetDemo} title="Reset demo state to initial baseline">
              <RotateCcw size={11} /> Reset demo
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {/* HEADER WITH CORRECT DATE (SUNDAY · AUG 30, 2026) */}
        <header>
          <div>
            <div className="eyebrow">{getFormattedHeaderDate()}</div>
            <h1>
              {navTab === 'overview' && 'Deal Rescue Center'}
              {navTab === 'pipeline' && 'Surfaced Opportunities Pipeline'}
              {navTab === 'at_risk' && 'High Risk Interventions Queue'}
              {navTab === 'followups' && 'Scheduled & Overdue Follow-ups'}
              {navTab === 'actions' && 'Agent Intervention Audit Log'}
            </h1>
            <p>
              {navTab === 'overview' && "Find deals that are quietly dying and intervene before they're lost."}
              {navTab === 'pipeline' && 'Full CRM snapshot listing 127 opportunities evaluated by Signal Agent.'}
              {navTab === 'at_risk' && 'Prioritized critical & high risk opportunities requiring human review.'}
              {navTab === 'followups' && 'Actionable follow-up schedule categorized by urgency.'}
              {navTab === 'actions' && 'Completed interventions and local audit history.'}
            </p>
          </div>
          <div className="header-action-group">
            <button className={`primary run-scan-btn ${running ? 'is-scanning' : ''}`} onClick={scan} disabled={running}>
              {running ? <Loader2 size={16} className="spin-icon" /> : <Play size={16} />}
              {running ? 'Scanning pipeline…' : 'Run deal scan'}
              {!running && <ChevronRight size={16} />}
            </button>
            {scanCompletedMsg && (
              <span className="scan-toast">
                <CheckCircle2 size={13} /> {data.at_risk_deals} interventions ready
              </span>
            )}
          </div>
        </header>

        {/* EXECUTIVE METRICS ROW */}
        <section className="metrics">
          <Metric icon={<Users />} label="Active opportunities" value="127" />
          <Metric icon={<Clock3 />} label="Overdue follow-ups" value="18" tone="warn" />
          <Metric icon={<AlertTriangle />} label="Deals at risk" value={data.at_risk_deals} tone="danger" />
          <Metric icon={<ArrowUpRight />} label="Revenue at risk" value={money(data.revenue_at_risk)} tone="danger" hint="Priority interventions identified" />
          <Metric
            icon={<Target />}
            label="Estimated recovery opportunity"
            value={money(data.estimated_recovery_opportunity)}
            hint="From this demo dataset"
          />
        </section>

        {/* VIEW 1: OVERVIEW */}
        {navTab === 'overview' && (
          <section className="grid">
            {/* LEFT: PRIORITY QUEUE */}
            <div className="panel pipeline">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">PRIORITY QUEUE</span>
                  <h2>Deals that need you</h2>
                </div>
                <span className="count">{data.leads.length} surfaced</span>
              </div>
              {running && <ScanPanel stages={stages} index={stageIndex} />}
              <div className={'lead-list ' + (running ? 'dimmed' : '')}>
                {data.leads.map((item) => (
                  <button
                    key={item.id}
                    className={'lead-row ' + (selected === item.id ? 'selected' : '')}
                    onClick={() => loadDetail(item.id)}
                    disabled={running}
                  >
                    <div className="risk-dot" data-level={item.risk_level}></div>
                    <div className="lead-main">
                      <div className="lead-title">
                        <b>{item.company}</b>
                        <span>{money(item.deal_value)}</span>
                      </div>
                      <div className="lead-sub">
                        <span>{item.contact}</span>
                        <span>·</span>
                        <span>{item.last_contact_days}d since contact</span>
                        {item.intervention_completed ? (
                          <span className="pill-mini monitoring">Monitoring</span>
                        ) : (
                          <span className={`pill-mini ${item.risk_level.toLowerCase()}`}>{item.status}</span>
                        )}
                      </div>
                      <div className="signal-row">
                        {item.signals.slice(0, 2).map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="risk-score">
                      <b>{item.risk}</b>
                      <span>risk</span>
                    </div>
                    <ChevronRight className="chev" size={17} />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: DEAL DETAIL + SIGNATURE AGENT INSPECTOR */}
            <DetailPanel
              lead={lead}
              detail={detail}
              nba={nba}
              confidence={confidence}
              inspector={inspector}
              decisionPath={decisionPath}
              expandedStages={expandedStages}
              toggleStage={toggleStage}
              selectedSignal={selectedSignal}
              toggleSignal={toggleSignal}
              openComposer={openComposer}
              result={result}
              openSimulator={() => setSimulatorModalOpen(true)}
              animatingSim={animatingSim}
              simStepIndex={simStepIndex}
            />
          </section>
        )}

        {/* VIEW 2: PIPELINE */}
        {navTab === 'pipeline' && (
          <section className="panel nav-view">
            <div className="panel-head">
              <div>
                <span className="eyebrow">CRM OPPORTUNITIES</span>
                <h2>Surfaced Pipeline Deals ({data.leads.length})</h2>
              </div>
              <span className="count">127 Total Opportunities</span>
            </div>
            <div className="view-table-wrapper">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th>Risk Level</th>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Deal Value</th>
                    <th>Stage</th>
                    <th>Last Interaction</th>
                    <th>Recommended Action</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((item) => (
                    <tr key={item.id} className={selected === item.id ? 'highlighted-row' : ''}>
                      <td>
                        <span className={`severity ${item.risk_level.toLowerCase()}`}>{item.risk_level} ({item.risk})</span>
                      </td>
                      <td>
                        <b>{item.company}</b>
                      </td>
                      <td>{item.contact}</td>
                      <td>{money(item.deal_value)}</td>
                      <td>{item.stage}</td>
                      <td>{item.last_contact_days} days ago</td>
                      <td>
                        <span className="code-pill">{item.action_label}</span>
                      </td>
                      <td>
                        <span className="status-chip">{item.intervention_completed ? 'Monitoring' : item.status}</span>
                      </td>
                      <td>
                        <button
                          className="secondary compact"
                          onClick={() => selectLeadAndNavigate(item.id, 'overview')}
                        >
                          Inspect <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VIEW 3: AT RISK */}
        {navTab === 'at_risk' && (
          <section className="panel nav-view">
            <div className="panel-head">
              <div>
                <span className="eyebrow">URGENT INTERVENTIONS</span>
                <h2>High &amp; Critical Risk Deals (Risk ≥ 70)</h2>
              </div>
              <span className="count danger">{data.at_risk_deals} At Risk</span>
            </div>
            <div className="at-risk-grid">
              {data.leads
                .filter((x) => x.risk >= 70 && !x.intervention_completed)
                .map((item) => (
                  <div key={item.id} className="risk-card">
                    <div className="risk-card-head">
                      <div>
                        <h3>{item.company}</h3>
                        <span>{item.contact} · {item.stage}</span>
                      </div>
                      <div className="risk-badge-large">
                        <b>{item.risk}</b>
                        <small>/100</small>
                      </div>
                    </div>
                    <div className="risk-val-row">
                      <span>Value: <strong>{money(item.deal_value)}</strong></span>
                      <span>Last Contact: <strong>{item.last_contact_days} days ago</strong></span>
                    </div>
                    <div className="signals-preview">
                      <div className="lbl">Key Risk Signals:</div>
                      <ul>
                        {item.signals.map((s) => (
                          <li key={s}><AlertTriangle size={12} /> {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="risk-card-action">
                      <div>
                        <span className="lbl">Next Best Action:</span>
                        <b>{item.action_label}</b>
                      </div>
                      <button className="primary" onClick={() => selectLeadAndNavigate(item.id, 'overview')}>
                        Inspect &amp; Intervene <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* VIEW 4: FOLLOW-UPS */}
        {navTab === 'followups' && (
          <section className="panel nav-view">
            <div className="panel-head">
              <div>
                <span className="eyebrow">ACTION SCHEDULE</span>
                <h2>Follow-up Queue &amp; Reminders</h2>
              </div>
              <span className="count">Categorized by Urgency</span>
            </div>

            <div className="followup-sections">
              {/* TODAY */}
              <div className="followup-group today">
                <div className="group-title">
                  <Clock3 size={16} />
                  <h3>DUE TODAY</h3>
                  <span className="grp-count">2 Deals</span>
                </div>
                <div className="group-cards">
                  <div className="followup-card">
                    <div className="card-top">
                      <b>Acme Corporation</b>
                      <span className="severity critical">CRITICAL</span>
                    </div>
                    <p>Missed revised pricing commitment before procurement review next Tuesday.</p>
                    <div className="card-btn-row">
                      <span>Contact: Rahul Sharma</span>
                      <button className="primary compact" onClick={() => selectLeadAndNavigate('acme', 'overview')}>
                        Send Pricing Draft <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="followup-card">
                    <div className="card-top">
                      <b>NovaTech</b>
                      <span className="severity critical">CRITICAL</span>
                    </div>
                    <p>Competitor 12% gap unresolved. Shortlist freeze this Friday.</p>
                    <div className="card-btn-row">
                      <span>Contact: Priya Menon</span>
                      <button className="primary compact" onClick={() => selectLeadAndNavigate('novatech', 'overview')}>
                        Address Objection <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OVERDUE */}
              <div className="followup-group overdue">
                <div className="group-title">
                  <AlertTriangle size={16} />
                  <h3>OVERDUE (PAST REPLY WINDOW)</h3>
                  <span className="grp-count">18 Conversations</span>
                </div>
                <div className="group-cards">
                  <div className="followup-card">
                    <div className="card-top">
                      <b>Zenly Systems</b>
                      <span className="severity high">HIGH</span>
                    </div>
                    <p>4 days inactive after champion requested finance stakeholder call.</p>
                    <div className="card-btn-row">
                      <span>Contact: Arjun Rao</span>
                      <button className="secondary compact" onClick={() => selectLeadAndNavigate('zenly', 'overview')}>
                        Schedule Call <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPCOMING */}
              <div className="followup-group upcoming">
                <div className="group-title">
                  <Calendar size={16} />
                  <h3>UPCOMING &amp; SCHEDULED</h3>
                  <span className="grp-count">Ongoing</span>
                </div>
                <div className="group-cards">
                  <div className="followup-card">
                    <div className="card-top">
                      <b>Orbit Retail</b>
                      <span className="severity watch">WATCH</span>
                    </div>
                    <p>Requested multi-store retail case study proof asset.</p>
                    <div className="card-btn-row">
                      <span>Contact: Neha Kapoor</span>
                      <button className="secondary compact" onClick={() => selectLeadAndNavigate('orbit', 'overview')}>
                        Send Case Study <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="followup-card">
                    <div className="card-top">
                      <b>Delta Labs</b>
                      <span className="severity watch">WATCH</span>
                    </div>
                    <p>Monitoring positive sentiment while internal timeline is confirmed.</p>
                    <div className="card-btn-row">
                      <span>Contact: Sameer Shah</span>
                      <button className="secondary compact" onClick={() => selectLeadAndNavigate('delta', 'overview')}>
                        View Monitoring <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 5: ACTIONS */}
        {navTab === 'actions' && (
          <section className="panel nav-view">
            <div className="panel-head">
              <div>
                <span className="eyebrow">INTERVENTION LOG</span>
                <h2>Agent Executed Actions History</h2>
              </div>
              <span className="count">{data.recent_actions?.length || 0} Recorded Actions</span>
            </div>
            <div className="actions-history-list">
              {data.recent_actions?.length > 0 ? (
                data.recent_actions.map((act) => (
                  <div key={act.id} className="action-history-card">
                    <div className="act-head">
                      <span className="act-type">{act.success_label}</span>
                      <time>{act.timestamp}</time>
                    </div>
                    <div className="act-body">
                      <b>{act.company}</b>
                      <div className="act-subj">Subject: "{act.subject}"</div>
                      <pre className="act-content">{act.content}</pre>
                    </div>
                    <div className="act-foot">
                      <span>Next Follow-up Scheduled: <strong>{act.next_follow_up_on} ({act.next_follow_up_days} days)</strong></span>
                      <span className="status-executed">✓ EXECUTED LOCALLY</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-actions">
                  <FileText size={32} />
                  <b>No interventions executed yet in this session</b>
                  <p>Inspect a high-risk opportunity on the dashboard and click "Approve &amp; Send" to queue an intervention action.</p>
                  <button className="primary" onClick={() => setNavTab('overview')}>Go to Dashboard</button>
                </div>
              )}
            </div>
          </section>
        )}

        <footer>
          <span>
            <CircleDot size={12} /> RE:ACT · Local Intelligence
          </span>
          <span>Built for Product Space AI Product Hackathon</span>
        </footer>
      </main>

      {/* COMPOSER MODAL POLISH */}
      {composerOpen && (
        <div className="modal-back" onClick={() => setComposerOpen(false)}>
          <div className="composer" onClick={(e) => e.stopPropagation()}>
            <div className="composer-head">
              <div>
                <span className="eyebrow">PERSONALIZED FOLLOW-UP</span>
                <h3>{lead.company}</h3>
              </div>
              <button className="icon-btn" onClick={() => setComposerOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="composer-meta">
              <div>
                <span>To</span>
                <b>
                  {lead.contact} · {lead.email}
                </b>
              </div>
              <div>
                <span>Context</span>
                <b>
                  {[
                    lead.objection && 'objection',
                    lead.previous_commitment && 'missed commitment',
                    lead.deadline && 'deadline',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </b>
              </div>
            </div>
            <label className="field">
              <span>Subject</span>
              {editing ? (
                <input value={subject} onChange={(e) => setSubject(e.target.value)} />
              ) : (
                <div className="readonly">{subject}</div>
              )}
            </label>
            <label className="field grow">
              <span>Message</span>
              {editing ? (
                <textarea value={body} onChange={(e) => setBody(e.target.value)} />
              ) : (
                <pre className="readonly pre">{body}</pre>
              )}
            </label>
            <div className="composer-actions">
              <button className="secondary" onClick={() => setEditing((e) => !e)} disabled={lead.intervention_completed}>
                {editing ? 'Done editing' : 'Edit'}
              </button>
              <button className="secondary" onClick={regenerate} disabled={lead.intervention_completed}>
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button className="primary highlight-send-btn" onClick={execute} disabled={lead.intervention_completed || !!result}>
                <Send size={16} />
                {lead.intervention_completed ? 'Intervention Already Completed' : 'Approve & Send'}
              </button>
            </div>
            <p className="composer-note">
              {lead.intervention_completed
                ? 'This intervention has already been executed. Local records cannot be duplicated.'
                : 'Sends locally — no external email. Records the intervention and schedules the next follow-up.'}
            </p>
          </div>
        </div>
      )}

      {/* SIMULATOR MODAL */}
      {simulatorModalOpen && (
        <div className="modal-back" onClick={() => setSimulatorModalOpen(false)}>
          <div className="sim-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sim-modal-head">
              <div>
                <span className="eyebrow">NEW CUSTOMER SIGNAL · RE:ACT WILL RE-EVALUATE THE DEAL</span>
                <h3>Inject Operational Customer Event into {lead.company}</h3>
              </div>
              <button className="icon-btn" onClick={() => setSimulatorModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="sim-intro">
              Select a real-world scenario to observe how RE:ACT's agents re-evaluate deal risk, update decision policies, and prepare adaptive follow-ups in real time.
            </p>
            <div className="scenario-list">
              <div className="scenario-card primary-scenario" onClick={() => runSimulation('competitor_undercut')}>
                <div className="scen-top">
                  <span className="scen-title">A. Competitor Undercuts Price</span>
                  <span className="scen-badge">PRIMARY DEMO SCENARIO</span>
                </div>
                <p className="scen-text">
                  "Hi Amit — we received a competing quote that is about 15% lower. Can you help us understand the difference before procurement?"
                </p>
                <div className="scen-impact">
                  <span>Risk Impact: <strong>Risk → 91 (+22 Pressure)</strong></span>
                  <span>Policy Shift: <strong>FOLLOW_UP → ADDRESS_OBJECTION</strong></span>
                </div>
              </div>

              <div className="scenario-card" onClick={() => runSimulation('meeting_moved')}>
                <div className="scen-top">
                  <span className="scen-title">B. Procurement Meeting Moved to Tomorrow</span>
                </div>
                <p className="scen-text">
                  "Hi Amit — procurement moved our review meeting up to tomorrow morning. Can you resend the final proposal pack today?"
                </p>
                <div className="scen-impact">
                  <span>Risk Impact: <strong>89 Risk (Critical Urgency)</strong></span>
                  <span>Policy Shift: <strong>Accelerated Proposal Follow-up</strong></span>
                </div>
              </div>

              <div className="scenario-card" onClick={() => runSimulation('proof_requested')}>
                <div className="scen-top">
                  <span className="scen-title">C. Customer Asks for Implementation Proof</span>
                </div>
                <p className="scen-text">
                  "Hi Amit — our tech team is asking for a customer reference story from a similar enterprise rollout before we finalize."
                </p>
                <div className="scen-impact">
                  <span>Risk Impact: <strong>78 Risk (Proof Gap)</strong></span>
                  <span>Policy Shift: <strong>SEND_CASE_STUDY</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SUBCOMPONENT: DEAL DETAIL PANEL WITH AGENT REASONING INSPECTOR
function DetailPanel({
  lead,
  detail,
  nba,
  confidence,
  inspector,
  decisionPath,
  expandedStages,
  toggleStage,
  selectedSignal,
  toggleSignal,
  openComposer,
  result,
  openSimulator,
  animatingSim,
  simStepIndex,
}) {
  return (
    <div className="panel detail">
      {/* AGENT INVESTIGATION HEADER WITH COMPLETE SUMMARY */}
      <div className="panel-head main-investigation-head">
        <div>
          <span className="eyebrow">AGENT INVESTIGATION</span>
          <div className="head-title-row">
            <h2>{lead.company}</h2>
            <b className="head-deal-val">{money(lead.deal_value)}</b>
          </div>
          <span className="head-recommendation">
            {lead.action === 'ADDRESS_OBJECTION' ? 'Objection response recommended' : 'Follow-up recommended'}
          </span>
        </div>
        <div className="head-right-actions">
          {lead.id === 'acme' && (
            <button className="secondary compact sim-trigger-btn" onClick={openSimulator}>
              <Zap size={14} className="sim-zap-icon" /> Simulate customer signal
            </button>
          )}
          <div className="head-risk-badge">
            <span className={'severity ' + lead.risk_level.toLowerCase()}>{lead.risk_level}</span>
            <span className="head-risk-num">Risk <b>{lead.risk}</b></span>
          </div>
        </div>
      </div>

      {/* SIMULATOR ANIMATED SEQUENCE OVERLAY */}
      {animatingSim && (
        <div className="sim-sequence-banner">
          <div className="sim-head">
            <span className="live-dot" />
            <b>NEW CUSTOMER SIGNAL · RE:ACT WILL RE-EVALUATE THE DEAL</b>
            <span>Local Intelligence · Deterministic</span>
          </div>
          <ol className="sim-steps">
            <li className={simStepIndex >= 0 ? (simStepIndex > 0 ? 'done' : 'active') : ''}>
              <span className="marker">1</span>
              <div>
                <b>NEW SIGNAL RECEIVED</b>
                <span>Inbound buyer message detected</span>
              </div>
            </li>
            <li className={simStepIndex >= 1 ? (simStepIndex > 1 ? 'done' : 'active') : ''}>
              <span className="marker">2</span>
              <div>
                <b>SIGNAL AGENT</b>
                <span>Pricing pressure &amp; competitor gap extracted</span>
              </div>
            </li>
            <li className={simStepIndex >= 2 ? (simStepIndex > 2 ? 'done' : 'active') : ''}>
              <span className="marker">3</span>
              <div>
                <b>RISK AGENT</b>
                <span>Re-evaluating deal risk (69 → 91)</span>
              </div>
            </li>
            <li className={simStepIndex >= 3 ? (simStepIndex > 3 ? 'done' : 'active') : ''}>
              <span className="marker">4</span>
              <div>
                <b>DECISION AGENT</b>
                <span>ADDRESS_OBJECTION selected (91% confidence)</span>
              </div>
            </li>
            <li className={simStepIndex >= 4 ? (simStepIndex > 4 ? 'done' : 'active') : ''}>
              <span className="marker">5</span>
              <div>
                <b>ACTION AGENT</b>
                <span>Preparing personalized commercial response</span>
              </div>
            </li>
          </ol>
        </div>
      )}

      <div className="deal-meta">
        <b>{money(lead.deal_value)}</b>
        <span>{lead.stage}</span>
        <span>·</span>
        <span>Contact: {lead.contact}</span>
        <span>·</span>
        <span className="status-chip">{lead.status}</span>
      </div>

      <div className="risk-box">
        <div className="risk-number">
          <span>DEAL RISK SCORE</span>
          <b>{lead.risk}</b>
          <small>/100</small>
        </div>
        <div className="risk-bar">
          <div style={{ width: `${lead.risk}%` }}></div>
        </div>
      </div>

      {/* WHY AT RISK */}
      <div className="section">
        <div className="section-title">
          <AlertTriangle size={16} /> Why this deal is at risk
        </div>
        <div className="signals">
          {lead.signals.map((s) => (
            <div
              key={s}
              className={`signal-item ${selectedSignal === s ? 'active-filter' : ''}`}
              onClick={() => toggleSignal(s)}
              style={{ cursor: 'pointer' }}
            >
              <CheckCircle2 size={15} />
              {s}
            </div>
          ))}
        </div>
        <ul className="reasoning">
          {detail.agent_reasoning.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {/* CONVERSATION EVIDENCE */}
      <div className="section">
        <div className="section-title-between">
          <div className="section-title">
            <MessageSquare size={16} /> Conversation evidence
          </div>
          {selectedSignal && (
            <button className="clear-filter-btn" onClick={() => toggleSignal(selectedSignal)}>
              <X size={12} /> Clear signal highlight ({selectedSignal})
            </button>
          )}
        </div>
        <div className="evidence-list">
          {detail.evidence.map((ev) => {
            const isMatched = selectedSignal && ev.signals.includes(selectedSignal);
            return (
              <article key={ev.id} className={`evidence ${isMatched ? 'highlighted' : ''} ${ev.kind === 'NEW SIGNAL' ? 'sim-evidence-card' : ''}`}>
                <div className="evidence-top">
                  <span className={`kind ${ev.kind === 'NEW SIGNAL' ? 'kind-new-signal' : ''}`}>{ev.kind}</span>
                  <span>{ev.title}</span>
                  <time>{ev.date}</time>
                </div>
                <p>{ev.excerpt}</p>
                <div className="signal-chips">
                  {ev.signals.map((s) => (
                    <span
                      key={s}
                      data-signal={s}
                      className={selectedSignal === s ? 'active-signal-chip' : ''}
                      onClick={() => toggleSignal(s)}
                      style={{ cursor: 'pointer' }}
                      title="Click to highlight related evidence"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* PART 3 & 10: VISUAL DECISION PATH BANNER WITH TRANSITION RECONCILIATION */}
      <div className="section path-section">
        <div className="section-title">
          <Activity size={16} /> Visual Decision Path
        </div>
        <div className="decision-path-box">
          <div className="path-flow">
            <div className="flow-step">CONVERSATION</div>
            <ChevronRight size={14} className="flow-arr" />
            <div className="flow-step">SIGNALS</div>
            <ChevronRight size={14} className="flow-arr" />
            <div className="flow-step risk">
              {lead.prior_risk && lead.prior_risk !== lead.risk ? (
                <span>RISK {lead.prior_risk} → {lead.risk}</span>
              ) : (
                <span>RISK = {lead.risk}</span>
              )}
            </div>
            <ChevronRight size={14} className="flow-arr" />
            <div className="flow-step nba">{nba?.code || 'NEXT BEST ACTION'}</div>
            <ChevronRight size={14} className="flow-arr" />
            <div className="flow-step intervention">INTERVENTION</div>
          </div>
          <div className="path-synthesis">
            <Zap size={14} className="syn-icon" />
            <span>
              <strong>Evidence Formula: </strong>
              {decisionPath.nodes.join(' + ')} &nbsp;=&nbsp;
              <em className="syn-result">{decisionPath.synthesis}</em>
            </span>
          </div>
        </div>
      </div>

      {/* PART 2 & 9: SIGNATURE 4-STAGE AGENT REASONING INSPECTOR */}
      <div className="section inspector-section">
        <div className="section-title">
          <Sparkles size={16} /> Agent Reasoning Inspector
        </div>
        <div className="inspector-accordion-group">
          {/* STAGE 1: SIGNAL AGENT */}
          <div className={`inspector-stage ${expandedStages.signal ? 'open' : ''}`}>
            <button className="stage-header" onClick={() => toggleStage('signal')}>
              <div className="stage-header-title">
                <span className="stage-num">1</span>
                <b>SIGNAL AGENT</b>
                <span className="stage-badge">
                  {inspector.signal_agent.total_signals} Signals Extracted
                </span>
              </div>
              <ChevronDown className={`stage-arrow ${expandedStages.signal ? 'rotated' : ''}`} size={16} />
            </button>
            {expandedStages.signal && (
              <div className="stage-body">
                <div className="inspector-meta-row">
                  <span>Input: <strong>{inspector.signal_agent.input_interactions} interactions</strong></span>
                  <span>Extracted: <strong>{inspector.signal_agent.total_signals} signals</strong></span>
                </div>
                <div className="inspector-lbl">Detected Risk Signals (Click to filter evidence):</div>
                <div className="signal-tags-grid">
                  {inspector.signal_agent.detected_signals.map((s) => (
                    <button
                      key={s}
                      className={`tag-pill ${selectedSignal === s ? 'active-filter' : ''}`}
                      onClick={() => toggleSignal(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STAGE 2: RISK AGENT */}
          <div className={`inspector-stage ${expandedStages.risk ? 'open' : ''}`}>
            <button className="stage-header" onClick={() => toggleStage('risk')}>
              <div className="stage-header-title">
                <span className="stage-num">2</span>
                <b>RISK AGENT</b>
                <span className="stage-badge danger">
                  Score: {inspector.risk_agent.prior_risk} → {inspector.risk_agent.current_risk}
                </span>
              </div>
              <ChevronDown className={`stage-arrow ${expandedStages.risk ? 'rotated' : ''}`} size={16} />
            </button>
            {expandedStages.risk && (
              <div className="stage-body">
                <div className="score-comparison">
                  <div className="score-box">
                    <span>Prior Risk</span>
                    <b>{inspector.risk_agent.prior_risk}/100</b>
                  </div>
                  <div className="score-arrow">→</div>
                  <div className="score-box current">
                    <span>Current Risk</span>
                    <b className={lead.risk >= 70 ? 'risk-high' : 'risk-moderate'}>{inspector.risk_agent.current_risk}/100</b>
                  </div>
                </div>
                <div className="inspector-lbl">Risk Drivers:</div>
                <ul className="driver-list">
                  {inspector.risk_agent.drivers.map((d) => (
                    <li key={d}>
                      <AlertTriangle size={13} /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* STAGE 3: DECISION AGENT */}
          <div className={`inspector-stage ${expandedStages.decision ? 'open' : ''}`}>
            <button className="stage-header" onClick={() => toggleStage('decision')}>
              <div className="stage-header-title">
                <span className="stage-num">3</span>
                <b>DECISION AGENT</b>
                <span className="stage-badge recommended">
                  {nba.code} ({confidence}%)
                </span>
              </div>
              <ChevronDown className={`stage-arrow ${expandedStages.decision ? 'rotated' : ''}`} size={16} />
            </button>
            {expandedStages.decision && (
              <div className="stage-body">
                <div className="candidate-section">
                  <span className="inspector-lbl">Candidate Actions Evaluated:</span>
                  <div className="candidate-pills">
                    {inspector.decision_agent.candidate_actions.map((act) => (
                      <span
                        key={act}
                        className={`cand-pill ${act === inspector.decision_agent.selected ? 'selected' : ''}`}
                      >
                        {act} {act === inspector.decision_agent.selected ? '✓' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="decision-detail-row">
                  <div>
                    <span>Selected:</span> <strong>{nba.label}</strong> ({inspector.decision_agent.selected})
                  </div>
                  <div>
                    <span>Confidence:</span> <strong>{confidence}%</strong>
                  </div>
                </div>
                <p className="why-box">
                  <strong>Why: </strong> {inspector.decision_agent.why}
                </p>
              </div>
            )}
          </div>

          {/* STAGE 4: ACTION AGENT */}
          <div className={`inspector-stage ${expandedStages.action ? 'open' : ''}`}>
            <button className="stage-header" onClick={() => toggleStage('action')}>
              <div className="stage-header-title">
                <span className="stage-num">4</span>
                <b>ACTION AGENT</b>
                <span className={`stage-badge ${lead.intervention_completed ? 'success' : 'ready'}`}>
                  {lead.intervention_completed ? 'EXECUTED' : 'READY FOR APPROVAL'}
                </span>
              </div>
              <ChevronDown className={`stage-arrow ${expandedStages.action ? 'rotated' : ''}`} size={16} />
            </button>
            {expandedStages.action && (
              <div className="stage-body">
                <div className="action-prep">
                  <div>
                    <span>Prepared:</span> <strong>{inspector.action_agent.prepared}</strong>
                  </div>
                  <div className="uses-section">
                    <span>Uses Context:</span>
                    <div className="uses-chips">
                      {inspector.action_agent.uses.map((u) => (
                        <span key={u} className="use-chip">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="action-state-row">
                    <span>State:</span>
                    <span className={`status-tag ${lead.intervention_completed ? 'executed' : 'pending'}`}>
                      {lead.intervention_completed ? '✓ EXECUTED' : 'READY FOR APPROVAL'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDED NEXT BEST ACTION CARD */}
      <div className="section">
        <div className="section-title">
          <Target size={16} /> Next best action
        </div>
        <div className="action-card">
          <div className="action-top">
            <span>{nba.label}</span>
            <span className="recommended">{lead.intervention_completed ? 'COMPLETED' : 'RECOMMENDED'}</span>
          </div>
          <div className="nba-meta">
            <span className="code">{nba.code}</span>
            <span>Confidence {confidence}%</span>
          </div>
          <p>
            <strong>Why selected. </strong>
            {nba.why}
          </p>
          <p className="purpose">
            <strong>Expected outcome. </strong>
            {nba.purpose}
          </p>
          {lead.intervention_completed ? (
            <div className="completed-action-box">
              <div className="completed-head">
                <CheckCircle2 size={18} className="icon-success" />
                <div>
                  <b>{detail.action_history?.[0]?.label || 'INTERVENTION COMPLETED'}</b>
                  <span>Intervention completed · Next follow-up in {lead.next_follow_up_days || 3} days</span>
                  <span>Deal status: Monitoring</span>
                </div>
              </div>
              <button
                className="secondary compact"
                onClick={() => {
                  const el = document.getElementById('action-history-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <FileText size={14} /> View action history
              </button>
            </div>
          ) : (
            <button className="generate" onClick={openComposer}>
              Generate personalized message <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* GENERATED MESSAGE PREVIEW */}
      {lead.generated_message && (
        <div className="section">
          <div className="section-title">
            <Mail size={16} /> Generated message
          </div>
          <div className="draft">
            <div className="draft-head">
              <span>{lead.generated_message.subject}</span>
            </div>
            <pre>{lead.generated_message.body}</pre>
          </div>
        </div>
      )}

      {/* ACTION HISTORY (DEDUPED) */}
      {detail.action_history?.length > 0 && (
        <div className="section" id="action-history-section">
          <div className="section-title">
            <FileText size={16} /> Action history
          </div>
          <ul className="history">
            {detail.action_history
              .reduce((acc, h) => {
                if (!acc.some((x) => x.id === h.id)) acc.push(h);
                return acc;
              }, [])
              .map((h) => (
                <li key={h.id}>
                  <b>{h.label}</b>
                  <span>{h.note}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {result && (
        <div className="success-state">
          <CheckCircle2 size={18} />
          <div>
            <b>{result.success_label}</b>
            <span>Next follow-up: {result.next_follow_up_days} days</span>
            <span>Deal status: Monitoring</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanPanel({ stages, index }) {
  return (
    <div className="scan-panel">
      <div className="scan-head">
        <span className="live-dot" />
        <b>Agent execution</b>
        <span>Local intelligence · deterministic</span>
      </div>
      <ol>
        {stages.map((s, i) => (
          <li key={s.id} className={i < index ? 'done' : i === index ? 'active' : 'pending'}>
            <span className="marker">
              {i < index ? <CheckCircle2 size={14} /> : i === index ? <span className="pulse" /> : i + 1}
            </span>
            <div>
              <b>{s.label}</b>
              <span>{s.detail}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Metric({ icon, label, value, tone = '', hint }) {
  return (
    <div className={'metric ' + tone}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <b>{value}</b>
        {hint && <small className="hint">{hint}</small>}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
