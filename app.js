/* HKUST MPhil TIE Weekly Progress Tracker (Demo, SPA)
   Tech: Vanilla JS + HTML + CSS, LocalStorage persistence
*/

(() => {
  const STORAGE_KEY = "progressTrackerData";
  const HK_TZ = "Asia/Hong_Kong";

  // -------------------- Utilities --------------------
  const uuid = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  };

  const nowISO = () => new Date().toISOString();

  const toHKISODate = (date) => {
    // Returns YYYY-MM-DD in HK timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: HK_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
  };

  const getDayOfWeekHK = (date) => {
    // 0=Sun..6=Sat in HK timezone
    const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: HK_TZ, weekday: 'short' }).format(date);
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[dayStr];
  };

  const dateFromHKISO = (isoYMD) => {
    // Create Date from YYYY-MM-DD at 00:00 HK time (+08:00)
    return new Date(`${isoYMD}T00:00:00+08:00`);
  };

  const addDaysHK = (isoYMD, delta) => {
    const base = dateFromHKISO(isoYMD);
    const moved = new Date(base.getTime() + delta * 86400000);
    return toHKISODate(moved);
  };

  const getCurrentMondayHKISO = () => {
    const todayHK = toHKISODate(new Date());
    const d = dateFromHKISO(todayHK);
    const dow = getDayOfWeekHK(d); // 0=Sun..6=Sat
    const delta = (dow + 6) % 7; // days since Monday
    const monday = new Date(d.getTime() - delta * 86400000);
    return toHKISODate(monday);
  };

  const isMondayHK = (isoYMD) => {
    const d = dateFromHKISO(isoYMD);
    return getDayOfWeekHK(d) === 1;
  };

  const formatISOForDisplay = (isoYMD) => {
    const d = dateFromHKISO(isoYMD);
    const day = new Intl.DateTimeFormat('en-US', { timeZone: HK_TZ, weekday: 'short' }).format(d);
    return `${day}, ${isoYMD}`;
  };

  const computeOverallStatusFromGoalStatuses = (statuses) => {
    if (!statuses || statuses.length === 0) return 'not_achieved';
    const allAchieved = statuses.every(s => s === 'achieved');
    const noneAchieved = statuses.every(s => s !== 'achieved');
    if (allAchieved) return 'achieved';
    if (noneAchieved) return 'not_achieved';
    return 'partial';
  };

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const showToast = (message, type = 'info', timeout = 3000) => {
    const container = document.getElementById('toastContainer');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateY(8px)';
      setTimeout(() => div.remove(), 200);
    }, timeout);
  };

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const toCSV = (rows, headerOrder) => {
    if (!rows || rows.length === 0) return '';
    const headers = headerOrder || Object.keys(rows[0]);
    const lines = [];
    lines.push(headers.map(h => escapeCSV(h)).join(','));
    for (const row of rows) {
      const line = headers.map(h => escapeCSV(row[h] ?? '')).join(',');
      lines.push(line);
    }
    return '\uFEFF' + lines.join('\n'); // UTF-8 with BOM
  };

  const downloadTextFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // -------------------- Data Layer --------------------
  const loadData = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const templates = {
    goalTemplates: [
      "Complete literature review for 20 papers on transformer architectures",
      "Implement baseline CNN model for image classification",
      "Draft methodology section (2000 words)",
      "Attend 2 research seminars and take detailed notes",
      "Set up development environment for React Native app",
      "Interview 5 startup founders for user research",
      "Complete statistical analysis of survey data (n=150)",
      "Prepare presentation for progress review meeting",
      "Debug API integration issues in prototype",
      "Write introduction chapter (3000 words)"
    ],
    progressNoteTemplates: [
      "Identified 3 key research gaps and updated literature matrix.",
      "Baseline model reached 85% accuracy on validation set.",
      "Drafted 1800 words of methodology section; need advisor feedback.",
      "Gathered seminar insights on latest GAN techniques.",
      "Environment set up with Docker; resolved dependency conflicts.",
      "Completed interviews; transcripts ready for coding.",
      "Performed chi-square tests; results show significant correlations.",
      "Slides prepared for supervisor meeting; rehearsal pending.",
      "API bug fixed by refactoring auth middleware.",
      "Introduction chapter outline finalized, 1000 words written."
    ],
    blockerTemplates: [
      "GPU cluster access delays.",
      "Waiting for IRB approval.",
      "Dataset licensing issues.",
      "Need clarification from supervisor.",
      "Time clash with coursework.",
      "Library incompatibility with M1 Mac.",
      "Participant recruitment slower than expected."
    ],
    studentNames: [
      "Alice Chen", "Bob Zhang", "Carol Liu", "David Wong", "Emma Lee",
      "Frank Kumar", "Grace Wang", "Henry Tan", "Isabel Ng", "Jack Martinez",
      "Kelly Ho", "Leo Garcia", "Mona Patel", "Nathan Yu", "Olivia Chan",
      "Peter Lam", "Queenie Lau", "Ryan Choi", "Sophia Torres", "Thomas Yeung"
    ],
    researchAreas: [
      "AI/Machine Learning", "IoT Systems", "Fintech", "EdTech", "Sustainable Technology",
      "Healthcare Innovation", "Blockchain", "Robotics", "Data Analytics", "Cybersecurity"
    ],
    supervisors: [
      "Prof. Li", "Prof. Chan", "Prof. Zhang", "Prof. Wong", "Prof. Lee",
      "Prof. Smith", "Prof. Patel", "Prof. Garcia", "Prof. Yu", "Prof. Lam"
    ],
    teams: [
      { name: "AI/ML", description: "Research on artificial intelligence and machine learning." },
      { name: "IoT", description: "Internet of Things systems and embedded innovations." },
      { name: "EdTech", description: "Technology for education and learning analytics." }
    ]
  };

  const pickN = (arr, n) => {
    const copy = arr.slice();
    const result = [];
    while (result.length < n && copy.length) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  };

  const randomStatus = () => {
    const r = Math.random();
    if (r < 0.55) return 'achieved';
    if (r < 0.85) return 'partial';
    return 'not_achieved';
  };

  const seedDemoData = () => {
    const currentMonday = getCurrentMondayHKISO();
    const weeks = [0, -7, -14, -21, -28, -35].map(off => addDaysHK(currentMonday, off));

    const students = [];
    const weekly_entries = [];

    const studentsPerRA = templates.researchAreas.length;

    for (let i = 0; i < 20; i++) {
      const full_name = templates.studentNames[i % templates.studentNames.length];
      const research_area = templates.researchAreas[i % templates.researchAreas.length];
      const supervisor = templates.supervisors[i % templates.supervisors.length];
      const id = uuid();

      const start_date = addDaysHK(currentMonday, - (70 + Math.floor(Math.random() * 120))); // ~3-6 months ago
      const created_at = nowISO();

      const student = {
        id,
        full_name,
        email: `${full_name.toLowerCase().replace(/[^a-z]/g, '.')}@ust.hk`,
        cohort: "MPhil TIE 2025",
        start_date,
        status: "active",
        notes: "",
        research_area,
        supervisor,
        created_at,
        updated_at: created_at
      };
      students.push(student);

      for (const w of weeks) {
        // Goals 3-5
        const numGoals = 3 + Math.floor(Math.random() * 3);
        const goals = pickN(templates.goalTemplates, numGoals);
        const goalStatuses = goals.map(() => randomStatus());
        const overall = computeOverallStatusFromGoalStatuses(goalStatuses);
        const progress = pickN(templates.progressNoteTemplates, 1 + Math.floor(Math.random() * 2)).join(' ');
        const hasBlocker = Math.random() < 0.6;
        const blocker = hasBlocker ? pickN(templates.blockerTemplates, 1)[0] : "";
        const anyNotAchieved = goalStatuses.some(s => s !== 'achieved');
        const reason = anyNotAchieved ? "Reprioritized tasks due to blockers and supervisor feedback." : "";
        const nextNumGoals = 3 + Math.floor(Math.random() * 2);
        const nextGoals = pickN(templates.goalTemplates, nextNumGoals);

        const entry = {
          id: uuid(),
          student_id: id,
          week_start_date: w,
          goals_set_json: JSON.stringify(goals),
          per_goal_status_json: JSON.stringify(goalStatuses),
          overall_status: overall,
          progress_notes: progress,
          blockers: blocker,
          reasons_if_not_achieved: reason,
          next_week_goals_json: JSON.stringify(nextGoals),
          created_by: "seed",
          created_at,
          updated_at: created_at
        };
        weekly_entries.push(entry);
      }
    }

    // Teams and memberships
    const teams = templates.teams.map(t => ({ id: uuid(), team_name: t.name, description: t.description, created_at: nowISO(), updated_at: nowISO() }));
    const team_memberships = [];

    // Even distribution across 3 teams
    for (let i = 0; i < students.length; i++) {
      const teamIdx = i % teams.length;
      team_memberships.push({ id: uuid(), team_id: teams[teamIdx].id, student_id: students[i].id, role_in_team: "member", created_at: nowISO() });
    }

    // Team weekly entries for last 3 Mondays
    const teamMondays = [0, -7, -14].map(off => addDaysHK(currentMonday, off));
    const team_weekly_entries = [];
    for (const team of teams) {
      for (const w of teamMondays) {
        const goals = pickN(templates.goalTemplates, 3 + Math.floor(Math.random() * 2));
        const statuses = goals.map(() => randomStatus());
        const overall = computeOverallStatusFromGoalStatuses(statuses);
        const notes = pickN(templates.progressNoteTemplates, 2).join(' ');
        const blockers = Math.random() < 0.5 ? pickN(templates.blockerTemplates, 1)[0] : "";
        const nextGoals = pickN(templates.goalTemplates, 3);

        team_weekly_entries.push({
          id: uuid(),
          team_id: team.id,
          week_start_date: w,
          team_goals_set_json: JSON.stringify(goals),
          team_overall_status: overall,
          team_progress_notes: notes,
          team_blockers: blockers,
          next_week_team_goals_json: JSON.stringify(nextGoals),
          created_by: "seed",
          created_at: nowISO(),
          updated_at: nowISO()
        });
      }
    }

    const data = { students, weekly_entries, teams, team_memberships, team_weekly_entries };
    saveData(data);
    return data;
  };

  // Helpers to access data
  const getStudentById = (data, id) => data.students.find(s => s.id === id);
  const getTeamById = (data, id) => data.teams.find(t => t.id === id);
  const getTeamsByStudentId = (data, studentId) => {
    const teamIds = data.team_memberships.filter(m => m.student_id === studentId).map(m => m.team_id);
    return data.teams.filter(t => teamIds.includes(t.id));
  };
  const getEntriesByStudent = (data, studentId) => data.weekly_entries.filter(e => e.student_id === studentId).sort((a,b) => (a.week_start_date < b.week_start_date ? 1 : -1));
  const getEntryByStudentAndWeek = (data, studentId, weekStart) => data.weekly_entries.find(e => e.student_id === studentId && e.week_start_date === weekStart);
  const hasEntryThisWeek = (data, studentId, currentMonday) => !!getEntryByStudentAndWeek(data, studentId, currentMonday);

  const ensureUniqueWeeklyEntry = (data, studentId, weekStart, ignoreEntryId = null) => {
    const exists = data.weekly_entries.some(e => e.student_id === studentId && e.week_start_date === weekStart && e.id !== ignoreEntryId);
    return !exists;
  };
  const ensureUniqueTeamWeeklyEntry = (data, teamId, weekStart, ignoreId = null) => {
    const exists = data.team_weekly_entries.some(e => e.team_id === teamId && e.week_start_date === weekStart && e.id !== ignoreId);
    return !exists;
  };

  // -------------------- App State --------------------
  const appState = {
    data: null,
    page: 'dashboard',
    selectedStudentId: null,
    filters: { search: '', status: 'all', team: 'all', hasEntryThisWeek: 'all' },
    formEditingEntryId: null
  };

  // -------------------- Rendering --------------------
  const setActiveNav = (page) => {
    document.querySelectorAll('.nav .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
      if (btn.dataset.page === page) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
  };

  const render = () => {
    const container = document.getElementById('mainContent');
    container.innerHTML = '';
    setActiveNav(appState.page);
    if (appState.page === 'dashboard') return renderDashboard(container);
    if (appState.page === 'students') return renderStudents(container);
    if (appState.page === 'teams') return renderTeams(container);
    if (appState.page === 'reports') return renderReports(container);
    if (appState.page === 'settings') return renderSettings(container);
  };

  const renderDashboard = (root) => {
    const data = appState.data;
    const currentMonday = getCurrentMondayHKISO();
    const activeStudents = data.students.filter(s => s.status === 'active');
    const activeCount = activeStudents.length;
    const studentsWithEntryThisWeek = activeStudents.filter(s => hasEntryThisWeek(data, s.id, currentMonday)).length;
    const pctWithEntry = activeCount ? Math.round((studentsWithEntryThisWeek / activeCount) * 100) : 0;

    // Completion rate: percent of entries this week whose overall_status is achieved
    const entriesThisWeek = data.weekly_entries.filter(e => e.week_start_date === currentMonday);
    const achievedCount = entriesThisWeek.filter(e => e.overall_status === 'achieved').length;
    const completionRate = entriesThisWeek.length ? Math.round((achievedCount / entriesThisWeek.length) * 100) : 0;

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<div class="page-title">Dashboard</div><div class="meta">Week of ${currentMonday} (HK)</div>`;

    const kpis = document.createElement('div');
    kpis.className = 'kpis';
    kpis.innerHTML = `
      <div class="kpi">
        <div class="kpi-label">Active students</div>
        <div class="kpi-value">${activeCount}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">% with entry this week</div>
        <div class="kpi-value">${pctWithEntry}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Completion rate this week</div>
        <div class="kpi-value">${completionRate}%</div>
      </div>
    `;

    const recentCard = document.createElement('div');
    recentCard.className = 'card';
    recentCard.innerHTML = `<div class="card-header"><div><strong>Recent activity</strong></div><div class="meta">Current week statuses</div></div>`;

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Research Area</th>
          <th>Current Week</th>
          <th>Goals Achieved</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    const rows = data.students.slice(0).sort((a,b) => a.full_name.localeCompare(b.full_name));
    for (const s of rows) {
      const current = getEntryByStudentAndWeek(data, s.id, currentMonday);
      const chip = current ? `<span class="chip ${current.overall_status}">${current.overall_status.replace('_',' ')}</span>` : '<span class="meta">No entry</span>';
      let goalsAchieved = '-';
      if (current) {
        const statuses = JSON.parse(current.per_goal_status_json);
        const total = statuses.length;
        const achieved = statuses.filter(x => x === 'achieved').length;
        goalsAchieved = `${achieved}/${total}`;
      }
      const lastUpdated = (() => {
        const entries = getEntriesByStudent(data, s.id);
        if (!entries.length) return '';
        const maxUpdated = entries.reduce((acc, e) => acc > e.updated_at ? acc : e.updated_at, entries[0].updated_at);
        return new Date(maxUpdated).toLocaleString();
      })();

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.full_name}</td>
        <td>${s.research_area}</td>
        <td>${chip}</td>
        <td>${goalsAchieved}</td>
        <td>${lastUpdated}</td>
      `;
      tr.addEventListener('click', () => {
        appState.page = 'student_detail';
        appState.selectedStudentId = s.id;
        setActiveNav('students');
        renderStudentDetail(root, s.id);
      });
      tbody.appendChild(tr);
    }

    recentCard.appendChild(table);

    root.appendChild(header);
    root.appendChild(kpis);
    root.appendChild(recentCard);
  };

  const renderStudents = (root) => {
    const data = appState.data;
    const currentMonday = getCurrentMondayHKISO();

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<div class="page-title">Students</div>`;

    const controls = document.createElement('div');
    controls.className = 'filters';
    controls.innerHTML = `
      <input type="text" class="input" id="searchName" placeholder="Search by name" value="${appState.filters.search}" />
      <select id="filterStatus">
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select id="filterTeam">
        <option value="all">All teams</option>
        ${data.teams.map(t => `<option value="${t.id}">${t.team_name}</option>`).join('')}
      </select>
      <select id="filterThisWeek">
        <option value="all">All</option>
        <option value="yes">Has entry this week</option>
        <option value="no">No entry this week</option>
      </select>
    `;

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Research Area</th>
          <th>Current Week Status</th>
          <th>Goals Achieved (#)</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const applyFilters = () => {
      const name = document.getElementById('searchName').value.trim().toLowerCase();
      const status = document.getElementById('filterStatus').value;
      const team = document.getElementById('filterTeam').value;
      const thisWeek = document.getElementById('filterThisWeek').value;

      appState.filters = { search: name, status, team, hasEntryThisWeek: thisWeek };

      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';

      let list = data.students.slice();
      if (name) list = list.filter(s => s.full_name.toLowerCase().includes(name));
      if (status !== 'all') list = list.filter(s => s.status === status);
      if (team !== 'all') {
        const memberIds = data.team_memberships.filter(m => m.team_id === team).map(m => m.student_id);
        list = list.filter(s => memberIds.includes(s.id));
      }
      if (thisWeek !== 'all') {
        list = list.filter(s => hasEntryThisWeek(data, s.id, currentMonday) === (thisWeek === 'yes'));
      }
      list.sort((a,b) => a.full_name.localeCompare(b.full_name));

      for (const s of list) {
        const current = getEntryByStudentAndWeek(data, s.id, currentMonday);
        const chip = current ? `<span class="chip ${current.overall_status}">${current.overall_status.replace('_',' ')}</span>` : '<span class="meta">No entry</span>';
        let goalsAchieved = '-';
        if (current) {
          const statuses = JSON.parse(current.per_goal_status_json);
          const total = statuses.length;
          const achieved = statuses.filter(x => x === 'achieved').length;
          goalsAchieved = `${achieved}/${total}`;
        }
        const lastUpdated = (() => {
          const entries = getEntriesByStudent(data, s.id);
          if (!entries.length) return '';
          const maxUpdated = entries.reduce((acc, e) => acc > e.updated_at ? acc : e.updated_at, entries[0].updated_at);
          return new Date(maxUpdated).toLocaleString();
        })();

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${s.full_name}</td>
          <td>${s.research_area}</td>
          <td>${chip}</td>
          <td>${goalsAchieved}</td>
          <td>${lastUpdated}</td>
        `;
        tr.addEventListener('click', () => {
          appState.page = 'student_detail';
          appState.selectedStudentId = s.id;
          setActiveNav('students');
          renderStudentDetail(root, s.id);
        });
        tbody.appendChild(tr);
      }
    };

    controls.addEventListener('input', (e) => {
      if (['searchName'].includes(e.target.id)) applyFilters();
    });
    controls.addEventListener('change', applyFilters);

    root.appendChild(header);
    root.appendChild(controls);
    root.appendChild(table);

    applyFilters();
  };

  const renderStudentDetail = (root, studentId) => {
    const data = appState.data;
    const student = getStudentById(data, studentId);
    if (!student) return;

    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'page-header';

    const teams = getTeamsByStudentId(data, studentId);
    const teamsText = teams.map(t => `<span class="badge">${t.team_name}</span>`).join(' ');

    const fourMondays = [0, -7, -14, -21].map(off => addDaysHK(getCurrentMondayHKISO(), off));
    const chips = fourMondays.map(w => {
      const e = getEntryByStudentAndWeek(data, studentId, w);
      return e ? `<span class="chip ${e.overall_status}">${e.overall_status.replace('_',' ')}</span>` : '<span class="badge">No entry</span>';
    }).join(' ');

    header.innerHTML = `
      <div>
        <div class="page-title">${student.full_name}</div>
        <div class="meta">${student.research_area} • Supervisor: ${student.supervisor} • Status: ${student.status}</div>
        <div style="margin-top:8px; display:flex; gap:6px; align-items:center; flex-wrap: wrap;">${teamsText}</div>
      </div>
      <div>
        <div class="meta" style="margin-bottom:6px;">Last 4 weeks</div>
        <div style="display:flex; gap:6px; flex-wrap: wrap;">${chips}</div>
      </div>
    `;

    const layout = document.createElement('div');
    layout.className = 'grid-2';

    // Timeline
    const timeline = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'card';
    title.innerHTML = `<div class="card-header"><strong>Weekly entries</strong></div>`;

    const entries = getEntriesByStudent(data, studentId);
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = "No entries for this week yet. Use 'Duplicate last week’s goals' to get started.";
      title.appendChild(empty);
    } else {
      for (const e of entries) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        const goals = JSON.parse(e.goals_set_json);
        const statuses = JSON.parse(e.per_goal_status_json);
        const nextGoals = JSON.parse(e.next_week_goals_json);
        const ga = statuses.filter(s => s === 'achieved').length;
        card.innerHTML = `
          <div class="entry-header">
            <div><strong>${formatISOForDisplay(e.week_start_date)}</strong> • <span class="chip ${e.overall_status}">${e.overall_status.replace('_',' ')}</span></div>
            <div>
              <button class="button" data-edit="${e.id}">Edit</button>
            </div>
          </div>
          <div class="entry-body">
            <div><strong>Goals (${ga}/${goals.length} achieved)</strong><div style="margin-top:6px; display:grid; gap:6px;">${goals.map((g,i) => `<div><span class="status-dot ${statuses[i]}"></span> ${g} (${statuses[i].replace('_',' ')})</div>`).join('')}</div></div>
            <div><strong>Progress notes</strong><div class="meta">${e.progress_notes || '-'}</div></div>
            <div><strong>Blockers</strong><div class="meta">${e.blockers || '-'}</div></div>
            ${e.reasons_if_not_achieved ? `<div><strong>Reasons if not achieved</strong><div class="meta">${e.reasons_if_not_achieved}</div></div>` : ''}
            <div><strong>Next week goals</strong><div class="meta">${nextGoals.map(g => `• ${g}`).join('<br/>')}</div></div>
          </div>
        `;
        title.appendChild(card);
      }
    }

    // Form
    const formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.innerHTML = `<div class="card-header"><strong>Quick add / edit weekly entry</strong></div>`;

    const form = document.createElement('form');
    form.className = 'entry-form';

    const defaultMonday = getCurrentMondayHKISO();

    form.innerHTML = `
      <div class="grid-3">
        <div class="field">
          <label for="weekDate">Week (Monday)</label>
          <input id="weekDate" name="weekDate" type="date" class="input" value="${defaultMonday}" required />
          <div class="help">HK timezone enforced</div>
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button type="button" class="button ghost" id="duplicateGoals">Duplicate last week’s goals</button>
        </div>
      </div>

      <div class="field">
        <label>Goals</label>
        <div id="goalsList" class="grid-responsive"></div>
        <button type="button" class="button" id="addGoal">+ Add Goal</button>
      </div>

      <div class="field">
        <label>Progress notes</label>
        <textarea id="progressNotes" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Blockers</label>
        <textarea id="blockers" rows="2"></textarea>
      </div>
      <div class="field">
        <label>Reasons if not achieved</label>
        <textarea id="reasons" rows="2"></textarea>
      </div>

      <div class="field">
        <label>Next week goals</label>
        <div id="nextGoalsList" class="grid-responsive"></div>
        <button type="button" class="button" id="addNextGoal">+ Add Next Week Goal</button>
      </div>

      <div>
        <button type="submit" class="button primary" id="saveEntry">Save Entry</button>
        <button type="button" class="button" id="cancelEdit" style="display:none;">Cancel Edit</button>
        <span class="meta" id="formModeLabel">Creating new entry</span>
      </div>
    `;

    const goalsList = form.querySelector('#goalsList');
    const nextGoalsList = form.querySelector('#nextGoalsList');
    const weekDateInput = form.querySelector('#weekDate');
    const progressNotesInput = form.querySelector('#progressNotes');
    const blockersInput = form.querySelector('#blockers');
    const reasonsInput = form.querySelector('#reasons');
    const formModeLabel = form.querySelector('#formModeLabel');
    const cancelEditBtn = form.querySelector('#cancelEdit');

    const makeGoalRow = (goalText = '') => {
      const div = document.createElement('div');
      div.className = 'goal-row';
      div.innerHTML = `
        <input type="text" class="input goal-text" placeholder="Goal description" value="${goalText.replace(/\"/g,'&quot;')}" />
        <select class="goal-status">
          <option value="achieved">achieved</option>
          <option value="partial" selected>partial</option>
          <option value="not_achieved">not_achieved</option>
        </select>
        <button type="button" class="remove" aria-label="Remove goal">✕</button>
      `;
      div.querySelector('.remove').addEventListener('click', () => div.remove());
      return div;
    };

    const makeNextGoalRow = (goalText = '') => {
      const div = document.createElement('div');
      div.className = 'next-goal-row';
      div.innerHTML = `
        <input type="text" class="input next-goal-text" placeholder="Next week goal" value="${goalText.replace(/\"/g,'&quot;')}" />
        <button type="button" class="remove" aria-label="Remove goal">✕</button>
      `;
      div.querySelector('.remove').addEventListener('click', () => div.remove());
      return div;
    };

    const addGoal = (text = '') => goalsList.appendChild(makeGoalRow(text));
    const addNextGoal = (text = '') => nextGoalsList.appendChild(makeNextGoalRow(text));

    // Seed the form with one row each for usability
    if (!goalsList.children.length) addGoal('');
    if (!nextGoalsList.children.length) addNextGoal('');

    form.querySelector('#addGoal').addEventListener('click', () => addGoal(''));
    form.querySelector('#addNextGoal').addEventListener('click', () => addNextGoal(''));

    // Duplicate last week
    form.querySelector('#duplicateGoals').addEventListener('click', () => {
      const dateISO = weekDateInput.value;
      const current = getEntriesByStudent(data, studentId);
      const sorted = current.slice().sort((a,b) => (a.week_start_date < b.week_start_date ? 1 : -1));
      const targetDate = dateISO;
      const prev = sorted.find(e => e.week_start_date < targetDate);
      if (prev) {
        const nextGoals = JSON.parse(prev.next_week_goals_json);
        goalsList.innerHTML = '';
        nextGoals.forEach(g => addGoal(g));
        // Clear statuses to partial by default (set by template)
        showToast('Copied last week\'s next week goals into goals. Statuses reset.', 'success');
      } else {
        showToast('No previous week found to duplicate from.', 'info');
      }
    });

    // Validate Monday
    weekDateInput.addEventListener('change', () => {
      const iso = weekDateInput.value;
      if (!isMondayHK(iso)) {
        showToast('Selected date must be a Monday (HK time).', 'error');
        // Reset to current Monday
        weekDateInput.value = getCurrentMondayHKISO();
      }
      // If editing, reflect date change in label
      if (appState.formEditingEntryId) {
        const editing = data.weekly_entries.find(e => e.id === appState.formEditingEntryId);
        if (editing) formModeLabel.textContent = `Editing entry for ${formatISOForDisplay(weekDateInput.value)}`;
      }
    });

    const loadEntryIntoForm = (entry) => {
      appState.formEditingEntryId = entry.id;
      cancelEditBtn.style.display = 'inline-flex';
      weekDateInput.value = entry.week_start_date;
      progressNotesInput.value = entry.progress_notes || '';
      blockersInput.value = entry.blockers || '';
      reasonsInput.value = entry.reasons_if_not_achieved || '';
      goalsList.innerHTML = '';
      nextGoalsList.innerHTML = '';
      const goals = JSON.parse(entry.goals_set_json);
      const statuses = JSON.parse(entry.per_goal_status_json);
      goals.forEach((g,i) => {
        const row = makeGoalRow(g);
        row.querySelector('.goal-status').value = statuses[i] || 'partial';
        goalsList.appendChild(row);
      });
      const nx = JSON.parse(entry.next_week_goals_json);
      nx.forEach(g => nextGoalsList.appendChild(makeNextGoalRow(g)));
      formModeLabel.textContent = `Editing entry for ${formatISOForDisplay(entry.week_start_date)}`;
    };

    cancelEditBtn.addEventListener('click', () => {
      appState.formEditingEntryId = null;
      cancelEditBtn.style.display = 'none';
      formModeLabel.textContent = 'Creating new entry';
      weekDateInput.value = defaultMonday;
      progressNotesInput.value = '';
      blockersInput.value = '';
      reasonsInput.value = '';
      goalsList.innerHTML = '';
      nextGoalsList.innerHTML = '';
      addGoal('');
      addNextGoal('');
    });

    // Hook Edit buttons
    title.addEventListener('click', (e) => {
      const id = e.target && e.target.getAttribute('data-edit');
      if (!id) return;
      const entry = data.weekly_entries.find(x => x.id === id);
      if (entry) loadEntryIntoForm(entry);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const weekISO = weekDateInput.value;
      if (!isMondayHK(weekISO)) {
        showToast('Selected date must be a Monday (HK time).', 'error');
        return;
      }
      const goals = Array.from(goalsList.querySelectorAll('.goal-text')).map(i => i.value.trim()).filter(Boolean);
      const statuses = Array.from(goalsList.querySelectorAll('.goal-status')).map(s => s.value);
      const nextGoals = Array.from(nextGoalsList.querySelectorAll('.next-goal-text')).map(i => i.value.trim()).filter(Boolean);
      if (goals.length === 0) { showToast('At least one goal is required.', 'error'); return; }
      if (nextGoals.length === 0) { showToast('At least one goal is required.', 'error'); return; }

      const overall = computeOverallStatusFromGoalStatuses(statuses);

      if (!appState.formEditingEntryId) {
        // Creating new
        if (!ensureUniqueWeeklyEntry(data, studentId, weekISO)) {
          showToast('Duplicate entry for this student and week.', 'error');
          return;
        }
        const entry = {
          id: uuid(),
          student_id: studentId,
          week_start_date: weekISO,
          goals_set_json: JSON.stringify(goals),
          per_goal_status_json: JSON.stringify(statuses),
          overall_status: overall,
          progress_notes: progressNotesInput.value.trim(),
          blockers: blockersInput.value.trim(),
          reasons_if_not_achieved: reasonsInput.value.trim(),
          next_week_goals_json: JSON.stringify(nextGoals),
          created_by: 'demo_user',
          created_at: nowISO(),
          updated_at: nowISO()
        };
        data.weekly_entries.push(entry);
        saveData(data);
        showToast('Weekly entry saved.', 'success');
        renderStudentDetail(root, studentId);
      } else {
        // Editing existing entry
        const existing = data.weekly_entries.find(e => e.id === appState.formEditingEntryId);
        if (!existing) { showToast('Editing target not found.', 'error'); return; }
        if (!ensureUniqueWeeklyEntry(data, studentId, weekISO, existing.id)) {
          showToast('Duplicate entry for this student and week.', 'error');
          return;
        }
        existing.week_start_date = weekISO;
        existing.goals_set_json = JSON.stringify(goals);
        existing.per_goal_status_json = JSON.stringify(statuses);
        existing.overall_status = overall;
        existing.progress_notes = progressNotesInput.value.trim();
        existing.blockers = blockersInput.value.trim();
        existing.reasons_if_not_achieved = reasonsInput.value.trim();
        existing.next_week_goals_json = JSON.stringify(nextGoals);
        existing.updated_at = nowISO();
        saveData(data);
        showToast('Weekly entry saved.', 'success');
        renderStudentDetail(root, studentId);
      }
    });

    timeline.appendChild(title);
    formCard.appendChild(form);

    layout.appendChild(formCard);
    layout.appendChild(timeline);

    root.appendChild(header);
    root.appendChild(layout);
  };

  const renderTeams = (root) => {
    const data = appState.data;

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<div class="page-title">Teams</div>`;

    const grid = document.createElement('div');
    grid.className = 'grid-responsive';

    const last3Mondays = [0, -7, -14].map(off => addDaysHK(getCurrentMondayHKISO(), off));

    for (const t of data.teams) {
      const card = document.createElement('div');
      card.className = 'team-card';
      const members = data.team_memberships.filter(m => m.team_id === t.id).map(m => getStudentById(data, m.student_id).full_name);
      const entries = data.team_weekly_entries.filter(e => e.team_id === t.id).sort((a,b) => (a.week_start_date < b.week_start_date ? 1 : -1));

      card.innerHTML = `
        <div class="team-header">
          <div>
            <div><strong>${t.team_name}</strong></div>
            <div class="meta">${t.description}</div>
          </div>
          <div class="badge">Members: ${members.length}</div>
        </div>
        <div class="team-members">${members.join(', ')}</div>
        <div class="separator"></div>
        <div>
          <div class="meta" style="margin-bottom:6px;">Last 3 Mondays</div>
          ${last3Mondays.map(w => {
            const e = entries.find(x => x.week_start_date === w);
            if (!e) return `<div class="entry-card"><strong>${formatISOForDisplay(w)}</strong><div class="meta">No entry</div></div>`;
            const goals = JSON.parse(e.team_goals_set_json);
            const ng = JSON.parse(e.next_week_team_goals_json);
            return `
              <div class="entry-card">
                <div class="entry-header"><strong>${formatISOForDisplay(e.week_start_date)}</strong> • <span class="chip ${e.team_overall_status}">${e.team_overall_status.replace('_',' ')}</span></div>
                <div class="entry-body">
                  <div><strong>Team goals</strong><div class="meta">${goals.map(g => `• ${g}`).join('<br/>')}</div></div>
                  <div><strong>Progress notes</strong><div class="meta">${e.team_progress_notes || '-'}</div></div>
                  <div><strong>Blockers</strong><div class="meta">${e.team_blockers || '-'}</div></div>
                  <div><strong>Next week goals</strong><div class="meta">${ng.map(g => `• ${g}`).join('<br/>')}</div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      grid.appendChild(card);
    }

    root.appendChild(header);
    root.appendChild(grid);
  };

  const renderReports = (root) => {
    const data = appState.data;

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<div class="page-title">Reports</div><div class="meta">Download CSV exports</div>`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="grid-responsive">
        <div>
          <div><strong>Students</strong></div>
          <button class="button" id="dlStudents">Download students.csv</button>
        </div>
        <div>
          <div><strong>Weekly entries</strong></div>
          <button class="button" id="dlWeekly">Download weekly_entries.csv</button>
        </div>
        <div>
          <div><strong>Teams</strong></div>
          <button class="button" id="dlTeams">Download teams.csv</button>
        </div>
        <div>
          <div><strong>Team memberships</strong></div>
          <button class="button" id="dlMemberships">Download team_memberships.csv</button>
        </div>
        <div>
          <div><strong>Team weekly entries</strong></div>
          <button class="button" id="dlTeamWeekly">Download team_weekly_entries.csv</button>
        </div>
      </div>
    `;

    const headers = {
      students: ["id","full_name","email","cohort","start_date","status","notes","research_area","supervisor","created_at","updated_at"],
      weekly_entries: ["id","student_id","week_start_date","goals_set_json","per_goal_status_json","overall_status","progress_notes","blockers","reasons_if_not_achieved","next_week_goals_json","created_by","created_at","updated_at"],
      teams: ["id","team_name","description","created_at","updated_at"],
      team_memberships: ["id","team_id","student_id","role_in_team","created_at"],
      team_weekly_entries: ["id","team_id","week_start_date","team_goals_set_json","team_overall_status","team_progress_notes","team_blockers","next_week_team_goals_json","created_by","created_at","updated_at"]
    };

    const toDownload = (filename, rows, order) => {
      const csv = toCSV(rows, order);
      downloadTextFile(filename, csv);
    };

    card.querySelector('#dlStudents').addEventListener('click', () => toDownload('students.csv', data.students, headers.students));
    card.querySelector('#dlWeekly').addEventListener('click', () => toDownload('weekly_entries.csv', data.weekly_entries, headers.weekly_entries));
    card.querySelector('#dlTeams').addEventListener('click', () => toDownload('teams.csv', data.teams, headers.teams));
    card.querySelector('#dlMemberships').addEventListener('click', () => toDownload('team_memberships.csv', data.team_memberships, headers.team_memberships));
    card.querySelector('#dlTeamWeekly').addEventListener('click', () => toDownload('team_weekly_entries.csv', data.team_weekly_entries, headers.team_weekly_entries));

    root.appendChild(header);
    root.appendChild(card);
  };

  const renderSettings = (root) => {
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<div class="page-title">Settings</div>`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; flex-wrap: wrap;">
        <button class="button danger" id="resetDemo">Reset Demo Data</button>
        <div class="meta">Clears LocalStorage and reseeds demo data.</div>
      </div>
    `;

    card.querySelector('#resetDemo').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      appState.data = seedDemoData();
      appState.page = 'dashboard';
      render();
      showToast('Demo data reset and reseeded.', 'success');
    });

    root.appendChild(header);
    root.appendChild(card);
  };

  // -------------------- Init --------------------
  const init = () => {
    // Nav events
    document.querySelector('.nav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-link');
      if (!btn) return;
      const page = btn.dataset.page;
      if (page === 'dashboard' || page === 'students' || page === 'teams' || page === 'reports' || page === 'settings') {
        appState.page = page;
        appState.selectedStudentId = null;
        render();
        document.getElementById('mainContent').focus();
      }
    });

    // Load or seed
    const existing = loadData();
    if (!existing) {
      appState.data = seedDemoData();
    } else {
      appState.data = existing;
    }

    render();
  };

  // Auto-init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();