import { useEffect, useState } from "react";
import "./App.css";


const API =
  import.meta.env.VITE_API_URL || "/api";

const RECOMMEND_API_URL = `${API}/recommend`;
const SCHEMES_API_URL = `${API}/schemes`;
const BARRIER_API_URL = `${API}/barrier-reports`;
const BARRIER_SUMMARY_API_URL = `${API}/barrier-summary`;
const SCHEME_BARRIER_SUMMARY_API_URL =
  `${API}/scheme-barrier-summary`;
const ACCESS_INSIGHTS_API_URL =
  `${API}/access-insights`;


function App() {

  // =====================================================
  // SCHEME FINDER
  // =====================================================

  const [formData, setFormData] = useState({
    age: "",
    state: "Maharashtra",
    annual_income: "",
    occupation: "",
    category: "",
    education_level: ""
  });

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [recommendationError, setRecommendationError] =
    useState("");


  // =====================================================
  // SCHEMES
  // =====================================================

  const [schemes, setSchemes] = useState([]);

  const [schemesLoading, setSchemesLoading] =
    useState(false);


  // =====================================================
  // BARRIER REPORT
  // =====================================================

  const [barrierForm, setBarrierForm] = useState({
    scheme_id: "",
    barrier_type: "",
    description: ""
  });

  const [barrierSubmitting, setBarrierSubmitting] =
    useState(false);

  const [barrierMessage, setBarrierMessage] =
    useState("");

  const [barrierError, setBarrierError] =
    useState("");


  // =====================================================
  // OVERALL DASHBOARD
  // =====================================================

  const [barrierSummary, setBarrierSummary] =
    useState([]);

  const [totalReports, setTotalReports] =
    useState(0);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [dashboardError, setDashboardError] =
    useState("");


  // =====================================================
  // SCHEME DASHBOARD
  // =====================================================

  const [schemeBarrierSummary, setSchemeBarrierSummary] =
    useState([]);

  const [schemeDashboardLoading, setSchemeDashboardLoading] =
    useState(false);

  const [schemeDashboardError, setSchemeDashboardError] =
    useState("");


  // =====================================================
  // ACCESS INSIGHTS
  // =====================================================

  const [accessInsights, setAccessInsights] =
    useState([]);

  const [insightsLoading, setInsightsLoading] =
    useState(false);

  const [insightsError, setInsightsError] =
    useState("");


  // =====================================================
  // FETCH SCHEMES
  // =====================================================

  const fetchSchemes = async () => {

    try {

      setSchemesLoading(true);

      const response =
        await fetch(SCHEMES_API_URL);

      if (!response.ok) {
        throw new Error(
          "Failed to load schemes."
        );
      }

      const data =
        await response.json();

      setSchemes(data);

    } catch (error) {

      console.error(error);

    } finally {

      setSchemesLoading(false);

    }
  };


  // =====================================================
  // FETCH OVERALL BARRIER SUMMARY
  // =====================================================

  const fetchBarrierSummary = async () => {

    try {

      setDashboardLoading(true);

      setDashboardError("");

      const response =
        await fetch(BARRIER_SUMMARY_API_URL);

      if (!response.ok) {

        throw new Error(
          "Failed to load barrier summary."
        );

      }

      const data =
        await response.json();

      setTotalReports(
        data.total_reports || 0
      );

      setBarrierSummary(
        data.barriers || []
      );

    } catch (error) {

      setDashboardError(
        error.message
      );

    } finally {

      setDashboardLoading(false);

    }
  };


  // =====================================================
  // FETCH SCHEME BARRIER SUMMARY
  // =====================================================

  const fetchSchemeBarrierSummary =
    async () => {

      try {

        setSchemeDashboardLoading(true);

        setSchemeDashboardError("");

        const response =
          await fetch(
            SCHEME_BARRIER_SUMMARY_API_URL
          );

        if (!response.ok) {

          throw new Error(
            "Failed to load scheme-level barrier data."
          );

        }

        const data =
          await response.json();

        setSchemeBarrierSummary(
          data.schemes || []
        );

      } catch (error) {

        setSchemeDashboardError(
          error.message
        );

      } finally {

        setSchemeDashboardLoading(false);

      }
    };


  // =====================================================
  // FETCH AI INSIGHTS
  // =====================================================

  const fetchAccessInsights =
    async () => {

      try {

        setInsightsLoading(true);

        setInsightsError("");

        const response =
          await fetch(
            ACCESS_INSIGHTS_API_URL
          );

        if (!response.ok) {

          throw new Error(
            "Failed to load access insights."
          );

        }

        const data =
          await response.json();

        const rawInsights = data.insights || [];

        const normalizedInsights = rawInsights.map(
          (item, index) => {
            const reportCount = Number(
              item.report_count || 0
            );

            let severity = "Low";

            if (reportCount >= 5) {
              severity = "High";
            } else if (reportCount >= 3) {
              severity = "Medium";
            }

            let action =
              "Continue collecting barrier reports to identify recurring access problems.";

            if (item.type === "barrier") {
              action =
                "Review this barrier category and improve guidance or support around the affected access step.";
            } else if (item.type === "scheme") {
              action =
                "Investigate this scheme further and review the reported access barriers.";
            }

            return {
              id: `${item.type || "insight"}-${index}`,
              scheme_id: item.scheme_name || `insight-${index}`,
              scheme_name:
                item.scheme_name || "YojanaSetu Access Signal",
              headline:
                item.title || "Access insight",
              insight:
                item.message || "No additional insight available.",
              action,
              severity,
              confidence:
                reportCount > 0
                  ? `${Math.min(95, 60 + reportCount * 7)}%`
                  : "Prototype signal"
            };
          }
        );

        setAccessInsights(
          normalizedInsights
        );

      } catch (error) {

        setInsightsError(
          error.message
        );

      } finally {

        setInsightsLoading(false);

      }
    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchSchemes();

    fetchBarrierSummary();

    fetchSchemeBarrierSummary();

    fetchAccessInsights();

  }, []);


  // =====================================================
  // HANDLE FINDER INPUT
  // =====================================================

  const handleInputChange = (event) => {

    const {
      name,
      value
    } = event.target;

    setFormData(
      previous => ({
        ...previous,
        [name]: value
      })
    );
  };


  // =====================================================
  // RECOMMEND SCHEMES
  // =====================================================

  const handleFindSchemes =
    async (event) => {

      event.preventDefault();

      setLoading(true);

      setRecommendationError("");

      setResults([]);

      try {

        const payload = {

          age:
            formData.age
              ? Number(formData.age)
              : null,

          state:
            formData.state,

          annual_income:
            formData.annual_income
              ? Number(formData.annual_income)
              : null,

          occupation:
            formData.occupation || null,

          category:
            formData.category || null,

          education_level:
            formData.education_level || null
        };


        const response =
          await fetch(
            RECOMMEND_API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            "Unable to assess schemes."
          );

        }


        const returnedResults = Array.isArray(data.results)
          ? data.results
          : [];

        // Normalize the recommendation response so the UI can
        // display the real scheme name even when the backend
        // returns it as scheme_name or only returns scheme_id.
        const schemeLookup = new Map(
          schemes.map((item) => [
            String(item.id),
            item
          ])
        );

        const normalizedResults = returnedResults.map(
          (item, index) => {
            const lookup = schemeLookup.get(
              String(
                item.id ??
                item.scheme_id ??
                ""
              )
            );

            return {
              ...item,
              id:
                item.id ??
                item.scheme_id ??
                lookup?.id ??
                index + 1,
              name:
                item.name ??
                item.scheme_name ??
                item.scheme_title ??
                lookup?.name ??
                "Scheme name unavailable",
              department:
                item.department ??
                lookup?.department ??
                "",
              description:
                item.description ??
                lookup?.description ??
                "",
              benefit:
                item.benefit ??
                lookup?.benefit ??
                "",
              is_demo:
                item.is_demo ??
                lookup?.is_demo ??
                false
            };
          }
        );

        setResults(
          normalizedResults
        );


      } catch (error) {

        setRecommendationError(
          error.message
        );

      } finally {

        setLoading(false);

      }
    };


  // =====================================================
  // HANDLE BARRIER INPUT
  // =====================================================

  const handleBarrierChange =
    (event) => {

      const {
        name,
        value
      } = event.target;

      setBarrierForm(
        previous => ({
          ...previous,
          [name]: value
        })
      );
    };


  // =====================================================
  // SUBMIT BARRIER
  // =====================================================

  const handleBarrierSubmit =
    async (event) => {

      event.preventDefault();

      setBarrierSubmitting(true);

      setBarrierMessage("");

      setBarrierError("");


      try {

        const payload = {

          scheme_id:
            barrierForm.scheme_id
              ? Number(
                  barrierForm.scheme_id
                )
              : null,

          barrier_type:
            barrierForm.barrier_type,

          description:
            barrierForm.description

        };


        const response =
          await fetch(
            BARRIER_API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            "Failed to submit barrier report."
          );

        }


        setBarrierMessage(
          "Barrier report submitted successfully."
        );


        setBarrierForm({

          scheme_id: "",

          barrier_type: "",

          description: ""

        });


        await fetchBarrierSummary();

        await fetchSchemeBarrierSummary();

        await fetchAccessInsights();


      } catch (error) {

        setBarrierError(
          error.message
        );

      } finally {

        setBarrierSubmitting(false);

      }
    };


  // =====================================================
  // SEVERITY
  // =====================================================

  const getSeverity =
    (total) => {

      if (total >= 5) {
        return "High";
      }

      if (total >= 3) {
        return "Medium";
      }

      return "Low";
    };


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass =
    (status) => {

      if (
        status === "potential_match"
      ) {
        return "status-potential";
      }

      if (
        status === "needs_information"
      ) {
        return "status-information";
      }

      return "status-not-matching";
    };


  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel =
    (status) => {

      if (
        status === "potential_match"
      ) {
        return "Potential Match";
      }

      if (
        status === "needs_information"
      ) {
        return "Needs More Information";
      }

      return "Not Currently Matching";
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="app">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">

        <a
          href="#home"
          className="brand"
        >
          Yojana<span>Setu</span>
        </a>


        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#finder">
            Find Schemes
          </a>

          <a href="#gap">
            Access Gap
          </a>

          <a href="#report">
            Report Barrier
          </a>

          <a href="#about">
            About
          </a>

        </div>

      </nav>


      {/* =================================================
          HERO
      ================================================= */}

      <section
        id="home"
        className="hero"
      >

        <div className="hero-content">

          <p className="eyebrow">
            AI-POWERED WELFARE ACCESS
          </p>

          <h1>
            Find the support
            <br />
            you may be
            <em> missing.</em>
          </h1>

          <p className="hero-description">
            YojanaSetu helps people discover
            government welfare schemes they
            may potentially qualify for and
            identifies barriers that can prevent
            access.
          </p>


          <div className="hero-actions">

            <a
              href="#finder"
              className="primary-button"
            >
              Find My Schemes
              <span>↗</span>
            </a>

            <a
              href="#gap"
              className="secondary-button"
            >
              Explore Access Gaps
            </a>

          </div>


          <div className="hero-note">

            <span className="note-dot"></span>

            Pilot focus: Maharashtra

          </div>

        </div>


        <div className="hero-visual">

          <div className="hero-circle">

            <div className="circle-inner">

              <span>
                DISCOVER
              </span>

              <strong>
                •
              </strong>

              <span>
                UNDERSTAND
              </span>

              <strong>
                •
              </strong>

              <span>
                ACCESS
              </span>

            </div>

          </div>

          <div className="hero-floating-card">
            <span>01</span>
            <p>
              Eligibility
              <br />
              intelligence
            </p>
          </div>

        </div>

      </section>


      {/* =================================================
          FINDER
      ================================================= */}

      <section
        id="finder"
        className="section finder-section"
      >

        <div className="section-heading">

          <p className="eyebrow">
            SCHEME FINDER
          </p>

          <h2>
            Tell us a little
            <br />
            <em>about yourself.</em>
          </h2>

          <p>
            We use the information you provide
            to identify schemes that may be
            relevant to your situation.
          </p>

        </div>


        <form
          className="finder-card"
          onSubmit={handleFindSchemes}
        >

          <div className="form-grid">

            {/* AGE */}

            <div className="form-group">

              <label>
                Age
              </label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g. 21"
                min="0"
              />

            </div>


            {/* STATE */}

            <div className="form-group">

              <label>
                State
              </label>

              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >

                <option value="Maharashtra">
                  Maharashtra
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </div>


            {/* INCOME */}

            <div className="form-group">

              <label>
                Annual Income
              </label>

              <input
                type="number"
                name="annual_income"
                value={formData.annual_income}
                onChange={handleInputChange}
                placeholder="e.g. 250000"
                min="0"
              />

            </div>


            {/* OCCUPATION */}

            <div className="form-group">

              <label>
                Occupation
              </label>

              <select
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
              >

                <option value="">
                  Select occupation
                </option>

                <option value="student">
                  Student
                </option>

                <option value="farmer">
                  Farmer
                </option>

                <option value="worker">
                  Worker
                </option>

                <option value="self-employed">
                  Self-employed
                </option>

                <option value="unemployed">
                  Unemployed
                </option>

              </select>

            </div>


            {/* CATEGORY */}

            <div className="form-group">

              <label>
                Social Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >

                <option value="">
                  Select category
                </option>

                <option value="general">
                  General
                </option>

                <option value="sc">
                  SC
                </option>

                <option value="st">
                  ST
                </option>

                <option value="obc">
                  OBC
                </option>

              </select>

            </div>


            {/* EDUCATION */}

            <div className="form-group">

              <label>
                Education Level
              </label>

              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleInputChange}
              >

                <option value="">
                  Select education
                </option>

                <option value="school">
                  School
                </option>

                <option value="post-secondary">
                  Post-secondary
                </option>

                <option value="graduate">
                  Graduate
                </option>

                <option value="postgraduate">
                  Postgraduate
                </option>

              </select>

            </div>

          </div>


          <div className="finder-bottom">

            <p>
              Your information is used only
              for this demo assessment.
            </p>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >

              {loading
                ? "Assessing..."
                : "Assess My Eligibility"
              }

              <span>
                →
              </span>

            </button>

          </div>


          {recommendationError && (

            <div className="error-message">
              {recommendationError}
            </div>

          )}

        </form>


        {/* =================================================
            RESULTS
        ================================================= */}

        {results.length > 0 && (

          <div className="results-area">

            <div className="results-heading">

              <div>

                <p className="eyebrow">
                  ASSESSMENT RESULTS
                </p>

                <h3>
                  Schemes worth
                  <em> exploring.</em>
                </h3>

              </div>

              <span className="result-count">
                {results.length} found
              </span>

            </div>


            <div className="results-grid">

              {results.map(
                (scheme) => (

                  <article
                    className="result-card"
                    key={scheme.id}
                  >

                    <div className="result-card-top">

                      <span className="scheme-number">
                        {String(
                          scheme.id
                        ).padStart(2, "0")}
                      </span>

                      <span
                        className={
                          `status-badge ${
                            getStatusClass(
                              scheme.status
                            )
                          }`
                        }
                      >
                        {getStatusLabel(
                          scheme.status
                        )}
                      </span>

                    </div>


                    <div className="scheme-title-row">

  <div>

    <h4>
      {scheme.name}
    </h4>

    {scheme.department && (
      <p className="scheme-department">
        {scheme.department}
      </p>
    )}

  </div>

  <span
    className={
      `verification-badge ${
        scheme.is_demo
          ? "verification-demo"
          : "verification-verified"
      }`
    }
  >
    {scheme.is_demo
      ? "Demo"
      : "Verified Source"
    }
  </span>

</div>

<p>
  {scheme.description}
</p>


{scheme.benefit && (

  <div className="scheme-benefit">

    <span>
      BENEFIT
    </span>

    <p>
      {scheme.benefit}
    </p>

  </div>

)}


                    {scheme.reasons &&
                      scheme.reasons.length > 0 && (

                        <div className="result-detail">

                          <span>
                            WHY
                          </span>

                          <ul>

                            {scheme.reasons.map(
                              (reason, index) => (

                                <li
                                  key={index}
                                >
                                  {reason}
                                </li>

                              )
                            )}

                          </ul>

                        </div>

                      )}


                    {scheme.missing_information &&
                      scheme.missing_information.length > 0 && (

                        <div className="result-detail warning-detail">

                          <span>
                            STILL NEEDED
                          </span>

                          <ul>

                            {scheme.missing_information.map(
                              (item, index) => (

                                <li
                                  key={index}
                                >
                                  {item}
                                </li>

                              )
                            )}

                          </ul>

                        </div>

                      )}


                    {scheme.documents &&
                      scheme.documents.length > 0 && (

                        <div className="document-list">

                          <span>
                            DOCUMENTS
                          </span>

                          <div>

                            {scheme.documents.map(
                              (document, index) => (

                                <small
                                  key={index}
                                >
                                  {document}
                                </small>

                              )
                            )}

                          </div>

                        </div>

                      )}


                    <div className="result-footer">

  <span>
    {scheme.source_name ||
      "Official source"}
  </span>

  {scheme.official_url && (

    <a
      href={scheme.official_url}
      target="_blank"
      rel="noreferrer"
    >
      View source ↗
    </a>

  )}

</div>

                  </article>

                )
              )}

            </div>

          </div>

        )}

      </section>


      {/* =================================================
          ACCESS GAP DASHBOARD
      ================================================= */}

      <section
        id="gap"
        className="section gap-section"
      >

        <div className="section-heading">

          <p className="eyebrow">
            ACCESS GAP INTELLIGENCE
          </p>

          <h2>
            Where does
            <br />
            <em>access break down?</em>
          </h2>

          <p>
            YojanaSetu turns reported access
            barriers into evidence that can
            help identify recurring problems.
          </p>

        </div>


        {/* OVERALL DASHBOARD */}

        <div className="dashboard-overview">

          <div className="overview-number">

            <span>
              TOTAL REPORTS
            </span>

            <strong>
              {totalReports}
            </strong>

            <p>
              user-reported barriers
            </p>

          </div>


          <div className="overview-bars">

            {dashboardLoading ? (

              <p>
                Loading access data...
              </p>

            ) : dashboardError ? (

              <p className="dashboard-error">
                {dashboardError}
              </p>

            ) : barrierSummary.length === 0 ? (

              <p>
                No barrier reports yet.
              </p>

            ) : (

              barrierSummary.map(
                (item) => {

                  const percentage =
                    totalReports > 0
                      ? (
                          item.report_count /
                          totalReports
                        ) * 100
                      : 0;

                  return (

                    <div
                      className="overall-bar-row"
                      key={
                        item.barrier_type
                      }
                    >

                      <div className="bar-label">

                        <span>
                          {item.barrier_type}
                        </span>

                        <strong>
                          {item.report_count}
                        </strong>

                      </div>

                      <div className="bar-track">

                        <div
                          className="bar-fill"
                          style={{
                            width:
                              `${percentage}%`
                          }}
                        />

                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </div>


        {/* SCHEME LEVEL */}

        <div className="scheme-analysis">

          <div className="section-heading compact">

            <p className="eyebrow">
              SCHEME-LEVEL ANALYSIS
            </p>

            <h3>
              Which schemes show
              <em> access signals?</em>
            </h3>

            <p>
              Report volume is used as a simple
              prototype signal. It is not an
              official government rating.
            </p>

          </div>


          {schemeDashboardLoading ? (

            <div className="dashboard-message">
              Loading scheme-level analysis...
            </div>

          ) : schemeDashboardError ? (

            <div className="dashboard-error">
              {schemeDashboardError}
            </div>

          ) : schemeBarrierSummary.length === 0 ? (

            <div className="dashboard-message">
              No scheme-specific barrier reports yet.
            </div>

          ) : (

            <div className="scheme-gap-grid">

              {schemeBarrierSummary.map(
                (scheme) => {

                  const highestBarrier =
                    scheme.barriers.reduce(
                      (highest, current) =>
                        current.report_count >
                        highest.report_count
                          ? current
                          : highest,
                      scheme.barriers[0]
                    );


                  const severity =
                    getSeverity(
                      scheme.total_reports
                    );


                  return (

                    <div
                      className="scheme-gap-card"
                      key={scheme.scheme_id}
                    >

                      <div className="scheme-gap-card-top">

                        <div>

                          <p className="scheme-label">
                            SCHEME
                          </p>

                          <h4>
                            {scheme.scheme_name}
                          </h4>

                        </div>


                        <div className="scheme-report-info">

                          <div className="scheme-report-count">

                            {scheme.total_reports}

                            <span>
                              reports
                            </span>

                          </div>


                          <span
                            className={
                              `severity-badge severity-${severity.toLowerCase()}`
                            }
                          >
                            {severity}
                            {" "}
                            Access Gap
                          </span>

                        </div>

                      </div>


                      <div className="scheme-gap-highlight">

                        <div>

                          <span>
                            Most reported barrier
                          </span>

                          <strong>
                            {
                              highestBarrier?.barrier_type ||
                              "Not available"
                            }
                          </strong>

                        </div>


                        <p>

                          {severity === "High"

                            ? "Multiple barriers have been reported. This scheme may require further investigation into accessibility."

                            : severity === "Medium"

                            ? "Several barriers have been reported. Further investigation may help identify accessibility issues."

                            : "A small number of barriers have been reported so far."

                          }

                        </p>

                      </div>


                      <div className="scheme-barriers">

                        {scheme.barriers.map(
                          (barrier) => {

                            const percentage =
                              scheme.total_reports > 0
                                ? (
                                    barrier.report_count /
                                    scheme.total_reports
                                  ) * 100
                                : 0;

                            return (

                              <div
                                className="scheme-barrier-row"
                                key={
                                  barrier.barrier_type
                                }
                              >

                                <div className="scheme-barrier-label">

                                  <span>
                                    {
                                      barrier.barrier_type
                                    }
                                  </span>

                                  <span>
                                    {
                                      barrier.report_count
                                    }
                                  </span>

                                </div>


                                <div className="scheme-bar-track">

                                  <div
                                    className="scheme-bar-fill"
                                    style={{
                                      width:
                                        `${percentage}%`
                                    }}
                                  />

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            AI INSIGHTS
        ================================================= */}

        <div className="insights-section">

          <div className="section-heading compact">

            <p className="eyebrow">
              AI-STYLE INSIGHTS
            </p>

            <h3>
              From reports to
              <em> meaningful signals.</em>
            </h3>

            <p>
              YojanaSetu interprets reported
              barriers and suggests what should
              be investigated next.
            </p>

          </div>


          {insightsLoading ? (

            <div className="dashboard-message">
              Generating access insights...
            </div>

          ) : insightsError ? (

            <div className="dashboard-error">
              {insightsError}
            </div>

          ) : accessInsights.length === 0 ? (

            <div className="insight-empty">

              <span>
                ✦
              </span>

              <h4>
                Insights will appear here.
              </h4>

              <p>
                Submit scheme-specific barrier
                reports to begin generating
                access-gap signals.
              </p>

            </div>

          ) : (

            <div className="insight-grid">

              {accessInsights.map(
                (insight) => (

                  <article
                    className="insight-card"
                    key={insight.scheme_id}
                  >

                    <div className="insight-card-top">

                      <span className="ai-mark">
                        AI
                      </span>

                      <span
                        className={
                          `severity-badge severity-${insight.severity.toLowerCase()}`
                        }
                      >
                        {insight.severity}
                      </span>

                    </div>


                    <p className="insight-scheme">
                      {insight.scheme_name}
                    </p>


                    <h4>
                      {insight.headline}
                    </h4>


                    <p className="insight-text">
                      {insight.insight}
                    </p>


                    <div className="insight-action">

                      <span>
                        RECOMMENDED ACTION
                      </span>

                      <p>
                        {insight.action}
                      </p>

                    </div>


                    <div className="confidence">

                      <span>
                        SIGNAL CONFIDENCE
                      </span>

                      <strong>
                        {insight.confidence}
                      </strong>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </div>

      </section>


      {/* =================================================
          REPORT BARRIER
      ================================================= */}

      <section
        id="report"
        className="section report-section"
      >

        <div className="report-layout">

          <div className="section-heading">

            <p className="eyebrow">
              REPORT A BARRIER
            </p>

            <h2>
              Help us understand
              <br />
              <em>what gets in the way.</em>
            </h2>

            <p>
              If a person is eligible for a
              scheme but cannot access it,
              the reason matters.
            </p>

            <div className="barrier-examples">

              <span>
                Documentation
              </span>

              <span>
                Awareness
              </span>

              <span>
                Digital Access
              </span>

              <span>
                Process
              </span>

              <span>
                Language
              </span>

            </div>

          </div>


          <form
            className="barrier-form"
            onSubmit={
              handleBarrierSubmit
            }
          >

            <div className="form-group">

              <label>
                Related Scheme
              </label>

              <select
                name="scheme_id"
                value={
                  barrierForm.scheme_id
                }
                onChange={
                  handleBarrierChange
                }
              >

                <option value="">
                  Select a scheme
                </option>

                {schemes.map(
                  (scheme) => (

                    <option
                      key={scheme.id}
                      value={scheme.id}
                    >
                      {scheme.name}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="form-group">

              <label>
                Barrier Type
              </label>

              <select
                name="barrier_type"
                value={
                  barrierForm.barrier_type
                }
                onChange={
                  handleBarrierChange
                }
                required
              >

                <option value="">
                  Select barrier
                </option>

                <option value="documentation">
                  Documentation
                </option>

                <option value="awareness">
                  Awareness
                </option>

                <option value="digital_access">
                  Digital Access
                </option>

                <option value="application_process">
                  Process
                </option>

                <option value="eligibility_confusion">
                  Eligibility / Language Confusion
                </option>

                <option value="financial">
                  Financial
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                What happened?
              </label>

              <textarea
                name="description"
                value={
                  barrierForm.description
                }
                onChange={
                  handleBarrierChange
                }
                placeholder="Briefly describe the problem..."
                rows="5"
              />

            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={
                barrierSubmitting
              }
            >

              {barrierSubmitting
                ? "Submitting..."
                : "Submit Barrier Report"
              }

              <span>
                →
              </span>

            </button>


            {barrierMessage && (

              <div className="success-message">
                {barrierMessage}
              </div>

            )}


            {barrierError && (

              <div className="error-message">
                {barrierError}
              </div>

            )}

          </form>

        </div>

      </section>


      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="section about-section"
      >

        <div className="about-number">
          01
        </div>

        <div>

          <p className="eyebrow">
            ABOUT YOJANASETU
          </p>

          <h2>
            Eligibility is only
            <br />
            the beginning.
          </h2>

          <p className="about-text">

            A welfare scheme can exist,
            eligibility rules can be satisfied,
            and support can still remain
            inaccessible.

            <br />
            <br />

            YojanaSetu is designed to explore
            that gap — connecting eligibility
            discovery with real-world access
            barriers.

          </p>

        </div>

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <div>

          <a
            href="#home"
            className="brand"
          >
            Yojana<span>Setu</span>
          </a>

          <p>
            AI-powered welfare access
            intelligence.
          </p>

        </div>


        <div className="footer-right">

          <span>
            PILOT · MAHARASHTRA
          </span>

          <span>
            DEMO PROTOTYPE · 2026
          </span>

        </div>

      </footer>

    </div>
  );
}


export default App;