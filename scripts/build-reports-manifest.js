#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const OUTPUT_FILE = path.join(
  ROOT,
  'docs/05-Project/reports-dashboard/reports-manifest.json',
);

const ANALYZE_ENABLED = process.argv.includes('--analyze');
const HISTORY_LIMIT = 5;

const SCANNER_META = {
  zap: { label: 'ZAP', kind: 'DAST' },
  semgrep: { label: 'Semgrep', kind: 'SAST' },
  trivy: { label: 'Trivy', kind: 'Vulnerability Scan' },
  megalinter: { label: 'MegaLinter', kind: 'Code Quality' },
};

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function relPath(absolutePath) {
  return toPosix(path.relative(ROOT, absolutePath));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readDirSafe(directoryPath) {
  try {
    return fs.readdirSync(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readJsonSafe(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readTextSafe(filePath, maxChars = 12000) {
  if (!exists(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.length > maxChars ? raw.slice(0, maxChars) : raw;
  } catch {
    return null;
  }
}

function parseTimestampToIso(timestamp) {
  const match = String(timestamp).match(
    /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

function normalizeSeverity(value) {
  const raw = String(value || 'UNKNOWN').toUpperCase();
  if (raw === 'INFO' || raw === 'INFORMATIONAL') {
    return 'INFO';
  }
  if (raw.includes('CRIT')) {
    return 'CRITICAL';
  }
  if (raw.includes('HIGH')) {
    return 'HIGH';
  }
  if (raw.includes('MED')) {
    return 'MEDIUM';
  }
  if (raw.includes('LOW')) {
    return 'LOW';
  }
  if (raw.includes('WARN')) {
    return 'WARNING';
  }
  if (raw.includes('ERR')) {
    return 'ERROR';
  }
  return raw;
}

function statusRank(status) {
  if (status === 'fail') {
    return 3;
  }
  if (status === 'warning') {
    return 2;
  }
  if (status === 'pass') {
    return 1;
  }
  return 0;
}

function chooseWorstStatus(a, b) {
  return statusRank(a) >= statusRank(b) ? a : b;
}

function sortRunsDesc(entries) {
  return [...entries].sort((a, b) => b.run.localeCompare(a.run));
}

function pickHistory(entries) {
  return entries.slice(1, HISTORY_LIMIT + 1);
}

function formatIssuesForPrompt(items, max = 10) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'No issues.';
  }
  return items
    .slice(0, max)
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');
}

function loadDotEnvFile(filePath) {
  if (!exists(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const valueRaw = trimmed.slice(eqIndex + 1).trim();
    const quoted =
      (valueRaw.startsWith('"') && valueRaw.endsWith('"')) ||
      (valueRaw.startsWith("'") && valueRaw.endsWith("'"));
    const value = quoted ? valueRaw.slice(1, -1) : valueRaw;

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadEnvironment() {
  loadDotEnvFile(path.join(ROOT, '.env'));
}

function buildLinks(entries) {
  return entries
    .filter((entry) => entry && entry.path)
    .map((entry) => ({
      label: entry.label,
      path: entry.path,
      type: entry.type || 'html',
    }));
}

function collectSemgrepRuns() {
  const scannerDir = path.join(REPORTS_DIR, 'semgrep');
  const entries = readDirSafe(scannerDir);
  const runs = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const match = entry.name.match(/^(\d{8}-\d{6})-(backend|frontend)\.(json|html)$/);
    if (!match) {
      continue;
    }

    const [, run, target, ext] = match;
    const filePath = path.join(scannerDir, entry.name);
    const runEntry = runs.get(run) || { run, targets: {} };
    runEntry.targets[target] = runEntry.targets[target] || {};
    runEntry.targets[target][ext] = relPath(filePath);
    runs.set(run, runEntry);
  }

  const output = [];

  for (const runEntry of runs.values()) {
    const severity = { ERROR: 0, WARNING: 0, INFO: 0, UNKNOWN: 0 };
    const findings = [];
    let findingsTotal = 0;

    for (const [target, files] of Object.entries(runEntry.targets)) {
      if (!files.json) {
        continue;
      }

      const report = readJsonSafe(path.join(ROOT, files.json));
      const results = Array.isArray(report?.results) ? report.results : [];

      for (const result of results) {
        const normalized = normalizeSeverity(result?.extra?.severity || 'UNKNOWN');
        const severityKey =
          normalized === 'ERROR' || normalized === 'WARNING' || normalized === 'INFO'
            ? normalized
            : 'UNKNOWN';
        severity[severityKey] += 1;
        findingsTotal += 1;

        if (findings.length < 15) {
          const filePath = result?.path || 'unknown file';
          const line = result?.start?.line || '?';
          const rule = result?.check_id || 'unknown-rule';
          const message = result?.extra?.message || 'No details';
          findings.push(`[${normalized}] ${target} ${filePath}:${line} ${rule} - ${message}`);
        }
      }
    }

    let status = 'pass';
    if (severity.ERROR > 0) {
      status = 'fail';
    } else if (findingsTotal > 0) {
      status = 'warning';
    }

    const links = buildLinks(
      Object.entries(runEntry.targets).flatMap(([target, files]) => [
        files.html
          ? { label: `${target} HTML`, path: files.html, type: 'html' }
          : null,
        files.json
          ? { label: `${target} JSON`, path: files.json, type: 'json' }
          : null,
      ]),
    );

    output.push({
      run: runEntry.run,
      run_iso: parseTimestampToIso(runEntry.run),
      status,
      links,
      metrics: {
        findings_total: findingsTotal,
        severity,
      },
      analysis_context: {
        findings_total: findingsTotal,
        severity,
        top_findings: findings,
      },
    });
  }

  const sorted = sortRunsDesc(output);
  return {
    scanner: 'semgrep',
    label: SCANNER_META.semgrep.label,
    kind: SCANNER_META.semgrep.kind,
    latest: sorted[0] || null,
    history: pickHistory(sorted),
  };
}

function riskLabelFromCode(riskCode) {
  if (riskCode >= 3) {
    return 'HIGH';
  }
  if (riskCode === 2) {
    return 'MEDIUM';
  }
  if (riskCode === 1) {
    return 'LOW';
  }
  return 'INFO';
}

function collectZapRuns() {
  const scannerDir = path.join(REPORTS_DIR, 'zap');
  const entries = readDirSafe(scannerDir);
  const runs = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const match = entry.name.match(
      /^(\d{8}-\d{6})-(zap-report|baseline-report)\.(json|html)$/,
    );
    if (!match) {
      continue;
    }

    const [, run, reportType, ext] = match;
    const filePath = path.join(scannerDir, entry.name);
    const runEntry = runs.get(run) || { run, report_type: reportType };
    runEntry[ext] = relPath(filePath);
    runs.set(run, runEntry);
  }

  const output = [];

  for (const runEntry of runs.values()) {
    const byRisk = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    const topAlerts = [];
    let alertsTotal = 0;

    if (runEntry.json) {
      const report = readJsonSafe(path.join(ROOT, runEntry.json));
      const sites = Array.isArray(report?.site) ? report.site : [];

      for (const site of sites) {
        const alerts = Array.isArray(site?.alerts) ? site.alerts : [];

        for (const alert of alerts) {
          const riskCode = Number(alert?.riskcode);
          const risk = riskLabelFromCode(Number.isNaN(riskCode) ? 0 : riskCode);
          const countFromField = Number(alert?.count);
          const countFromInstances = Array.isArray(alert?.instances)
            ? alert.instances.length
            : 1;
          const count = Number.isNaN(countFromField) ? countFromInstances : countFromField;

          byRisk[risk] += count;
          alertsTotal += count;

          if (topAlerts.length < 15) {
            const uri = Array.isArray(alert?.instances) && alert.instances[0]?.uri
              ? alert.instances[0].uri
              : 'no endpoint';
            const name = alert?.alert || alert?.name || 'Unnamed alert';
            topAlerts.push(`[${risk}] ${name} (${count}) on ${uri}`);
          }
        }
      }
    }

    let status = 'pass';
    if (byRisk.HIGH > 0) {
      status = 'fail';
    } else if (byRisk.MEDIUM > 0) {
      status = 'warning';
    }

    const links = buildLinks([
      runEntry.html ? { label: 'HTML report', path: runEntry.html, type: 'html' } : null,
      runEntry.json ? { label: 'JSON report', path: runEntry.json, type: 'json' } : null,
    ]);

    output.push({
      run: runEntry.run,
      run_iso: parseTimestampToIso(runEntry.run),
      report_type: runEntry.report_type,
      status,
      links,
      metrics: {
        alerts_total: alertsTotal,
        by_risk: byRisk,
      },
      analysis_context: {
        report_type: runEntry.report_type,
        alerts_total: alertsTotal,
        by_risk: byRisk,
        top_alerts: topAlerts,
      },
    });
  }

  const sorted = sortRunsDesc(output);
  return {
    scanner: 'zap',
    label: SCANNER_META.zap.label,
    kind: SCANNER_META.zap.kind,
    latest: sorted[0] || null,
    history: pickHistory(sorted),
  };
}

function parseTrivyJsonReport(report) {
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  const topIssues = [];
  let total = 0;

  const results = Array.isArray(report?.Results) ? report.Results : [];

  for (const result of results) {
    const vulnerabilities = Array.isArray(result?.Vulnerabilities)
      ? result.Vulnerabilities
      : [];
    const misconfigurations = Array.isArray(result?.Misconfigurations)
      ? result.Misconfigurations
      : [];

    for (const vuln of vulnerabilities) {
      const severity = normalizeSeverity(vuln?.Severity || 'UNKNOWN');
      const key =
        severity === 'CRITICAL' ||
        severity === 'HIGH' ||
        severity === 'MEDIUM' ||
        severity === 'LOW'
          ? severity
          : 'UNKNOWN';
      bySeverity[key] += 1;
      total += 1;

      if (topIssues.length < 20) {
        const vulnId = vuln?.VulnerabilityID || 'NO-CVE';
        const pkg = vuln?.PkgName || 'unknown package';
        const target = result?.Target || 'unknown target';
        const fixed = vuln?.FixedVersion || 'none';
        topIssues.push(`[${key}] ${vulnId} in ${pkg} (${target}) fixed:${fixed}`);
      }
    }

    for (const misconfig of misconfigurations) {
      const severity = normalizeSeverity(misconfig?.Severity || 'UNKNOWN');
      const key =
        severity === 'CRITICAL' ||
        severity === 'HIGH' ||
        severity === 'MEDIUM' ||
        severity === 'LOW'
          ? severity
          : 'UNKNOWN';
      bySeverity[key] += 1;
      total += 1;

      if (topIssues.length < 20) {
        const title = misconfig?.Title || misconfig?.ID || 'misconfiguration';
        const target = result?.Target || 'unknown target';
        topIssues.push(`[${key}] ${title} (${target})`);
      }
    }
  }

  return { total, bySeverity, topIssues };
}

function collectTrivyRuns() {
  const scannerDir = path.join(REPORTS_DIR, 'trivy');
  const entries = readDirSafe(scannerDir);
  const runs = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const match = entry.name.match(/^(\d{8}-\d{6})-(backend|frontend|fs)\.(json|html)$/);
    if (!match) {
      continue;
    }

    const [, run, target, ext] = match;
    const filePath = path.join(scannerDir, entry.name);
    const runEntry = runs.get(run) || { run, targets: {} };
    runEntry.targets[target] = runEntry.targets[target] || {};
    runEntry.targets[target][ext] = relPath(filePath);
    runs.set(run, runEntry);
  }

  const output = [];

  for (const runEntry of runs.values()) {
    const aggregate = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    const topIssues = [];
    let total = 0;
    let hasAnyJson = false;

    for (const files of Object.values(runEntry.targets)) {
      if (!files.json) {
        continue;
      }
      hasAnyJson = true;
      const report = readJsonSafe(path.join(ROOT, files.json));
      const parsed = parseTrivyJsonReport(report || {});
      total += parsed.total;

      for (const [severity, count] of Object.entries(parsed.bySeverity)) {
        aggregate[severity] += count;
      }

      for (const item of parsed.topIssues) {
        if (topIssues.length < 20) {
          topIssues.push(item);
        }
      }
    }

    let status = 'unknown';
    if (hasAnyJson) {
      if (aggregate.CRITICAL > 0 || aggregate.HIGH > 0) {
        status = 'fail';
      } else if (aggregate.MEDIUM > 0 || aggregate.LOW > 0 || aggregate.UNKNOWN > 0) {
        status = 'warning';
      } else {
        status = 'pass';
      }
    }

    const links = buildLinks(
      Object.entries(runEntry.targets).flatMap(([target, files]) => [
        files.html
          ? { label: `${target} HTML`, path: files.html, type: 'html' }
          : null,
        files.json
          ? { label: `${target} JSON`, path: files.json, type: 'json' }
          : null,
      ]),
    );

    output.push({
      run: runEntry.run,
      run_iso: parseTimestampToIso(runEntry.run),
      status,
      links,
      metrics: {
        issues_total: total,
        by_severity: aggregate,
        has_json: hasAnyJson,
      },
      analysis_context: {
        issues_total: total,
        by_severity: aggregate,
        has_json: hasAnyJson,
        top_issues: topIssues,
      },
    });
  }

  const sorted = sortRunsDesc(output);
  return {
    scanner: 'trivy',
    label: SCANNER_META.trivy.label,
    kind: SCANNER_META.trivy.kind,
    latest: sorted[0] || null,
    history: pickHistory(sorted),
  };
}

function parseMegalinterRun(runDirAbs) {
  const logsDir = path.join(runDirAbs, 'linters_logs');
  const logs = readDirSafe(logsDir).filter((entry) => entry.isFile() && entry.name.endsWith('.log'));
  const errors = [];
  const warnings = [];
  const success = [];
  const issueLines = [];

  for (const logEntry of logs) {
    const levelMatch = logEntry.name.match(/^(ERROR|WARNING|SUCCESS)-/);
    const linterMatch = logEntry.name.match(/^[A-Z]+-(.+)\.log$/);
    const linterName = linterMatch ? linterMatch[1] : logEntry.name;
    const level = levelMatch ? levelMatch[1] : 'UNKNOWN';

    if (level === 'ERROR') {
      errors.push(linterName);
    } else if (level === 'WARNING') {
      warnings.push(linterName);
    } else if (level === 'SUCCESS') {
      success.push(linterName);
    }

    const logPath = path.join(logsDir, logEntry.name);
    const excerpt = readTextSafe(logPath, 9000);
    if (excerpt) {
      const lines = excerpt
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(
          (line) =>
            line &&
            (line.includes('error') ||
              line.includes('warning') ||
              line.includes('Clone found') ||
              /^\S+\:\d+/.test(line)),
        )
        .slice(0, 10)
        .map((line) => `${linterName}: ${line}`);
      issueLines.push(...lines);
    }
  }

  let status = 'pass';
  if (errors.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warning';
  }

  const links = buildLinks([
    exists(path.join(runDirAbs, 'copy-paste/html/index.html'))
      ? {
          label: 'JSCPD HTML',
          path: relPath(path.join(runDirAbs, 'copy-paste/html/index.html')),
          type: 'html',
        }
      : null,
    exists(path.join(runDirAbs, 'megalinter-report.html'))
      ? {
          label: 'MegaLinter HTML',
          path: relPath(path.join(runDirAbs, 'megalinter-report.html')),
          type: 'html',
        }
      : null,
    exists(path.join(runDirAbs, 'megalinter.log'))
      ? {
          label: 'MegaLinter log',
          path: relPath(path.join(runDirAbs, 'megalinter.log')),
          type: 'log',
        }
      : null,
  ]);

  return {
    status,
    links,
    errors,
    warnings,
    success,
    issue_lines: issueLines.slice(0, 25),
  };
}

function collectMegalinterRuns() {
  const roots = [
    { key: 'quality', label: 'Quality', abs: path.join(REPORTS_DIR, 'megalinter') },
    {
      key: 'frontend',
      label: 'Frontend',
      abs: path.join(REPORTS_DIR, 'megalinter-frontend'),
    },
  ];

  const runs = new Map();

  for (const root of roots) {
    const entries = readDirSafe(root.abs);

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const run = entry.name;
      if (!/^\d{8}-\d{6}$/.test(run)) {
        continue;
      }

      const runEntry = runs.get(run) || { run, channels: {} };
      runEntry.channels[root.key] = {
        label: root.label,
        ...parseMegalinterRun(path.join(root.abs, run)),
      };
      runs.set(run, runEntry);
    }
  }

  const output = [];

  for (const runEntry of runs.values()) {
    const channels = Object.values(runEntry.channels);
    const links = [];
    const errors = [];
    const warnings = [];
    const issueLines = [];
    let status = 'pass';

    for (const channel of channels) {
      status = chooseWorstStatus(status, channel.status);
      for (const link of channel.links) {
        links.push({
          label: `${channel.label} - ${link.label}`,
          path: link.path,
          type: link.type,
        });
      }
      errors.push(...channel.errors.map((value) => `${channel.label}:${value}`));
      warnings.push(...channel.warnings.map((value) => `${channel.label}:${value}`));
      issueLines.push(...channel.issue_lines.map((value) => `${channel.label}: ${value}`));
    }

    output.push({
      run: runEntry.run,
      run_iso: parseTimestampToIso(runEntry.run),
      status,
      links,
      metrics: {
        channels: channels.length,
        error_linters: errors.length,
        warning_linters: warnings.length,
      },
      analysis_context: {
        error_linters: errors,
        warning_linters: warnings,
        issue_lines: issueLines.slice(0, 30),
      },
    });
  }

  const sorted = sortRunsDesc(output);
  return {
    scanner: 'megalinter',
    label: SCANNER_META.megalinter.label,
    kind: SCANNER_META.megalinter.kind,
    latest: sorted[0] || null,
    history: pickHistory(sorted),
  };
}

function resolveLlmConfig() {
  const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();

  if (provider === 'anthropic') {
    return {
      provider,
      model: process.env.LLM_MODEL || 'claude-3-5-haiku-20241022',
      hasCredentials: Boolean(process.env.ANTHROPIC_API_KEY),
    };
  }

  if (provider === 'openai') {
    return {
      provider,
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      hasCredentials: Boolean(process.env.OPENAI_API_KEY),
    };
  }

  if (provider === 'ollama') {
    return {
      provider,
      model: process.env.LLM_MODEL || 'llama3.2',
      baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      hasCredentials: true,
    };
  }

  return {
    provider,
    model: process.env.LLM_MODEL || 'unknown',
    hasCredentials: false,
  };
}

async function callAnthropic(config, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 360,
      temperature: 0.2,
      system:
        'You are a security/code-quality analyst. Keep answers concise, practical, and prioritized.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic HTTP ${response.status}`);
  }

  const payload = await response.json();
  const first = Array.isArray(payload?.content) ? payload.content[0] : null;
  const text = first?.text ? String(first.text).trim() : '';
  if (!text) {
    throw new Error('Anthropic empty response');
  }
  return text;
}

async function callOpenAI(config, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 360,
      messages: [
        {
          role: 'system',
          content:
            'You are a security/code-quality analyst. Keep answers concise, practical, and prioritized.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content
    ? String(payload.choices[0].message.content).trim()
    : '';
  if (!text) {
    throw new Error('OpenAI empty response');
  }
  return text;
}

async function callOllama(config, prompt) {
  const endpoint = `${String(config.baseUrl || '').replace(/\/$/, '')}/api/generate`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      options: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.response ? String(payload.response).trim() : '';
  if (!text) {
    throw new Error('Ollama empty response');
  }
  return text;
}

function staticAnalysisForPass(scannerId, latest) {
  if (!latest) {
    return null;
  }

  if (scannerId === 'semgrep') {
    return 'Aucun finding Semgrep detecte sur le dernier run. Maintenir la meme baseline de regles et continuer les scans a chaque merge.';
  }

  if (scannerId === 'zap') {
    return 'Aucune alerte Medium/High detectee par ZAP sur le dernier run. Garder ce scan dans la CI et verifier regulierement les endpoints nouveaux.';
  }

  if (scannerId === 'trivy') {
    return 'Aucune vulnerabilite detectee sur les JSON Trivy du dernier run. Continuer a scanner images et filesystem avant release.';
  }

  if (scannerId === 'megalinter') {
    return 'MegaLinter ne remonte pas d erreur ni warning sur le dernier run. Conserver ce niveau en pre-commit et en CI.';
  }

  return 'Aucun point bloquant detecte sur le dernier run.';
}

function buildAnalysisPrompt(scannerId, latest) {
  const context = latest?.analysis_context || {};
  const scannerTitle = SCANNER_META[scannerId]?.label || scannerId;

  return [
    'Analyse en francais, concise, orientee action.',
    'Format strict:',
    '- 1 ligne "Constat"',
    '- 1 ligne "Impact"',
    '- 3 actions priorisees (P1/P2/P3)',
    '- 1 ligne "Quick wins 48h"',
    '',
    `Scanner: ${scannerTitle}`,
    `Run: ${latest?.run || 'unknown'}`,
    `Status calcule: ${latest?.status || 'unknown'}`,
    '',
    'Contexte JSON resume:',
    JSON.stringify(context, null, 2),
    '',
    'Ne pas inventer de donnees hors contexte.',
  ].join('\n');
}

async function generateLlmAnalysis(scannerId, latest, config) {
  if (!latest) {
    return { state: 'not_available', text: null };
  }

  if (latest.status === 'unknown') {
    return { state: 'not_available', text: null };
  }

  if (latest.status === 'pass') {
    return {
      state: 'ready',
      provider: 'static',
      model: 'none',
      text: staticAnalysisForPass(scannerId, latest),
      generated_at: new Date().toISOString(),
    };
  }

  if (!ANALYZE_ENABLED) {
    return { state: 'disabled', text: null };
  }

  if (!config.hasCredentials) {
    return { state: 'missing_credentials', text: null };
  }

  const prompt = buildAnalysisPrompt(scannerId, latest);
  let text;

  if (config.provider === 'anthropic') {
    text = await callAnthropic(config, prompt);
  } else if (config.provider === 'openai') {
    text = await callOpenAI(config, prompt);
  } else if (config.provider === 'ollama') {
    text = await callOllama(config, prompt);
  } else {
    return { state: 'unsupported_provider', text: null };
  }

  return {
    state: 'ready',
    provider: config.provider,
    model: config.model,
    text,
    generated_at: new Date().toISOString(),
  };
}

function stableScannerPayload(scanner) {
  return {
    scanner: scanner.scanner,
    label: scanner.label,
    kind: scanner.kind,
    latest: scanner.latest,
    history: scanner.history,
  };
}

async function hydrateAnalyses(scanners, previousManifest) {
  const config = resolveLlmConfig();
  const output = {};

  // AGENT-DECISION: arch — Cache previous analysis by run id to avoid
  // unnecessary LLM calls and keep reports-manifest generation deterministic.
  for (const scanner of scanners) {
    const payload = stableScannerPayload(scanner);

    if (!payload.latest) {
      output[payload.scanner] = payload;
      continue;
    }

    const prevLatest = previousManifest?.scanners?.[payload.scanner]?.latest;
    if (
      prevLatest?.run === payload.latest.run &&
      prevLatest?.analysis &&
      prevLatest.analysis.state === 'ready' &&
      prevLatest.analysis.text
    ) {
      payload.latest.analysis = prevLatest.analysis;
      output[payload.scanner] = payload;
      continue;
    }

    try {
      payload.latest.analysis = await generateLlmAnalysis(
        payload.scanner,
        payload.latest,
        config,
      );
    } catch (error) {
      payload.latest.analysis = {
        state: 'error',
        text: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    output[payload.scanner] = payload;
  }

  return {
    scanners: output,
    llm: {
      enabled: ANALYZE_ENABLED,
      provider: config.provider,
      model: config.model,
    },
  };
}

function summarizeGlobal(scanners) {
  const latestEntries = Object.values(scanners)
    .map((scanner) => scanner.latest)
    .filter(Boolean);

  const summary = {
    scanners_total: latestEntries.length,
    pass: 0,
    warning: 0,
    fail: 0,
    unknown: 0,
  };

  for (const latest of latestEntries) {
    if (latest.status === 'fail') {
      summary.fail += 1;
    } else if (latest.status === 'warning') {
      summary.warning += 1;
    } else if (latest.status === 'pass') {
      summary.pass += 1;
    } else {
      summary.unknown += 1;
    }
  }

  return summary;
}

async function main() {
  loadEnvironment();

  const previousManifest = readJsonSafe(OUTPUT_FILE) || {};

  const collected = [
    collectZapRuns(),
    collectSemgrepRuns(),
    collectTrivyRuns(),
    collectMegalinterRuns(),
  ];

  const hydrated = await hydrateAnalyses(collected, previousManifest);
  const summary = summarizeGlobal(hydrated.scanners);

  const manifest = {
    generated_at: new Date().toISOString(),
    summary,
    llm: hydrated.llm,
    scanners: hydrated.scanners,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `reports-manifest written: ${relPath(OUTPUT_FILE)} (analyze=${ANALYZE_ENABLED})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `Failed to build reports manifest: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
