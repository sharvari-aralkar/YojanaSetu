import sqlite3
import json
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "yojanasetu.db")
SCHEMES_PATH = os.path.join(BASE_DIR, "schemes.json")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schemes (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                state TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                eligibility TEXT NOT NULL,
                documents TEXT,
                official_url TEXT,
                is_demo INTEGER DEFAULT 1
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS barrier_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scheme_id INTEGER,
                barrier_type TEXT NOT NULL,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (scheme_id) REFERENCES schemes(id)
            )
        """)

        with open(SCHEMES_PATH, "r", encoding="utf-8") as file:
            schemes = json.load(file)

        for scheme in schemes:
            cursor.execute("""
                INSERT OR REPLACE INTO schemes
                (
                    id,
                    name,
                    state,
                    category,
                    description,
                    eligibility,
                    documents,
                    official_url,
                    is_demo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scheme["id"],
                scheme["name"],
                scheme["state"],
                scheme["category"],
                scheme["description"],
                json.dumps(scheme["eligibility"]),
                json.dumps(scheme["documents"]),
                scheme["official_url"],
                int(scheme.get("is_demo", True))
            ))


def get_all_schemes():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM schemes
            ORDER BY id
        """)

        rows = cursor.fetchall()

    schemes = []

    for row in rows:
        schemes.append({
            "id": row["id"],
            "name": row["name"],
            "state": row["state"],
            "category": row["category"],
            "description": row["description"],
            "eligibility": json.loads(row["eligibility"]),
            "documents": json.loads(row["documents"]),
            "official_url": row["official_url"],
            "is_demo": bool(row["is_demo"])
        })

    return schemes


def save_barrier_report(scheme_id, barrier_type, description=""):
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO barrier_reports
            (
                scheme_id,
                barrier_type,
                description
            )
            VALUES (?, ?, ?)
        """, (
            scheme_id,
            barrier_type,
            description
        ))

        return cursor.lastrowid


def get_all_barrier_reports():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                barrier_reports.id,
                barrier_reports.scheme_id,
                schemes.name AS scheme_name,
                barrier_reports.barrier_type,
                barrier_reports.description,
                barrier_reports.created_at
            FROM barrier_reports
            LEFT JOIN schemes
                ON barrier_reports.scheme_id = schemes.id
            ORDER BY barrier_reports.created_at DESC
        """)

        rows = cursor.fetchall()

    reports = []

    for row in rows:
        reports.append({
            "id": row["id"],
            "scheme_id": row["scheme_id"],
            "scheme_name": row["scheme_name"],
            "barrier_type": row["barrier_type"],
            "description": row["description"],
            "created_at": row["created_at"]
        })

    return reports


def get_barrier_summary():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                barrier_type,
                COUNT(*) AS report_count
            FROM barrier_reports
            GROUP BY barrier_type
            ORDER BY report_count DESC
        """)

        rows = cursor.fetchall()

    return [
        {
            "barrier_type": row["barrier_type"],
            "report_count": row["report_count"]
        }
        for row in rows
    ]


def get_scheme_barrier_summary():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                schemes.id AS scheme_id,
                schemes.name AS scheme_name,
                barrier_reports.barrier_type,
                COUNT(*) AS report_count
            FROM barrier_reports
            LEFT JOIN schemes
                ON barrier_reports.scheme_id = schemes.id
            WHERE barrier_reports.scheme_id IS NOT NULL
            GROUP BY
                schemes.id,
                schemes.name,
                barrier_reports.barrier_type
            ORDER BY
                schemes.name,
                report_count DESC
        """)

        rows = cursor.fetchall()

    scheme_data = {}

    for row in rows:
        scheme_id = row["scheme_id"]

        if scheme_id not in scheme_data:
            scheme_data[scheme_id] = {
                "scheme_id": scheme_id,
                "scheme_name": row["scheme_name"],
                "total_reports": 0,
                "barriers": []
            }

        scheme_data[scheme_id]["barriers"].append({
            "barrier_type": row["barrier_type"],
            "report_count": row["report_count"]
        })

        scheme_data[scheme_id]["total_reports"] += row["report_count"]

    return list(scheme_data.values())