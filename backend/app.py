from flask import Flask, jsonify, request
from flask_cors import CORS

from database import (
    initialize_database,
    get_all_schemes,
    save_barrier_report,
    get_all_barrier_reports,
    get_barrier_summary,
    get_scheme_barrier_summary
)

from eligibility import recommend_schemes


app = Flask(__name__)
CORS(app)

initialize_database()


# ---------------------------------------------------------
# CONSTANTS
# ---------------------------------------------------------

ALLOWED_STATES = [
    "Maharashtra"
]

ALLOWED_CATEGORIES = [
    "sc",
    "st",
    "obc",
    "general",
    "vjnt",
    "sbc"
]

ALLOWED_EDUCATION_LEVELS = [
    "school",
    "post-secondary",
    "graduate",
    "postgraduate",
    "other"
]

ALLOWED_BARRIER_TYPES = [
    "documentation",
    "awareness",
    "digital_access",
    "application_process",
    "financial",
    "eligibility_confusion",
    "other"
]


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def clean_text(value):
    """
    Convert a value to cleaned text.
    Return None for empty values.
    """
    if value is None:
        return None

    if not isinstance(value, str):
        return None

    value = value.strip()

    if value == "":
        return None

    return value


def validate_age(value):
    """
    Validate age.
    """
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return "Age must be a whole number."

    try:
        age = int(value)
    except (ValueError, TypeError):
        return "Age must be a whole number."

    if age < 0 or age > 120:
        return "Age must be between 0 and 120."

    return age


def validate_income(value):
    """
    Validate annual income.
    """
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return "Annual income must be a number."

    try:
        income = float(value)
    except (ValueError, TypeError):
        return "Annual income must be a number."

    if income < 0:
        return "Annual income cannot be negative."

    if income > 100000000:
        return "Please enter a realistic annual income."

    return income


# ---------------------------------------------------------
# HOME
# ---------------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "YojanaSetu API is running!",
        "status": "success"
    })


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "YojanaSetu API"
    })


# ---------------------------------------------------------
# GET ALL SCHEMES
# ---------------------------------------------------------

@app.route("/schemes", methods=["GET"])
def get_schemes():
    try:
        schemes = get_all_schemes()

        return jsonify(schemes), 200

    except Exception as error:
        print("Scheme loading error:", error)

        return jsonify({
            "error": "Unable to load schemes."
        }), 500


# ---------------------------------------------------------
# RECOMMEND SCHEMES
# ---------------------------------------------------------

@app.route("/recommend", methods=["POST"])
def recommend():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Please send valid JSON data."
        }), 400

    # -----------------------------------------------------
    # AGE
    # -----------------------------------------------------

    age_result = validate_age(data.get("age"))

    if isinstance(age_result, str):
        return jsonify({
            "error": age_result
        }), 400

    age = age_result

    # -----------------------------------------------------
    # INCOME
    # -----------------------------------------------------

    income_result = validate_income(
        data.get("annual_income")
    )

    if isinstance(income_result, str):
        return jsonify({
            "error": income_result
        }), 400

    income = income_result

    # -----------------------------------------------------
    # TEXT FIELDS
    # -----------------------------------------------------

    state = clean_text(data.get("state"))
    occupation = clean_text(data.get("occupation"))
    category = clean_text(data.get("category"))
    education_level = clean_text(
        data.get("education_level")
    )

    # -----------------------------------------------------
    # STATE VALIDATION
    # -----------------------------------------------------

    if state is not None:

        if state not in ALLOWED_STATES:
            return jsonify({
                "error": (
                    "Currently YojanaSetu supports "
                    "Maharashtra pilot data."
                )
            }), 400

    # -----------------------------------------------------
    # CATEGORY VALIDATION
    # -----------------------------------------------------

    if category is not None:

        category = category.lower()

        if category not in ALLOWED_CATEGORIES:
            return jsonify({
                "error": "Invalid category selected."
            }), 400

    # -----------------------------------------------------
    # EDUCATION VALIDATION
    # -----------------------------------------------------

    if education_level is not None:

        education_level = education_level.lower()

        if education_level not in ALLOWED_EDUCATION_LEVELS:
            return jsonify({
                "error": "Invalid education level selected."
            }), 400

    # -----------------------------------------------------
    # OCCUPATION VALIDATION
    # -----------------------------------------------------

    if occupation is not None:

        if len(occupation) > 100:
            return jsonify({
                "error": "Occupation is too long."
            }), 400

    # -----------------------------------------------------
    # CREATE USER PROFILE
    # -----------------------------------------------------

    user = {
        "age": age,
        "state": state,
        "annual_income": income,
        "occupation": occupation,
        "category": category,
        "education_level": education_level
    }

    # -----------------------------------------------------
    # RUN ELIGIBILITY ENGINE
    # -----------------------------------------------------

    try:

        schemes = get_all_schemes()

        results = recommend_schemes(
            user,
            schemes
        )

    except Exception as error:

        print("Recommendation error:", error)

        return jsonify({
            "error": "Unable to complete scheme assessment."
        }), 500

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return jsonify({
        "message": "Scheme assessment completed.",
        "notice": (
            "These are prototype assessments and "
            "not official eligibility decisions."
        ),
        "profile": user,
        "results": results
    }), 200


# ---------------------------------------------------------
# CREATE BARRIER REPORT
# ---------------------------------------------------------

@app.route("/barrier-reports", methods=["POST"])
def create_barrier_report():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Please send valid JSON data."
        }), 400

    scheme_id = data.get("scheme_id")
    barrier_type = data.get("barrier_type")
    description = data.get("description", "")

    # -----------------------------------------------------
    # BARRIER TYPE
    # -----------------------------------------------------

    barrier_type = clean_text(barrier_type)

    if barrier_type is None:
        return jsonify({
            "error": "Barrier type is required."
        }), 400

    barrier_type = barrier_type.lower()

    if barrier_type not in ALLOWED_BARRIER_TYPES:
        return jsonify({
            "error": "Invalid barrier type."
        }), 400

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    if not isinstance(description, str):
        return jsonify({
            "error": "Description must be text."
        }), 400

    description = description.strip()

    if len(description) < 10:
        return jsonify({
            "error": (
                "Description must contain at least "
                "10 characters."
            )
        }), 400

    if len(description) > 1000:
        return jsonify({
            "error": "Description cannot exceed 1000 characters."
        }), 400

    # -----------------------------------------------------
    # SCHEME ID
    # -----------------------------------------------------

    if scheme_id is not None:

        try:

            if isinstance(scheme_id, bool):
                raise ValueError

            scheme_id = int(scheme_id)

        except (ValueError, TypeError):

            return jsonify({
                "error": "Invalid scheme ID."
            }), 400

        try:
            valid_ids = {
                scheme["id"]
                for scheme in get_all_schemes()
            }

        except Exception as error:

            print("Scheme lookup error:", error)

            return jsonify({
                "error": "Unable to validate scheme."
            }), 500

        if scheme_id not in valid_ids:
            return jsonify({
                "error": "Scheme not found."
            }), 404

    # -----------------------------------------------------
    # SAVE REPORT
    # -----------------------------------------------------

    try:

        report_id = save_barrier_report(
            scheme_id,
            barrier_type,
            description
        )

    except Exception as error:

        print("Barrier report error:", error)

        return jsonify({
            "error": "Unable to save barrier report."
        }), 500

    return jsonify({
        "message": "Barrier report submitted successfully.",
        "report_id": report_id
    }), 201


# ---------------------------------------------------------
# GET BARRIER REPORTS
# ---------------------------------------------------------

@app.route("/barrier-reports", methods=["GET"])
def list_barrier_reports():

    try:

        reports = get_all_barrier_reports()

        return jsonify({
            "reports": reports
        }), 200

    except Exception as error:

        print("Barrier report loading error:", error)

        return jsonify({
            "error": "Unable to load barrier reports."
        }), 500


# ---------------------------------------------------------
# BARRIER SUMMARY
# ---------------------------------------------------------

@app.route("/barrier-summary", methods=["GET"])
def barrier_summary():

    try:

        summary = get_barrier_summary()

        total_reports = sum(
            item["report_count"]
            for item in summary
        )

        return jsonify({
            "total_reports": total_reports,
            "barriers": summary
        }), 200

    except Exception as error:

        print("Barrier summary error:", error)

        return jsonify({
            "error": "Unable to load barrier summary."
        }), 500


# ---------------------------------------------------------
# SCHEME BARRIER SUMMARY
# ---------------------------------------------------------

@app.route("/scheme-barrier-summary", methods=["GET"])
def scheme_barrier_summary():

    try:

        summary = get_scheme_barrier_summary()

        return jsonify({
            "schemes": summary
        }), 200

    except Exception as error:

        print("Scheme barrier summary error:", error)

        return jsonify({
            "error": "Unable to load scheme barrier summary."
        }), 500


# ---------------------------------------------------------
# ACCESS GAP INSIGHTS
# ---------------------------------------------------------

@app.route("/access-insights", methods=["GET"])
def access_insights():

    try:
        barrier_summary_data = get_barrier_summary()
        scheme_summary_data = get_scheme_barrier_summary()

        # -----------------------------------------------
        # TOTAL REPORTS
        # -----------------------------------------------

        total_reports = sum(
            item.get("report_count", 0)
            for item in barrier_summary_data
        )

        # -----------------------------------------------
        # FIND MOST COMMON BARRIER
        # -----------------------------------------------

        most_common_barrier = None

        if barrier_summary_data:

            sorted_barriers = sorted(
                barrier_summary_data,
                key=lambda item: item.get(
                    "report_count", 0
                ),
                reverse=True
            )

            if sorted_barriers:
                most_common_barrier = sorted_barriers[0]

        # -----------------------------------------------
        # FIND MOST REPORTED SCHEME
        # -----------------------------------------------

        most_reported_scheme = None

        if scheme_summary_data:

            sorted_schemes = sorted(
                scheme_summary_data,
                key=lambda item: item.get(
                    "report_count", 0
                ),
                reverse=True
            )

            if sorted_schemes:

                top_scheme = sorted_schemes[0]

                if top_scheme.get("report_count", 0) > 0:
                    most_reported_scheme = top_scheme

        # -----------------------------------------------
        # GENERATE INSIGHTS
        # -----------------------------------------------

        insights = []

        if total_reports == 0:

            insights.append({
                "type": "info",
                "title": "No barrier reports yet",
                "message": (
                    "No user-reported access barriers "
                    "have been recorded yet. Submit barrier "
                    "reports to identify recurring access gaps."
                )
            })

        else:

            if most_common_barrier:

                barrier_name = most_common_barrier.get(
                    "barrier_type",
                    "Unknown"
                )

                barrier_count = most_common_barrier.get(
                    "report_count",
                    0
                )

                insights.append({
                    "type": "barrier",
                    "title": "Most common access barrier",
                    "message": (
                        f"{barrier_name} is currently the "
                        f"most frequently reported barrier "
                        f"with {barrier_count} report(s)."
                    ),
                    "barrier_type": barrier_name,
                    "report_count": barrier_count
                })

            if most_reported_scheme:

                scheme_name = most_reported_scheme.get(
                    "scheme_name",
                    "Unknown scheme"
                )

                scheme_count = most_reported_scheme.get(
                    "report_count",
                    0
                )

                insights.append({
                    "type": "scheme",
                    "title": "Scheme needing attention",
                    "message": (
                        f"{scheme_name} has the highest "
                        f"number of reported access barriers "
                        f"with {scheme_count} report(s)."
                    ),
                    "scheme_name": scheme_name,
                    "report_count": scheme_count
                })

        # -----------------------------------------------
        # ACTION RECOMMENDATIONS
        # -----------------------------------------------

        recommendations = []

        barrier_names = {
            str(item.get("barrier_type", "")).lower()
            for item in barrier_summary_data
        }

        if "documentation" in barrier_names:
            recommendations.append(
                "Provide a clearer document checklist "
                "and explain where each document can be obtained."
            )

        if "awareness" in barrier_names:
            recommendations.append(
                "Improve scheme awareness through simple "
                "eligibility and benefit explanations."
            )

        if "digital_access" in barrier_names:
            recommendations.append(
                "Provide simpler digital application guidance "
                "and assisted access options."
            )

        if "application_process" in barrier_names:
            recommendations.append(
                "Simplify application instructions and "
                "explain the process step by step."
            )

        if "financial" in barrier_names:
            recommendations.append(
                "Highlight financial requirements and "
                "benefit details more clearly."
            )

        if "eligibility_confusion" in barrier_names:
            recommendations.append(
                "Explain eligibility conditions using "
                "plain-language examples."
            )

        if not recommendations:

            recommendations.append(
                "Continue collecting barrier reports to "
                "identify recurring access problems."
            )

        # -----------------------------------------------
        # ACCESS GAP LEVEL
        # -----------------------------------------------

        if total_reports == 0:
            access_gap_level = "No data"

        elif total_reports <= 2:
            access_gap_level = "Low"

        elif total_reports <= 5:
            access_gap_level = "Moderate"

        else:
            access_gap_level = "High"

        # -----------------------------------------------
        # RESPONSE
        # -----------------------------------------------

        return jsonify({
            "status": "success",
            "total_reports": total_reports,
            "access_gap_level": access_gap_level,
            "most_common_barrier": most_common_barrier,
            "most_reported_scheme": most_reported_scheme,
            "insights": insights,
            "recommendations": recommendations
        }), 200

    except Exception as error:

        print("Access insights error:", error)

        return jsonify({
            "error": "Unable to generate access insights."
        }), 500


# ---------------------------------------------------------
# 404 ERROR
# ---------------------------------------------------------

@app.errorhandler(404)
def page_not_found(error):

    return jsonify({
        "error": "API endpoint not found."
    }), 404


# ---------------------------------------------------------
# 500 ERROR
# ---------------------------------------------------------

@app.errorhandler(500)
def internal_server_error(error):

    return jsonify({
        "error": "Internal server error."
    }), 500


# ---------------------------------------------------------
# RUN SERVER
# ---------------------------------------------------------

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )