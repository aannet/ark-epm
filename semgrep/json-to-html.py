#!/usr/bin/env python3
"""
Convert Semgrep JSON output to HTML report.
Usage: python json-to-html.py <input.json> <output.html> [target_name]
"""

import json
import sys
from datetime import datetime
from html import escape


def count_by_severity(results):
    """Count findings by severity level."""
    counts = {"ERROR": 0, "WARNING": 0, "INFO": 0, "UNKNOWN": 0}
    for r in results:
        severity = r.get("extra", {}).get("severity", "UNKNOWN")
        if severity in counts:
            counts[severity] += 1
        else:
            counts["UNKNOWN"] += 1
    return counts


def severity_color(severity):
    """Return CSS color class and hex color for severity."""
    colors = {
        "ERROR": ("severity-error", "#e40000", "#ffe6e6"),
        "WARNING": ("severity-warning", "#ff8800", "#fff3e6"),
        "INFO": ("severity-info", "#3498db", "#ebf5fb"),
        "UNKNOWN": ("severity-unknown", "#747474", "#f0f0f0"),
    }
    return colors.get(severity, colors["UNKNOWN"])


def generate_html(input_file, output_file, target_name="Project"):
    """Generate HTML report from Semgrep JSON output."""
    
    # Load JSON results
    with open(input_file, "r") as f:
        data = json.load(f)
    
    results = data.get("results", [])
    counts = count_by_severity(results)
    total = len(results)
    
    # HTML template
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Semgrep Report — {escape(target_name)}</title>
    <style>
        * {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            box-sizing: border-box;
        }}
        body {{
            margin: 0;
            padding: 20px;
            background-color: #f5f6f7;
            color: #333;
        }}
        h1 {{
            text-align: center;
            color: #2c3e50;
            margin-bottom: 10px;
        }}
        .meta {{
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
        }}
        .summary {{
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }}
        .summary-card {{
            background: white;
            border-radius: 8px;
            padding: 20px 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 120px;
        }}
        .summary-card.error {{
            border-top: 4px solid #e40000;
        }}
        .summary-card.warning {{
            border-top: 4px solid #ff8800;
        }}
        .summary-card.info {{
            border-top: 4px solid #3498db;
        }}
        .summary-count {{
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }}
        .summary-label {{
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }}
        .total {{
            text-align: center;
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }}
        .total strong {{
            font-size: 24px;
            color: #2c3e50;
        }}
        table {{
            width: 100%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-collapse: collapse;
            margin-top: 20px;
        }}
        th {{
            background-color: #2c3e50;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 12px 15px;
            border-bottom: 1px solid #e1e4e8;
        }}
        tr:hover {{
            background-color: #f8f9fa;
        }}
        .severity-error {{ background-color: #ffe6e6; }}
        .severity-error .severity-badge {{ background-color: #e40000; }}
        .severity-warning {{ background-color: #fff3e6; }}
        .severity-warning .severity-badge {{ background-color: #ff8800; }}
        .severity-info {{ background-color: #ebf5fb; }}
        .severity-info .severity-badge {{ background-color: #3498db; }}
        .severity-unknown {{ background-color: #f0f0f0; }}
        .severity-unknown .severity-badge {{ background-color: #747474; }}
        .severity-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .file-path {{
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 13px;
            color: #0366d6;
        }}
        .rule-id {{
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            background: #f1f2f3;
            padding: 2px 6px;
            border-radius: 3px;
        }}
        .code-snippet {{
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            background: #f6f8fa;
            padding: 8px 12px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
            max-width: 400px;
            color: #24292e;
        }}
        .message {{
            max-width: 300px;
            line-height: 1.4;
        }}
        .no-findings {{
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .no-findings h2 {{
            color: #28a745;
            margin-bottom: 10px;
        }}
        .no-findings p {{
            color: #666;
        }}
    </style>
</head>
<body>
    <h1>🔒 Semgrep Security Report</h1>
    <p class="meta">Target: <strong>{escape(target_name)}</strong> | Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    
    {generate_summary_html(counts, total)}
    
    {generate_findings_table(results) if results else generate_no_findings_html()}
</body>
</html>"""
    
    # Write output
    with open(output_file, "w") as f:
        f.write(html)
    
    print(f"✅ HTML report generated: {output_file} ({total} findings)")


def generate_summary_html(counts, total):
    """Generate summary cards HTML."""
    cards = []
    for sev, label, card_class in [("ERROR", "Critical", "error"), ("WARNING", "Warnings", "warning"), ("INFO", "Info", "info")]:
        count = counts.get(sev, 0)
        cards.append(f'''
        <div class="summary-card {card_class}">
            <div class="summary-count">{count}</div>
            <div class="summary-label">{label}</div>
        </div>''')
    
    return f'''
    <div class="summary">
        {''.join(cards)}
    </div>
    <p class="total">Total findings: <strong>{total}</strong></p>'''


def generate_findings_table(results):
    """Generate findings table HTML."""
    rows = []
    for r in results:
        severity = r.get("extra", {}).get("severity", "UNKNOWN")
        css_class, color, bg = severity_color(severity)
        
        row = f"""<tr class="{css_class}">
            <td><span class="severity-badge">{escape(severity)}</span></td>
            <td class="file-path">{escape(r.get("path", ""))}:{r.get("start", {}).get("line", "")}</td>
            <td class="rule-id">{escape(r.get("check_id", ""))}</td>
            <td class="message">{escape(r.get("extra", {}).get("message", ""))}</td>
            <td><div class="code-snippet">{escape(r.get("extra", {}).get("lines", "").strip()[:200])}</div></td>
        </tr>"""
        rows.append(row)
    
    return f"""<table>
        <thead>
            <tr>
                <th>Severity</th>
                <th>Location</th>
                <th>Rule</th>
                <th>Message</th>
                <th>Code</th>
            </tr>
        </thead>
        <tbody>
            {''.join(rows)}
        </tbody>
    </table>"""


def generate_no_findings_html():
    """Generate 'no findings' message."""
    return '''<div class="no-findings">
        <h2>✅ No Security Findings</h2>
        <p>Semgrep scan completed successfully with no issues detected.</p>
    </div>'''


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python json-to-html.py <input.json> <output.html> [target_name]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    target_name = sys.argv[3] if len(sys.argv) > 3 else "Project"
    
    try:
        generate_html(input_file, output_file, target_name)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
