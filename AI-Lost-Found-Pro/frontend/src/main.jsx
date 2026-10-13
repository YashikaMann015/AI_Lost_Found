import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://127.0.0.1:8000';

const categories = [
    'Electronics',
    'ID / Documents',
    'Keys',
    'Wallet',
    'Bag',
    'Clothing',
    'Jewellery',
    'Books',
    'Accessories',
    'Other'
];

const navItems = [
    ['overview', 'Overview'],
    ['report', 'Report an item'],
    ['matches', 'My matches']
];

function Icon({ name, size = 20 }) {
    const p = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    };

    const paths = {
        home: (
            <>
                <path {...p} d="m3 10 9-7 9 7" />
                <path {...p} d="M5 9v11h14V9" />
                <path {...p} d="M9 20v-6h6v6" />
            </>
        ),

        search: (
            <>
                <circle {...p} cx="11" cy="11" r="7" />
                <path {...p} d="m20 20-4-4" />
            </>
        ),

        plus: (
            <>
                <path {...p} d="M12 5v14M5 12h14" />
            </>
        ),

        bell: (
            <>
                <path
                    {...p}
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                />
                <path {...p} d="M10 21h4" />
            </>
        ),

        user: (
            <>
                <circle {...p} cx="12" cy="8" r="4" />
                <path {...p} d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),

        logout: (
            <>
                <path {...p} d="M10 17l5-5-5-5" />
                <path {...p} d="M15 12H3" />
                <path {...p} d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </>
        ),

        arrow: (
            <>
                <path {...p} d="M5 12h14" />
                <path {...p} d="m13 6 6 6-6 6" />
            </>
        ),

        check: (
            <>
                <path {...p} d="m5 12 4 4L19 6" />
            </>
        ),

        x: (
            <>
                <path {...p} d="m6 6 12 12M18 6 6 18" />
            </>
        ),

        spark: (
            <>
                <path
                    {...p}
                    d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
                />
                <path
                    {...p}
                    d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"
                />
            </>
        ),

        upload: (
            <>
                <path {...p} d="M12 16V4" />
                <path {...p} d="m7 9 5-5 5 5" />
                <path {...p} d="M5 20h14" />
            </>
        ),

        shield: (
            <>
                <path
                    {...p}
                    d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"
                />
                <path {...p} d="m8 12 2.5 2.5L16 9" />
            </>
        ),

        box: (
            <>
                <path {...p} d="m4 7 8-4 8 4-8 4-8-4Z" />
                <path {...p} d="M4 7v10l8 4 8-4V7M12 11v10" />
            </>
        ),

        clock: (
            <>
                <circle {...p} cx="12" cy="12" r="9" />
                <path {...p} d="M12 7v5l3 2" />
            </>
        ),

        pin: (
            <>
                <path
                    {...p}
                    d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                />
                <circle {...p} cx="12" cy="10" r="2.5" />
            </>
        ),

        chevron: <path {...p} d="m9 18 6-6-6-6" />
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24">
            {paths[name] || paths.box}
        </svg>
    );
}


/* =========================================================
   API HELPER
========================================================= */

async function api(path, options = {}) {
    const token = localStorage.getItem('lf_token');

    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const res = await fetch(API + path, {
        ...options,
        headers
    });

    const data = await res.json().catch(() => ({
        detail: 'Unexpected server response'
    }));

    if (!res.ok) {
        let message = 'Something went wrong';

        if (typeof data.detail === 'string') {
            message = data.detail;
        } else if (Array.isArray(data.detail)) {
            message = data.detail
                .map(item => {
                    const location = item.loc?.join(' → ') || 'field';
                    return `${location}: ${item.msg}`;
                })
                .join('\n');
        } else if (data.message) {
            message = data.message;
        }

        throw new Error(message);
    }

    return data;
}


function imgUrl(url) {
    if (!url) return '';
    return url.startsWith('http') ? url : API + url;
}


function scoreTone(n) {
    if (n >= 80) return 'excellent';
    if (n >= 60) return 'good';
    if (n >= 40) return 'fair';
    return 'low';
}


/* =========================================================
   APP
========================================================= */

function App() {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('lf_user') || 'null');
        } catch {
            return null;
        }
    });

    const [page, setPage] = useState('overview');
    const [auth, setAuth] = useState('login');
    const [toast, setToast] = useState('');

    const [reports, setReports] = useState([]);
    const [matches, setMatches] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(false);

    const isAdmin = user?.role === 'admin';


    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(''), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);


    useEffect(() => {
        if (user) {
            refresh();
        }
    }, [user]);


    /* =====================================================
       REFRESH DATA
    ===================================================== */

    async function refresh() {
        try {
            setLoading(true);

            if (isAdmin) {

                /*
                  IMPORTANT:
                  We don't use one Promise.all here.
        
                  If /api/admin/reports is missing,
                  it should NOT stop the pending AI queue.
                */

                try {
                    const stats = await api('/api/admin/dashboard');
                    setAdminStats(stats);
                } catch (e) {
                    console.error('Admin dashboard error:', e);
                }


                try {
                    const pendingData = await api('/api/admin/matches/pending');

                    console.log('PENDING AI MATCHES:', pendingData);

                    setPending(Array.isArray(pendingData) ? pendingData : []);
                } catch (e) {
                    console.error('Pending matches error:', e);
                    setPending([]);
                }


                try {
                    const reportData = await api('/api/admin/reports');
                    setReports(Array.isArray(reportData) ? reportData : []);
                } catch (e) {
                    /*
                      If admin/reports endpoint does not exist,
                      don't break the rest of admin portal.
                    */

                    console.warn(
                        'Admin reports endpoint unavailable:',
                        e.message
                    );
                }

            } else {

                const reportsData = await api('/api/reports/mine');
                const approvedData = await api('/api/matches/my/approved');

                setReports(
                    Array.isArray(reportsData) ? reportsData : []
                );

                setMatches(
                    Array.isArray(approvedData) ? approvedData : []
                );
            }

        } catch (e) {
            console.error('REFRESH ERROR:', e);
            setToast(e.message);
        } finally {
            setLoading(false);
        }
    }


    function login(data) {
        localStorage.setItem('lf_token', data.token);
        localStorage.setItem(
            'lf_user',
            JSON.stringify(data.user)
        );

        setUser(data.user);

        setPage(
            data.user.role === 'admin'
                ? 'admin'
                : 'overview'
        );

        setToast(
            `Welcome back, ${data.user.name.split(' ')[0]}!`
        );
    }


    function logout() {
        localStorage.clear();
        setUser(null);
        setPage('overview');
    }


    if (!user) {
        return (
            <AuthScreen
                mode={auth}
                setMode={setAuth}
                onLogin={login}
                toast={toast}
            />
        );
    }


    return (
        <div className="app">

            <Sidebar
                page={page}
                setPage={setPage}
                user={user}
                logout={logout}
            />

            <main className="main">

                <Topbar
                    user={user}
                    onLogout={logout}
                />

                {isAdmin ? (
                    <AdminView
                        page={page}
                        setPage={setPage}
                        stats={adminStats}
                        pending={pending}
                        reports={reports}
                        refresh={refresh}
                        toast={setToast}
                    />
                ) : (
                    <UserView
                        page={page}
                        setPage={setPage}
                        reports={reports}
                        matches={matches}
                        refresh={refresh}
                        toast={setToast}
                        loading={loading}
                    />
                )}

            </main>

            {toast && <Toast text={toast} />}

        </div>
    );
}


/* =========================================================
   AUTH
========================================================= */

function AuthScreen({
    mode,
    setMode,
    onLogin
}) {

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');


    async function submit(e) {
        e.preventDefault();

        setErr('');
        setBusy(true);

        try {

            const endpoint =
                mode === 'login'
                    ? '/api/auth/login'
                    : '/api/auth/register';

            const payload =
                mode === 'login'
                    ? {
                        email: form.email,
                        password: form.password
                    }
                    : form;


            const data = await api(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });


            if (mode === 'login') {

                onLogin(data);

            } else {

                setMode('login');

                setErr(
                    'Account created successfully. Please sign in.'
                );
            }

        } catch (e) {

            setErr(e.message);

        } finally {

            setBusy(false);

        }
    }


    return (
        <div className="auth">

            <div className="auth-visual">

                <div className="brand big">
                    <span className="brand-mark">
                        <Icon name="spark" size={21} />
                    </span>
                    FindBack
                </div>

                <div className="auth-copy">

                    <span className="eyebrow">
                        AI-POWERED CAMPUS SAFETY
                    </span>

                    <h1>
                        Lost something?
                        <br />
                        <em>Find it back.</em>
                    </h1>

                    <p>
                        One smart place to report lost and found items,
                        with AI matching that helps connect the right people.
                    </p>

                    <div className="trust">

                        <span>
                            <Icon name="shield" size={17} />
                            Private by design
                        </span>

                        <span>
                            <Icon name="spark" size={17} />
                            AI-assisted
                        </span>

                    </div>

                </div>


                <div className="floating-card">

                    <div className="mini-icon">
                        <Icon name="spark" size={18} />
                    </div>

                    <div>
                        <b>Smart matching</b>
                        <small>
                            Image + description + context
                        </small>
                    </div>

                    <span className="mini-score">
                        92%
                    </span>

                </div>

            </div>


            <div className="auth-panel">

                <div className="auth-form">

                    <div className="mobile-brand brand">
                        <span className="brand-mark">
                            <Icon name="spark" size={18} />
                        </span>
                        FindBack
                    </div>

                    <span className="eyebrow">
                        {mode === 'login'
                            ? 'WELCOME BACK'
                            : 'GET STARTED'}
                    </span>

                    <h2>
                        {mode === 'login'
                            ? 'Sign in to your account'
                            : 'Create your account'}
                    </h2>

                    <p className="muted">
                        {mode === 'login'
                            ? 'Manage your reports and approved matches.'
                            : 'Join your campus lost & found community.'}
                    </p>


                    <form onSubmit={submit}>

                        {mode === 'register' && (
                            <Field
                                label="Full name"
                                value={form.name}
                                onChange={v =>
                                    setForm({
                                        ...form,
                                        name: v
                                    })
                                }
                                placeholder="Your name"
                            />
                        )}


                        <Field
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={v =>
                                setForm({
                                    ...form,
                                    email: v
                                })
                            }
                            placeholder="you@example.com"
                        />


                        <Field
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={v =>
                                setForm({
                                    ...form,
                                    password: v
                                })
                            }
                            placeholder="••••••••"
                        />


                        {err && (
                            <div className="error">
                                {err}
                            </div>
                        )}


                        <button
                            className="primary full"
                            disabled={busy}
                        >
                            {busy
                                ? 'Please wait…'
                                : mode === 'login'
                                    ? 'Sign in'
                                    : 'Create account'}

                            <Icon name="arrow" size={18} />
                        </button>

                    </form>


                    <div className="switch">

                        {mode === 'login'
                            ? "Don't have an account?"
                            : 'Already have an account?'}

                        <button
                            onClick={() => {
                                setMode(
                                    mode === 'login'
                                        ? 'register'
                                        : 'login'
                                );

                                setErr('');
                            }}
                        >
                            {mode === 'login'
                                ? 'Create one'
                                : 'Sign in'}
                        </button>

                    </div>


                    <div className="demo-note">

                        <Icon name="shield" size={17} />

                        <span>
                            Admin access is restricted. The only admin
                            account is configured by the project owner.
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );
}


function Field({
    label,
    type = 'text',
    value,
    onChange,
    placeholder
}) {

    return (
        <label className="field">

            <span>{label}</span>

            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required
            />

        </label>
    );
}


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
    page,
    setPage,
    user,
    logout
}) {

    return (
        <aside className="sidebar">

            <div className="brand">

                <span className="brand-mark">
                    <Icon name="spark" size={18} />
                </span>

                FindBack

            </div>


            <div className="side-label">
                WORKSPACE
            </div>


            {user.role === 'admin' ? (

                <>
                    <SideBtn
                        icon="home"
                        text="Admin overview"
                        active={page === 'admin'}
                        onClick={() => setPage('admin')}
                    />

                    <SideBtn
                        icon="spark"
                        text="AI review queue"
                        active={page === 'review'}
                        onClick={() => setPage('review')}
                        badge="Review"
                    />

                    <SideBtn
                        icon="box"
                        text="All reports"
                        active={page === 'reports'}
                        onClick={() => setPage('reports')}
                    />
                </>

            ) : (

                navItems.map(([id, text]) => (

                    <SideBtn
                        key={id}
                        icon={
                            id === 'overview'
                                ? 'home'
                                : id === 'report'
                                    ? 'plus'
                                    : 'spark'
                        }
                        text={text}
                        active={page === id}
                        onClick={() => setPage(id)}
                    />

                ))

            )}


            <div className="side-bottom">

                <div className="profile">

                    <div className="avatar">
                        {user.name[0]}
                    </div>

                    <div>
                        <b>{user.name}</b>

                        <small>
                            {user.role === 'admin'
                                ? 'Administrator'
                                : 'Member'}
                        </small>
                    </div>

                </div>


                <button
                    className="logout"
                    onClick={logout}
                >
                    <Icon name="logout" size={18} />
                </button>

            </div>

        </aside>
    );
}


function SideBtn({
    icon,
    text,
    active,
    onClick,
    badge
}) {

    return (
        <button
            className={
                'side-btn ' +
                (active ? 'active' : '')
            }
            onClick={onClick}
        >

            <Icon name={icon} size={19} />

            <span>{text}</span>

            {badge && <small>{badge}</small>}

        </button>
    );
}


function Topbar({
    user,
    onLogout
}) {

    return (
        <header className="topbar">

            <div className="crumb">
                Workspace
                <span>/</span>

                <b>
                    {user.role === 'admin'
                        ? 'Admin portal'
                        : 'My space'}
                </b>
            </div>


            <div className="top-actions">

                <button className="icon-btn">
                    <Icon name="bell" size={19} />
                </button>

                <div className="top-avatar">
                    {user.name[0]}
                </div>

                <button
                    className="mobile-logout"
                    onClick={onLogout}
                >
                    Sign out
                </button>

            </div>

        </header>
    );
}


/* =========================================================
   USER VIEW
========================================================= */

function UserView({
    page,
    setPage,
    reports,
    matches,
    refresh,
    toast,
    loading
}) {

    if (page === 'report') {
        return (
            <ReportPage
                setPage={setPage}
                refresh={refresh}
                toast={toast}
            />
        );
    }


    if (page === 'matches') {
        return (
            <MatchesPage
                matches={matches}
                refresh={refresh}
                toast={toast}
            />
        );
    }


    return (
        <Dashboard
            reports={reports}
            matches={matches}
            setPage={setPage}
            refresh={refresh}
            loading={loading}
        />
    );
}


/* =========================================================
   USER DASHBOARD
========================================================= */

function Dashboard({
    reports,
    matches,
    setPage,
    loading
}) {

    const lost = reports.filter(
        x => x.report_type === 'lost'
    ).length;

    const found = reports.filter(
        x => x.report_type === 'found'
    ).length;


    return (
        <section className="page">

            <div className="hero-row">

                <div>

                    <span className="eyebrow">
                        YOUR WORKSPACE
                    </span>

                    <h1>
                        Good to see you back.
                    </h1>

                    <p className="muted">
                        Keep track of your reports and let AI help
                        surface meaningful matches.
                    </p>

                </div>


                <button
                    className="primary"
                    onClick={() => setPage('report')}
                >
                    <Icon name="plus" size={18} />
                    Report an item
                </button>

            </div>


            <div className="stat-grid">

                <Stat
                    label="Total reports"
                    value={reports.length}
                    icon="box"
                />

                <Stat
                    label="Lost reports"
                    value={lost}
                    icon="search"
                />

                <Stat
                    label="Found reports"
                    value={found}
                    icon="check"
                />

                <Stat
                    label="Approved matches"
                    value={matches.length}
                    icon="spark"
                    accent
                />

            </div>


            <div className="content-grid">

                <div className="panel large">

                    <div className="panel-head">

                        <div>
                            <h3>Recent reports</h3>
                            <p>Your latest activity</p>
                        </div>

                        <button
                            className="text-btn"
                            onClick={() => setPage('report')}
                        >
                            New report
                            <Icon name="arrow" size={16} />
                        </button>

                    </div>


                    {loading ? (
                        <Skeleton />
                    ) : reports.length ? (

                        <div className="report-list">

                            {reports
                                .slice(0, 5)
                                .map(r => (
                                    <ReportRow
                                        key={r.id}
                                        report={r}
                                    />
                                ))}

                        </div>

                    ) : (

                        <Empty
                            icon="box"
                            title="No reports yet"
                            text="When you lose or find something, your report will appear here."
                            action="Create your first report"
                            onClick={() => setPage('report')}
                        />

                    )}

                </div>


                <div className="panel ai-panel">

                    <div className="ai-orb">
                        <Icon name="spark" size={25} />
                    </div>

                    <span className="eyebrow">
                        AI MATCHING
                    </span>

                    <h3>
                        Let the matching engine do the searching.
                    </h3>

                    <p>
                        We compare item photos, descriptions,
                        category, location and date to rank potential matches.
                    </p>


                    <div className="weights">

                        <Weight n="40%" t="Image" />
                        <Weight n="35%" t="Description" />
                        <Weight n="15%" t="Location" />
                        <Weight n="10%" t="Date" />

                    </div>


                    <button
                        className="ghost full"
                        onClick={() => setPage('matches')}
                    >
                        View approved matches
                        <Icon name="arrow" size={16} />
                    </button>

                </div>

            </div>

        </section>
    );
}


function Weight({ n, t }) {

    return (
        <div>
            <b>{n}</b>
            <small>{t}</small>
        </div>
    );
}


function Stat({
    label,
    value,
    icon,
    accent
}) {

    return (
        <div
            className={
                'stat ' +
                (accent ? 'accent' : '')
            }
        >

            <div className="stat-icon">
                <Icon name={icon} size={19} />
            </div>

            <div>

                <small>{label}</small>

                <strong>{value}</strong>

            </div>

        </div>
    );
}


/* =========================================================
   REPORT ROW
========================================================= */

function ReportRow({ report }) {

    return (
        <div className="report-row">

            {report.image_url ? (

                <img
                    src={imgUrl(report.image_url)}
                    alt={report.title}
                />

            ) : (

                <div className="thumb-placeholder">
                    <Icon name="box" size={22} />
                </div>

            )}


            <div className="row-main">

                <b>{report.title}</b>

                <span>
                    {report.category}
                    {' · '}
                    {report.location}
                </span>

            </div>


            <span
                className={
                    'pill ' + report.report_type
                }
            >
                {report.report_type}
            </span>


            <span className="status">

                <i />

                {report.status === 'pending_review'
                    ? 'AI matching'
                    : report.status === 'submitted'
                        ? 'Awaiting AI review'
                        : report.status}

            </span>


            <Icon
                name="chevron"
                size={17}
            />

        </div>
    );
}


/* =========================================================
   REPORT PAGE
========================================================= */

function ReportPage({
    setPage,
    refresh,
    toast
}) {

    const [type, setType] = useState('lost');

    const [form, setForm] = useState({
        title: '',
        category: '',
        description: '',
        location: '',
        date: '',
        time: ''
    });

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [busy, setBusy] = useState(false);


    const update = (key, value) => {
        setForm({
            ...form,
            [key]: value
        });
    };


    /* =====================================================
       IMPORTANT FIXED SUBMIT FUNCTION
    ===================================================== */

    async function submit(e) {

        e.preventDefault();


        if (!file) {
            toast('Please add a clear item photo.');
            return;
        }


        setBusy(true);


        try {

            /* -----------------------------------------------
               STEP 1 — UPLOAD IMAGE
            ------------------------------------------------ */

            const fd = new FormData();

            fd.append('file', file);


            const up = await api('/api/uploads', {
                method: 'POST',
                body: fd
            });


            console.log(
                'IMAGE UPLOADED:',
                up
            );


            /* -----------------------------------------------
               STEP 2 — SAVE REPORT TO MONGODB
            ------------------------------------------------ */

            const reportResponse = await api(
                '/api/reports',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...form,
                        report_type: type,
                        image_url: up.image_url
                    })
                }
            );


            console.log(
                'REPORT SAVED:',
                reportResponse
            );


            const reportId =
                reportResponse.report.id;


            /*
              IMPORTANT:
      
              Refresh immediately after saving.
      
              So even if AI matching fails,
              the report still appears on dashboard.
            */

            await refresh();


            toast(
                'Report saved successfully. Starting AI matching…'
            );


            /* -----------------------------------------------
               STEP 3 — RUN AI MATCHING
               
               OLD WRONG:
               /api/matches/generate/{id}
      
               NEW CORRECT:
               /api/matches/{id}
            ------------------------------------------------ */

            try {

                const matchResponse = await api(
                    '/api/matches/' + reportId,
                    {
                        method: 'POST'
                    }
                );


                console.log(
                    'AI MATCH RESULT:',
                    matchResponse
                );


                toast(
                    'Report submitted and AI matching completed!'
                );


            } catch (matchError) {

                console.error(
                    'AI MATCHING ERROR:',
                    matchError
                );


                /*
                  Report is already saved.
                  Therefore don't delete/hide it.
                */

                toast(
                    'Report saved, but AI matching could not find a match yet.'
                );
            }


            /* -----------------------------------------------
               STEP 4 — REFRESH AGAIN
            ------------------------------------------------ */

            await refresh();


            /* -----------------------------------------------
               STEP 5 — RETURN TO DASHBOARD
            ------------------------------------------------ */

            setPage('overview');


        } catch (e) {

            console.error(
                'REPORT SUBMISSION ERROR:',
                e
            );

            toast(e.message);

        } finally {

            setBusy(false);

        }
    }


    return (
        <section className="page narrow-page">

            <div
                className="back"
                onClick={() => setPage('overview')}
            >
                <Icon name="arrow" size={16} />
                Back to overview
            </div>


            <div className="form-heading">

                <span className="eyebrow">
                    NEW REPORT
                </span>

                <h1>
                    Tell us what happened.
                </h1>

                <p className="muted">
                    Give the matcher enough context to find
                    the right opposite report.
                </p>

            </div>


            <form
                className="report-form"
                onSubmit={submit}
            >


                {/* TYPE */}

                <div className="type-toggle">

                    <button
                        type="button"
                        className={
                            type === 'lost'
                                ? 'selected'
                                : ''
                        }
                        onClick={() => setType('lost')}
                    >
                        <span>01</span>
                        <b>I lost something</b>
                        <small>
                            I'm looking for an item
                        </small>
                    </button>


                    <button
                        type="button"
                        className={
                            type === 'found'
                                ? 'selected'
                                : ''
                        }
                        onClick={() => setType('found')}
                    >
                        <span>02</span>
                        <b>I found something</b>
                        <small>
                            I want to return an item
                        </small>
                    </button>

                </div>


                {/* ITEM DETAILS */}

                <div className="panel">

                    <div className="section-title">

                        <span>01</span>

                        <div>
                            <h3>Item details</h3>

                            <p>
                                Describe the item as clearly as you can.
                            </p>
                        </div>

                    </div>


                    <div className="two-col">

                        <Field
                            label="Item title"
                            value={form.title}
                            onChange={v =>
                                update('title', v)
                            }
                            placeholder="e.g. Blue AirPods Pro"
                        />


                        <label className="field">

                            <span>Category</span>

                            <select
                                value={form.category}
                                onChange={e =>
                                    update(
                                        'category',
                                        e.target.value
                                    )
                                }
                                required
                            >

                                <option value="">
                                    Select category
                                </option>

                                {categories.map(c => (
                                    <option key={c}>
                                        {c}
                                    </option>
                                ))}

                            </select>

                        </label>

                    </div>


                    <label className="field">

                        <span>Description</span>

                        <textarea
                            value={form.description}
                            onChange={e =>
                                update(
                                    'description',
                                    e.target.value
                                )
                            }
                            placeholder="Color, brand, marks, case, stickers, scratches, serial details…"
                            required
                        />

                    </label>


                    {/* IMAGE */}

                    <div className="upload">

                        <input
                            id="file"
                            type="file"
                            accept="image/*"
                            onChange={e => {

                                const selected =
                                    e.target.files?.[0];

                                setFile(selected || null);

                                if (selected) {
                                    setPreview(
                                        URL.createObjectURL(
                                            selected
                                        )
                                    );
                                }

                            }}
                        />


                        <label htmlFor="file">

                            {preview ? (

                                <img
                                    src={preview}
                                    alt="Preview"
                                />

                            ) : (

                                <>
                                    <div className="upload-icon">
                                        <Icon
                                            name="upload"
                                            size={22}
                                        />
                                    </div>

                                    <b>
                                        Upload item photo
                                    </b>

                                    <span>
                                        JPG, PNG or WEBP · max 8 MB
                                    </span>
                                </>

                            )}

                        </label>

                    </div>

                </div>


                {/* LOCATION / DATE */}

                <div className="panel">

                    <div className="section-title">

                        <span>02</span>

                        <div>

                            <h3>
                                Where & when
                            </h3>

                            <p>
                                Context helps the AI rank stronger matches.
                            </p>

                        </div>

                    </div>


                    <div className="two-col">

                        <label className="field">

                            <span>
                                Location
                            </span>

                            <input
                                value={form.location}
                                onChange={e =>
                                    update(
                                        'location',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Library, Block A"
                                required
                            />

                        </label>


                        <label className="field">

                            <span>
                                Date
                            </span>

                            <input
                                type="date"
                                value={form.date}
                                onChange={e =>
                                    update(
                                        'date',
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </label>

                    </div>


                    <div className="two-col">

                        <label className="field">

                            <span>
                                Approx. time
                                <i> optional</i>
                            </span>

                            <input
                                type="time"
                                value={form.time}
                                onChange={e =>
                                    update(
                                        'time',
                                        e.target.value
                                    )
                                }
                            />

                        </label>

                        <div />

                    </div>

                </div>


                {/* FOOTER */}

                <div className="form-footer">

                    <span>
                        <Icon
                            name="shield"
                            size={16}
                        />

                        Your contact details are never shown publicly.
                    </span>


                    <button
                        className="primary"
                        disabled={busy}
                    >

                        {busy
                            ? 'Submitting…'
                            : 'Submit & run AI matching'}

                        <Icon
                            name="spark"
                            size={17}
                        />

                    </button>

                </div>

            </form>

        </section>
    );
}


/* =========================================================
   USER MATCHES
========================================================= */

function MatchesPage({
    matches,
    refresh
}) {

    return (
        <section className="page">

            <div className="hero-row">

                <div>

                    <span className="eyebrow">
                        APPROVED MATCHES
                    </span>

                    <h1>
                        Your matches.
                    </h1>

                    <p className="muted">
                        Only matches reviewed and approved by
                        the admin appear here.
                    </p>

                </div>


                <button
                    className="ghost"
                    onClick={refresh}
                >
                    Refresh
                </button>

            </div>


            {matches.length ? (

                <div className="match-grid">

                    {matches.map(m => (
                        <MatchCard
                            key={
                                m.id ||
                                m.report?.id ||
                                Math.random()
                            }
                            match={m}
                        />
                    ))}

                </div>

            ) : (

                <div className="panel empty-big">

                    <div className="ai-orb">
                        <Icon
                            name="spark"
                            size={28}
                        />
                    </div>

                    <h3>
                        No approved matches yet
                    </h3>

                    <p>
                        Submit a lost or found report.
                        The AI will rank candidates and
                        the admin will review them before
                        anything appears here.
                    </p>

                </div>

            )}

        </section>
    );
}


function MatchCard({ match }) {

    const r = match.report;

    return (
        <div className="match-card">

            <div className="match-image">

                {r.image_url ? (

                    <img
                        src={imgUrl(r.image_url)}
                        alt={r.title}
                    />

                ) : (

                    <Icon
                        name="box"
                        size={30}
                    />

                )}


                <div className="match-score">

                    <strong>
                        {match.match_score}%
                    </strong>

                    <small>
                        match
                    </small>

                </div>

            </div>


            <div className="match-body">

                <div className="match-meta">

                    <span className="pill found">
                        approved
                    </span>

                    <span>
                        {r.category}
                    </span>

                </div>


                <h3>
                    {r.title}
                </h3>


                <p>
                    {r.description}
                </p>


                <div className="meta-row">

                    <span>
                        <Icon
                            name="pin"
                            size={15}
                        />
                        {r.location}
                    </span>

                    <span>
                        <Icon
                            name="clock"
                            size={15}
                        />
                        {r.date}
                    </span>

                </div>


                <div className="score-bars">

                    {Object.entries(match.scores || {}).map(
                        ([key, value]) => (

                            <div key={key}>

                                <span>
                                    {key}
                                </span>

                                <div>
                                    <i
                                        style={{
                                            width: `${value}%`
                                        }}
                                    />
                                </div>

                                <b>
                                    {Math.round(value)}%
                                </b>

                            </div>

                        )
                    )}

                </div>


                {match.admin_note && (

                    <div className="admin-note">
                        Admin note:
                        {' '}
                        {match.admin_note}
                    </div>

                )}

            </div>

        </div>
    );
}


/* =========================================================
   ADMIN
========================================================= */

function AdminView({
    page,
    setPage,
    stats,
    pending,
    reports,
    refresh,
    toast
}) {

    if (page === 'review') {

        return (
            <AdminReview
                pending={pending}
                refresh={refresh}
                toast={toast}
            />
        );

    }


    if (page === 'reports') {

        return (
            <AdminReports
                reports={reports}
            />
        );

    }


    return (
        <AdminDashboard
            stats={stats}
            pending={pending}
            setPage={setPage}
            refresh={refresh}
        />
    );
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
    stats,
    pending,
    setPage,
    refresh
}) {

    return (
        <section className="page">

            <div className="hero-row">

                <div>

                    <span className="eyebrow">
                        ADMIN CONTROL CENTER
                    </span>

                    <h1>
                        Moderate with confidence.
                    </h1>

                    <p className="muted">
                        Review AI suggestions before they
                        become visible to users.
                    </p>

                </div>


                <button
                    className="ghost"
                    onClick={refresh}
                >
                    <Icon
                        name="clock"
                        size={16}
                    />
                    Refresh data
                </button>

            </div>


            <div className="stat-grid">

                <Stat
                    label="Registered users"
                    value={stats?.users || 0}
                    icon="user"
                />

                <Stat
                    label="Total reports"
                    value={stats?.reports || 0}
                    icon="box"
                />

                <Stat
                    label="Waiting for review"
                    value={stats?.pending_matches || 0}
                    icon="spark"
                    accent
                />

                <Stat
                    label="Approved matches"
                    value={stats?.approved_matches || 0}
                    icon="check"
                />

            </div>


            <div className="content-grid">

                <div className="panel large">

                    <div className="panel-head">

                        <div>

                            <h3>
                                Priority review queue
                            </h3>

                            <p>
                                Highest AI scores appear first.
                            </p>

                        </div>


                        <button
                            className="text-btn"
                            onClick={() => setPage('review')}
                        >
                            Open queue
                            <Icon
                                name="arrow"
                                size={16}
                            />
                        </button>

                    </div>


                    {pending.length ? (

                        pending
                            .slice(0, 5)
                            .map(m => (
                                <AdminMatchRow
                                    key={m.id}
                                    m={m}
                                />
                            ))

                    ) : (

                        <Empty
                            icon="check"
                            title="Queue is clear"
                            text="No AI suggestions are waiting for your decision."
                        />

                    )}

                </div>


                <div className="panel admin-ai">

                    <div className="eyebrow">
                        HOW IT WORKS
                    </div>

                    <h3>
                        Explainable AI, not a black box.
                    </h3>

                    <p>
                        Every suggestion shows the four signals
                        used by the ranking engine, so an admin
                        can make the final decision.
                    </p>


                    <div className="signal">
                        <b>40%</b>
                        <span>Image similarity</span>
                    </div>

                    <div className="signal">
                        <b>35%</b>
                        <span>Text similarity</span>
                    </div>

                    <div className="signal">
                        <b>15%</b>
                        <span>Location overlap</span>
                    </div>

                    <div className="signal">
                        <b>10%</b>
                        <span>Date proximity</span>
                    </div>

                </div>

            </div>

        </section>
    );
}


/* =========================================================
   ADMIN MATCH ROW
========================================================= */

function AdminMatchRow({ m }) {

    return (
        <div className="admin-row">

            <div className="admin-pair">

                <MiniReport r={m.source} />

                <span className="link-line">
                    <Icon
                        name="spark"
                        size={17}
                    />
                </span>

                <MiniReport r={m.candidate} />

            </div>


            <div
                className={
                    'big-score ' +
                    scoreTone(m.match_score)
                }
            >

                {m.match_score}%

                <small>
                    AI score
                </small>

            </div>

        </div>
    );
}


function MiniReport({ r }) {

    return (
        <div className="mini-report">

            {r?.image_url ? (

                <img
                    src={imgUrl(r.image_url)}
                    alt={r.title}
                />

            ) : (

                <div className="mini-thumb">
                    <Icon
                        name="box"
                        size={17}
                    />
                </div>

            )}


            <div>

                <b>
                    {r?.title || 'Report'}
                </b>

                <span>
                    {r?.report_type || ''}
                    {' · '}
                    {r?.location || ''}
                </span>

            </div>

        </div>
    );
}


/* =========================================================
   ADMIN REVIEW
========================================================= */

function AdminReview({
    pending,
    refresh,
    toast
}) {

    return (
        <section className="page">

            <div className="hero-row">

                <div>

                    <span className="eyebrow">
                        AI REVIEW QUEUE
                    </span>

                    <h1>
                        Review potential matches.
                    </h1>

                    <p className="muted">
                        Approve only when the evidence is convincing.
                        Approved matches are immediately visible
                        to the relevant users.
                    </p>

                </div>


                <button
                    className="ghost"
                    onClick={refresh}
                >
                    Refresh
                </button>

            </div>


            <div className="review-list">

                {pending.length ? (

                    pending.map(m => (

                        <ReviewCard
                            key={m.id}
                            m={m}
                            refresh={refresh}
                            toast={toast}
                        />

                    ))

                ) : (

                    <div className="panel empty-big">

                        <div className="ai-orb">
                            <Icon
                                name="check"
                                size={28}
                            />
                        </div>

                        <h3>
                            Nothing needs your attention
                        </h3>

                        <p>
                            New AI suggestions will appear here
                            after users submit compatible lost
                            and found reports.
                        </p>

                    </div>

                )}

            </div>

        </section>
    );
}


/* =========================================================
   REVIEW CARD — SIMILARITY DISPLAY
========================================================= */

function ReviewCard({
    m,
    refresh,
    toast
}) {

    const [busy, setBusy] = useState(false);


    async function decide(decision) {

        setBusy(true);


        try {

            await api(
                '/api/admin/matches/' +
                m.id +
                '/decision',
                {
                    method: 'POST',

                    body: JSON.stringify({
                        decision,

                        admin_note:
                            decision === 'approved'
                                ? 'Verified by admin.'
                                : 'Rejected after review.'
                    })
                }
            );


            toast(
                `Match ${decision}.`
            );


            await refresh();


        } catch (e) {

            toast(e.message);

        } finally {

            setBusy(false);

        }
    }


    return (
        <div className="review-card">


            <div className="review-head">

                <div>

                    <span className="eyebrow">
                        AI SUGGESTION
                    </span>

                    <h3>
                        Potential match ·{' '}
                        <b>
                            {m.match_score}%
                        </b>
                    </h3>

                </div>


                <span
                    className={
                        'score-badge ' +
                        scoreTone(m.match_score)
                    }
                >
                    {m.match_score}% confidence
                </span>

            </div>


            <div className="compare">

                <CompareItem
                    r={m.source}
                />


                <div className="versus">

                    <div>
                        <Icon
                            name="spark"
                            size={21}
                        />
                    </div>

                    <span>
                        AI
                    </span>

                </div>


                <CompareItem
                    r={m.candidate}
                />

            </div>


            {/* =================================================
          SIMILARITY SCORES
      ================================================= */}

            <div className="evidence">

                {Object.entries(
                    m.scores || {}
                ).map(([key, value]) => (

                    <div key={key}>

                        <span>
                            {key} similarity
                        </span>


                        <div className="evidence-bar">

                            <i
                                style={{
                                    width: `${value}%`
                                }}
                            />

                        </div>


                        <b>
                            {Math.round(value)}%
                        </b>

                    </div>

                ))}

            </div>


            {/* =================================================
          DECISION
      ================================================= */}

            <div className="decision">

                <span>

                    <Icon
                        name="shield"
                        size={16}
                    />

                    Admin decision controls user visibility.

                </span>


                <div>

                    <button
                        className="danger"
                        disabled={busy}
                        onClick={() =>
                            decide('rejected')
                        }
                    >

                        <Icon
                            name="x"
                            size={16}
                        />

                        Reject

                    </button>


                    <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                            decide('approved')
                        }
                    >

                        <Icon
                            name="check"
                            size={16}
                        />

                        Approve match

                    </button>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   COMPARE ITEM
========================================================= */

function CompareItem({ r }) {

    return (
        <div className="compare-item">

            {r?.image_url ? (

                <img
                    src={imgUrl(r.image_url)}
                    alt={r.title}
                />

            ) : (

                <div className="compare-placeholder">

                    <Icon
                        name="box"
                        size={26}
                    />

                </div>

            )}


            <div>

                <span
                    className={
                        'pill ' +
                        (r?.report_type || '')
                    }
                >
                    {r?.report_type || ''}
                </span>


                <h3>
                    {r?.title || 'Report'}
                </h3>


                <p>
                    {r?.description || ''}
                </p>


                <small>

                    <Icon
                        name="pin"
                        size={14}
                    />

                    {r?.location || ''}
                    {' · '}
                    {r?.date || ''}

                </small>

            </div>

        </div>
    );
}


/* =========================================================
   ADMIN REPORTS
========================================================= */

function AdminReports({
    reports
}) {

    return (
        <section className="page">

            <div className="hero-row">

                <div>

                    <span className="eyebrow">
                        DATA OVERVIEW
                    </span>

                    <h1>
                        All submitted reports.
                    </h1>

                    <p className="muted">
                        Live data from MongoDB.
                        Nothing here is pre-seeded.
                    </p>

                </div>

            </div>


            <div className="panel">

                <div className="report-list">

                    {reports.length ? (

                        reports.map(r => (

                            <ReportRow
                                key={r.id}
                                report={r}
                            />

                        ))

                    ) : (

                        <Empty
                            icon="box"
                            title="No reports"
                            text="Real user submissions will appear here."
                        />

                    )}

                </div>

            </div>

        </section>
    );
}


/* =========================================================
   EMPTY
========================================================= */

function Empty({
    icon,
    title,
    text,
    action,
    onClick
}) {

    return (
        <div className="empty">

            <div className="empty-icon">
                <Icon
                    name={icon}
                    size={23}
                />
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {text}
            </p>


            {action && (

                <button
                    className="primary"
                    onClick={onClick}
                >

                    {action}

                    <Icon
                        name="arrow"
                        size={16}
                    />

                </button>

            )}

        </div>
    );
}


/* =========================================================
   SKELETON
========================================================= */

function Skeleton() {

    return (
        <div className="skeletons">
            <i />
            <i />
            <i />
        </div>
    );
}


/* =========================================================
   TOAST
========================================================= */

function Toast({ text }) {

    return (
        <div className="toast">

            <Icon
                name="check"
                size={17}
            />

            {text}

        </div>
    );
}


/* =========================================================
   START APP
========================================================= */

createRoot(
    document.getElementById('root')
).render(
    <App />
);