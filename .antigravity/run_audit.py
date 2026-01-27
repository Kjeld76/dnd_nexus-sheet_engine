import sqlite3
import csv
import os

DB_PATH = "src-tauri/dnd-nexus.db"
INPUT_CSV = ".antigravity/suspicious_columns.csv"
OUTPUT_REPORT = ".antigravity/normalization_audit_report.md"

def analyze_columns():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    findings = []

    print(f"Reading columns from {INPUT_CSV}...")
    with open(INPUT_CSV, 'r') as f:
        reader = csv.reader(f, delimiter='|')
        columns_to_check = list(reader)

    print(f"Analyzing {len(columns_to_check)} columns...")
    
    for i, (table, column, dtype) in enumerate(columns_to_check):
        if i % 50 == 0:
            print(f"Processed {i}/{len(columns_to_check)}...")
            
        try:
            # Check for JSON ({...} or [...]) and Multi-value (contains comma)
            # We filter out very short strings to avoid false positives on simple text
            query = f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN "{column}" LIKE '{{%' OR "{column}" LIKE '[%' THEN 1 ELSE 0 END) as json_count,
                    SUM(CASE WHEN "{column}" LIKE '%,%' AND length("{column}") > 2 THEN 1 ELSE 0 END) as csv_count
                FROM "{table}"
                WHERE "{column}" IS NOT NULL AND "{column}" != ''
            """
            cursor.execute(query)
            result = cursor.fetchone()
            
            if result:
                total, json_cnt, csv_cnt = result
                json_cnt = json_cnt or 0
                csv_cnt = csv_cnt or 0
                
                if json_cnt > 0 or csv_cnt > 0:
                    findings.append({
                        "table": table,
                        "column": column,
                        "type": dtype,
                        "total_rows": total,
                        "json_rows": json_cnt,
                        "csv_rows": csv_cnt
                    })

        except sqlite3.OperationalError as e:
            # print(f"Error querying {table}.{column}: {e}")
            pass

    conn.close()
    
    # Generate Report
    generate_report(findings)
    print(f"Analysis complete. Found {len(findings)} violations.")

def generate_report(findings):
    with open(OUTPUT_REPORT, 'w') as f:
        f.write("# Database Normalization Audit Report\n")
        f.write("Date: 2026-01-26\n\n")
        
        f.write("## Executive Summary\n")
        f.write(f"- Columns Analyzed: {len(findings)} (violations found)\n")
        f.write("- Recommendation: IMPACT ANALYSIS REQUIRED\n\n")
        
        f.write("## Detailed Violations\n\n")
        f.write("| Table | Column | Type | Total Rows | JSON Rows | CSV/List Rows | Priority |\n")
        f.write("|-------|--------|------|------------|-----------|---------------|----------|\n")
        
        for item in findings:
            priority = "HIGH" if item['json_rows'] > 0 else "MEDIUM"
            f.write(f"| {item['table']} | {item['column']} | {item['type']} | {item['total_rows']} | {item['json_rows']} | {item['csv_rows']} | {priority} |\n")

if __name__ == "__main__":
    analyze_columns()
