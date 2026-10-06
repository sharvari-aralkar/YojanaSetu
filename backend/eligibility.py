
def check_eligibility(user, scheme):
    rules = scheme.get("eligibility", {})
    reasons = []
    missing = []

    # Check age
    age = user.get("age")
    min_age = rules.get("min_age")
    max_age = rules.get("max_age")

    if age is None:
        if min_age is not None or max_age is not None:
            missing.append("Age")
    elif min_age is not None and age < min_age:
        reasons.append("Age is below the scheme requirement.")
    elif max_age is not None and age > max_age:
        reasons.append("Age is above the scheme requirement.")

    # Check state
    state = user.get("state")
    required_state = rules.get("state")

    if not state:
        if required_state:
            missing.append("State")
    elif required_state and state.strip().lower() != required_state.strip().lower():
        reasons.append("State does not match the scheme requirements.")

    # Check annual income
    income = user.get("annual_income")
    max_income = rules.get("max_annual_income")

    if income is None:
        if max_income is not None:
            missing.append("Annual income")
    elif max_income is not None and income > max_income:
        reasons.append("Annual income is above the scheme limit.")

    # Check occupation
    occupation = user.get("occupation")
    required_occupation = rules.get("occupation")

    if not occupation:
        if required_occupation:
            missing.append("Occupation")
    elif required_occupation and occupation.strip().lower() != required_occupation.strip().lower():
        reasons.append("Occupation does not match the scheme requirements.")

    # Check category
    category = user.get("category")
    required_category = rules.get("category")

    if not category:
        if required_category:
            missing.append("Category")
    elif required_category and category.strip().lower() != required_category.strip().lower():
        reasons.append("Category does not match the scheme requirements.")

    # Check education level
    education = user.get("education_level")
    required_education = rules.get("education_level")

    if not education:
        if required_education:
            missing.append("Education level")
    elif required_education and education.strip().lower() != required_education.strip().lower():
        reasons.append("Education level does not match the scheme requirements.")

    # Determine result
    if reasons:
        status = "not_matching"
    elif missing:
        status = "needs_information"
    else:
        status = "potential_match"

    return {
        "scheme_name": scheme.get("name", "Unnamed scheme"),
        "status": status,
        "reasons": reasons,
        "missing_information": missing,
        "documents": scheme.get("documents", []),
        "is_demo": scheme.get("is_demo", True)
    }


def recommend_schemes(user, schemes):
    results = []

    for scheme in schemes:
        result = check_eligibility(user, scheme)
        results.append(result)

    return results