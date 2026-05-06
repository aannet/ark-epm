#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(
  ROOT,
  'docs/05-Project/test-coverage-dashboard/coverage-data.json',
);

const INPUTS = {
  jestUnitReport: path.join(ROOT, 'backend/reports/jest-unit-results.json'),
  jestE2eReport: path.join(ROOT, 'backend/reports/jest-e2e-results.json'),
  jestCoverage: path.join(ROOT, 'backend/coverage/coverage-summary.json'),
  playwrightReport: path.join(ROOT, 'e2e/reports/results.json'),
  cypressReport: path.join(ROOT, 'frontend/cypress/reports/results.json'),
};

const FRAMEWORK_ORDER = [
  'jest_unit',
  'jest_e2e',
  'playwright_api',
  'playwright_ui',
  'cypress',
];

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function statMtime(filePath) {
  if (!exists(filePath)) {
    return null;
  }
  return fs.statSync(filePath).mtime.toISOString();
}

function readJsonLoose(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');

    if (first === -1 || last === -1 || last <= first) {
      return null;
    }

    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

function resolveProjectPath(inputPath, source) {
  if (!inputPath) {
    return null;
  }

  const cleaned = toPosix(String(inputPath)).replace(/^\.\//, '');

  if (path.isAbsolute(inputPath)) {
    return toPosix(path.relative(ROOT, inputPath));
  }

  if (
    cleaned.startsWith('backend/') ||
    cleaned.startsWith('frontend/') ||
    cleaned.startsWith('e2e/')
  ) {
    return cleaned;
  }

  if (cleaned.startsWith('src/')) {
    return source.startsWith('jest') ? `backend/${cleaned}` : cleaned;
  }

  if (cleaned.startsWith('test/')) {
    return source === 'jest_e2e' ? `backend/${cleaned}` : cleaned;
  }

  if (cleaned.startsWith('tests/')) {
    return source.startsWith('playwright') ? `e2e/${cleaned}` : cleaned;
  }

  if (cleaned.startsWith('cypress/')) {
    return `frontend/${cleaned}`;
  }

  return cleaned;
}

function walkFiles(directoryPath) {
  if (!exists(directoryPath)) {
    return [];
  }

  const output = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    const absolute = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(absolute));
      continue;
    }

    output.push(absolute);
  }

  return output;
}

function classifyTestFile(relativePath) {
  const normalized = toPosix(relativePath);

  if (normalized.startsWith('backend/src/') && /\.spec\.ts$/.test(normalized)) {
    return 'jest_unit';
  }

  if (normalized.startsWith('backend/test/') && /\.e2e-spec\.ts$/.test(normalized)) {
    return 'jest_e2e';
  }

  if (normalized.startsWith('e2e/tests/') && /\.api\.spec\.ts$/.test(normalized)) {
    return 'playwright_api';
  }

  if (
    normalized.startsWith('e2e/tests/') &&
    ((/\.spec\.ts$/.test(normalized) && !/\.api\.spec\.ts$/.test(normalized)) ||
      /\.cy\.(ts|tsx|js|jsx)$/.test(normalized))
  ) {
    return 'playwright_ui';
  }

  if (
    normalized.startsWith('frontend/cypress/e2e/') &&
    /\.cy\.(ts|tsx|js|jsx)$/.test(normalized)
  ) {
    return 'cypress';
  }

  return null;
}

function frameworkFamily(frameworkId) {
  if (frameworkId.startsWith('playwright')) {
    return 'playwright';
  }
  return frameworkId;
}

function detectFeature(relativePath) {
  const fileName = path.basename(relativePath);
  const match = fileName.match(/FS-(\d{2})/i);
  return match ? `FS-${match[1]}` : 'Core/Infra';
}

function summarizeStatus(total, pass, fail) {
  if (total == null) {
    return 'not_run';
  }
  if (total === 0) {
    return 'not_run';
  }
  if (fail > 0 && pass > 0) {
    return 'partial';
  }
  if (fail > 0) {
    return 'fail';
  }
  if (pass > 0) {
    return 'pass';
  }
  return 'unknown';
}

function addToMapCount(targetMap, key, patch) {
  const current = targetMap.get(key) || { total: 0, pass: 0, fail: 0, skipped: 0 };
  targetMap.set(key, {
    total: current.total + (patch.total || 0),
    pass: current.pass + (patch.pass || 0),
    fail: current.fail + (patch.fail || 0),
    skipped: current.skipped + (patch.skipped || 0),
  });
}

function parseJestReport(report, source) {
  if (!report) {
    return { summary: null, fileStats: new Map() };
  }

  const summary = {
    total: report.numTotalTests ?? 0,
    pass: report.numPassedTests ?? 0,
    fail: report.numFailedTests ?? 0,
    skipped: report.numPendingTests ?? 0,
  };

  const fileStats = new Map();
  const testResults = Array.isArray(report.testResults) ? report.testResults : [];

  for (const testResult of testResults) {
    const relativePath = resolveProjectPath(testResult.name, source);
    if (!relativePath) {
      continue;
    }

    const assertionResults = Array.isArray(testResult.assertionResults)
      ? testResult.assertionResults
      : [];

    let pass = 0;
    let fail = 0;
    let skipped = 0;

    for (const assertionResult of assertionResults) {
      if (assertionResult.status === 'passed') {
        pass += 1;
      } else if (assertionResult.status === 'failed') {
        fail += 1;
      } else if (assertionResult.status === 'pending' || assertionResult.status === 'skipped') {
        skipped += 1;
      }
    }

    addToMapCount(fileStats, relativePath, {
      total: pass + fail + skipped,
      pass,
      fail,
      skipped,
    });
  }

  return { summary, fileStats };
}

function statusFromPlaywrightResult(status) {
  if (status === 'passed') {
    return 'pass';
  }
  if (status === 'skipped') {
    return 'skipped';
  }
  return 'fail';
}

function newSummaryCounter() {
  return { total: 0, pass: 0, fail: 0, skipped: 0 };
}

function normalizePlaywrightProject(projectId) {
  if (projectId === 'api-backend') {
    return 'playwright_api';
  }
  if (projectId === 'ui') {
    return 'playwright_ui';
  }
  return null;
}

function parsePlaywrightReport(report) {
  if (!report) {
    return {
      summaries: {
        playwright_api: null,
        playwright_ui: null,
      },
      fileStats: new Map(),
    };
  }

  const summaries = {
    playwright_api: newSummaryCounter(),
    playwright_ui: newSummaryCounter(),
  };
  const hasPlaywrightData = {
    playwright_api: false,
    playwright_ui: false,
  };

  const fileStats = new Map();

  function visitSuite(suite, parentFile) {
    const suiteFile = suite.file ? resolveProjectPath(suite.file, 'playwright') : parentFile;
    const specs = Array.isArray(suite.specs) ? suite.specs : [];

    for (const spec of specs) {
      const specFile = spec.file
        ? resolveProjectPath(spec.file, 'playwright')
        : suiteFile;

      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      for (const test of tests) {
        const results = Array.isArray(test.results) ? test.results : [];
        const finalResult = results.length > 0 ? results[results.length - 1] : null;
        const status = statusFromPlaywrightResult(
          finalResult?.status || test.status || 'failed',
        );

        const byProject = normalizePlaywrightProject(test.projectId);
        let frameworkBucket = byProject;
        if (!frameworkBucket && specFile) {
          const byPath = classifyTestFile(specFile);
          if (byPath === 'playwright_api' || byPath === 'playwright_ui') {
            frameworkBucket = byPath;
          }
        }

        if (frameworkBucket) {
          hasPlaywrightData[frameworkBucket] = true;
          summaries[frameworkBucket].total += 1;
          if (status === 'pass') {
            summaries[frameworkBucket].pass += 1;
          } else if (status === 'skipped') {
            summaries[frameworkBucket].skipped += 1;
          } else {
            summaries[frameworkBucket].fail += 1;
          }
        }

        if (!specFile) {
          continue;
        }

        const fileFramework = frameworkBucket || classifyTestFile(specFile) || 'playwright_ui';
        const key = `${fileFramework}|${specFile}`;
        addToMapCount(fileStats, key, {
          total: 1,
          pass: status === 'pass' ? 1 : 0,
          fail: status === 'fail' ? 1 : 0,
          skipped: status === 'skipped' ? 1 : 0,
        });
      }
    }

    const children = Array.isArray(suite.suites) ? suite.suites : [];
    for (const child of children) {
      visitSuite(child, suiteFile);
    }
  }

  const rootSuites = Array.isArray(report.suites) ? report.suites : [];
  for (const rootSuite of rootSuites) {
    visitSuite(rootSuite, null);
  }

  return {
    summaries: {
      playwright_api: hasPlaywrightData.playwright_api ? summaries.playwright_api : null,
      playwright_ui: hasPlaywrightData.playwright_ui ? summaries.playwright_ui : null,
    },
    fileStats,
  };
}

function parseCypressReport(report) {
  if (!report) {
    return { summary: null, fileStats: new Map() };
  }

  const stats = report.stats || report.totalStats || null;
  const summary = stats
    ? {
        total: stats.tests ?? (stats.passes || 0) + (stats.failures || 0) + (stats.pending || 0),
        pass: stats.passes ?? 0,
        fail: stats.failures ?? 0,
        skipped: stats.pending ?? 0,
      }
    : null;

  const fileStats = new Map();

  // AGENT-DECISION: arch - Prefer resilient parsing over strict schema so mixed Cypress outputs still feed the dashboard.
  const runs = Array.isArray(report.runs)
    ? report.runs
    : Array.isArray(report.results?.runs)
      ? report.results.runs
      : [];

  for (const run of runs) {
    const specPath = run.spec?.relative || run.spec?.name || null;
    const relativePath = resolveProjectPath(specPath, 'cypress');
    if (!relativePath) {
      continue;
    }

    const runStats = run.stats || {};
    addToMapCount(fileStats, relativePath, {
      total:
        runStats.tests ??
        (runStats.passes || 0) + (runStats.failures || 0) + (runStats.pending || 0),
      pass: runStats.passes || 0,
      fail: runStats.failures || 0,
      skipped: runStats.pending || 0,
    });
  }

  return { summary, fileStats };
}

function parseCoverage(coverageSummary) {
  if (!coverageSummary || !coverageSummary.total) {
    return { total: null, modules: [] };
  }

  const total = {
    lines: coverageSummary.total.lines?.pct ?? null,
    branches: coverageSummary.total.branches?.pct ?? null,
    functions: coverageSummary.total.functions?.pct ?? null,
    statements: coverageSummary.total.statements?.pct ?? null,
  };

  const modules = Object.entries(coverageSummary)
    .filter(([key]) => key !== 'total')
    .map(([filePath, metrics]) => {
      const relativePath = resolveProjectPath(filePath, 'jest_unit');
      return {
        module: relativePath || toPosix(filePath),
        lines: metrics.lines?.pct ?? null,
        branches: metrics.branches?.pct ?? null,
        functions: metrics.functions?.pct ?? null,
        statements: metrics.statements?.pct ?? null,
      };
    })
    .sort((a, b) => (a.lines ?? 0) - (b.lines ?? 0));

  return { total, modules };
}

function collectTestInventory() {
  const roots = [
    path.join(ROOT, 'backend/src'),
    path.join(ROOT, 'backend/test'),
    path.join(ROOT, 'e2e/tests'),
    path.join(ROOT, 'frontend/cypress/e2e'),
  ];

  const records = [];
  const seen = new Set();

  for (const rootPath of roots) {
    const files = walkFiles(rootPath);
    for (const absolutePath of files) {
      const relativePath = toPosix(path.relative(ROOT, absolutePath));
      const framework = classifyTestFile(relativePath);
      if (!framework) {
        continue;
      }

      const dedupeKey = `${framework}|${relativePath}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      records.push({
        file: relativePath,
        framework,
        framework_family: frameworkFamily(framework),
        feature: detectFeature(relativePath),
        total: null,
        pass: null,
        fail: null,
        skipped: null,
        status: 'not_run',
      });
    }
  }

  return records.sort((a, b) => a.file.localeCompare(b.file));
}

function sortFeatureNames(featureA, featureB) {
  if (featureA === 'Core/Infra') {
    return 1;
  }
  if (featureB === 'Core/Infra') {
    return -1;
  }

  const aMatch = featureA.match(/FS-(\d{2})/);
  const bMatch = featureB.match(/FS-(\d{2})/);
  if (aMatch && bMatch) {
    return Number(aMatch[1]) - Number(bMatch[1]);
  }

  return featureA.localeCompare(featureB);
}

function buildFeatureView(testFiles) {
  const featureAccumulator = new Map();

  for (const testFile of testFiles) {
    const feature = testFile.feature;
    if (!featureAccumulator.has(feature)) {
      featureAccumulator.set(feature, {
        jest_unit: { files: 0, executed: 0, pass: 0, fail: 0, skipped: 0 },
        jest_e2e: { files: 0, executed: 0, pass: 0, fail: 0, skipped: 0 },
        playwright: { files: 0, executed: 0, pass: 0, fail: 0, skipped: 0 },
        cypress: { files: 0, executed: 0, pass: 0, fail: 0, skipped: 0 },
      });
    }

    const family = testFile.framework_family;
    const target = featureAccumulator.get(feature)[family];
    target.files += 1;

    if (testFile.total != null) {
      target.executed += testFile.total;
      target.pass += testFile.pass || 0;
      target.fail += testFile.fail || 0;
      target.skipped += testFile.skipped || 0;
    }
  }

  const rows = [];
  for (const [feature, stats] of featureAccumulator.entries()) {
    rows.push({
      feature,
      frameworks: {
        jest_unit:
          stats.jest_unit.files === 0
            ? 'none'
            : summarizeStatus(stats.jest_unit.executed, stats.jest_unit.pass, stats.jest_unit.fail),
        jest_e2e:
          stats.jest_e2e.files === 0
            ? 'none'
            : summarizeStatus(stats.jest_e2e.executed, stats.jest_e2e.pass, stats.jest_e2e.fail),
        playwright:
          stats.playwright.files === 0
            ? 'none'
            : summarizeStatus(stats.playwright.executed, stats.playwright.pass, stats.playwright.fail),
        cypress:
          stats.cypress.files === 0
            ? 'none'
            : summarizeStatus(stats.cypress.executed, stats.cypress.pass, stats.cypress.fail),
      },
      totals: stats,
    });
  }

  return rows.sort((a, b) => sortFeatureNames(a.feature, b.feature));
}

function frameworkView(summary, fileCount, lastRun, label) {
  const total = summary ? summary.total : null;
  const pass = summary ? summary.pass : null;
  const fail = summary ? summary.fail : null;
  const skipped = summary ? summary.skipped : null;

  return {
    label,
    file_count: fileCount,
    total,
    pass,
    fail,
    skipped,
    pass_rate: total && pass != null ? Number(((pass / total) * 100).toFixed(1)) : null,
    status: summary ? 'ready' : 'not_run',
    last_run: lastRun,
  };
}

function applyExecutionToInventory(testFiles, reportData) {
  for (const testFile of testFiles) {
    if (testFile.framework === 'playwright_api' || testFile.framework === 'playwright_ui') {
      const key = `${testFile.framework}|${testFile.file}`;
      const stats = reportData.playwright.fileStats.get(key);
      if (stats) {
        testFile.total = stats.total;
        testFile.pass = stats.pass;
        testFile.fail = stats.fail;
        testFile.skipped = stats.skipped;
        testFile.status = summarizeStatus(stats.total, stats.pass, stats.fail);
      }
      continue;
    }

    const sourceMapByFramework = {
      jest_unit: reportData.jestUnit.fileStats,
      jest_e2e: reportData.jestE2e.fileStats,
      cypress: reportData.cypress.fileStats,
    };

    const sourceMap = sourceMapByFramework[testFile.framework];
    const stats = sourceMap?.get(testFile.file) || null;
    if (stats) {
      testFile.total = stats.total;
      testFile.pass = stats.pass;
      testFile.fail = stats.fail;
      testFile.skipped = stats.skipped;
      testFile.status = summarizeStatus(stats.total, stats.pass, stats.fail);
    }
  }
}

function main() {
  const jestUnitReport = readJsonLoose(INPUTS.jestUnitReport);
  const jestE2eReport = readJsonLoose(INPUTS.jestE2eReport);
  const jestCoverage = readJsonLoose(INPUTS.jestCoverage);
  const playwrightReport = readJsonLoose(INPUTS.playwrightReport);
  const cypressReport = readJsonLoose(INPUTS.cypressReport);

  const reportData = {
    jestUnit: parseJestReport(jestUnitReport, 'jest_unit'),
    jestE2e: parseJestReport(jestE2eReport, 'jest_e2e'),
    playwright: parsePlaywrightReport(playwrightReport),
    cypress: parseCypressReport(cypressReport),
  };

  const codeCoverage = parseCoverage(jestCoverage);
  const testFiles = collectTestInventory();
  applyExecutionToInventory(testFiles, reportData);

  const fileCountByFamily = {
    jest_unit: testFiles.filter((file) => file.framework === 'jest_unit').length,
    jest_e2e: testFiles.filter((file) => file.framework === 'jest_e2e').length,
    playwright_api: testFiles.filter((file) => file.framework === 'playwright_api').length,
    playwright_ui: testFiles.filter((file) => file.framework === 'playwright_ui').length,
    cypress: testFiles.filter((file) => file.framework === 'cypress').length,
  };

  const frameworks = {
    jest_unit: frameworkView(
      reportData.jestUnit.summary,
      fileCountByFamily.jest_unit,
      statMtime(INPUTS.jestUnitReport),
      'Jest unit',
    ),
    jest_e2e: frameworkView(
      reportData.jestE2e.summary,
      fileCountByFamily.jest_e2e,
      statMtime(INPUTS.jestE2eReport),
      'Jest e2e',
    ),
    playwright_api: frameworkView(
      reportData.playwright.summaries.playwright_api,
      fileCountByFamily.playwright_api,
      statMtime(INPUTS.playwrightReport),
      'Playwright API',
    ),
    playwright_ui: frameworkView(
      reportData.playwright.summaries.playwright_ui,
      fileCountByFamily.playwright_ui,
      statMtime(INPUTS.playwrightReport),
      'Playwright UI',
    ),
    cypress: frameworkView(
      reportData.cypress.summary,
      fileCountByFamily.cypress,
      statMtime(INPUTS.cypressReport),
      'Cypress',
    ),
  };

  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;
  let totalSkipped = 0;
  for (const frameworkId of FRAMEWORK_ORDER) {
    const framework = frameworks[frameworkId];
    if (framework.total == null) {
      continue;
    }
    totalTests += framework.total;
    totalPass += framework.pass || 0;
    totalFail += framework.fail || 0;
    totalSkipped += framework.skipped || 0;
  }

  const output = {
    generated_at: new Date().toISOString(),
    sources: {
      jest_unit_report: {
        path: toPosix(path.relative(ROOT, INPUTS.jestUnitReport)),
        found: exists(INPUTS.jestUnitReport),
      },
      jest_e2e_report: {
        path: toPosix(path.relative(ROOT, INPUTS.jestE2eReport)),
        found: exists(INPUTS.jestE2eReport),
      },
      jest_coverage_summary: {
        path: toPosix(path.relative(ROOT, INPUTS.jestCoverage)),
        found: exists(INPUTS.jestCoverage),
      },
      playwright_report: {
        path: toPosix(path.relative(ROOT, INPUTS.playwrightReport)),
        found: exists(INPUTS.playwrightReport),
      },
      cypress_report: {
        path: toPosix(path.relative(ROOT, INPUTS.cypressReport)),
        found: exists(INPUTS.cypressReport),
      },
    },
    frameworks,
    code_coverage: codeCoverage,
    features: buildFeatureView(testFiles),
    test_files: testFiles,
    totals: {
      tests: totalTests,
      pass: totalPass,
      fail: totalFail,
      skipped: totalSkipped,
      pass_rate: totalTests > 0 ? Number(((totalPass / totalTests) * 100).toFixed(1)) : null,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `coverage-data generated: ${toPosix(path.relative(ROOT, OUTPUT_FILE))}\n`,
  );
}

main();
