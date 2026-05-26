**Resume Shortlisting App**

Product Review & Enhancement Recommendations

Internal HR Tech Team  ·  May 2025

**Purpose**

This document captures all review notes gathered from initial exploration of the resume shortlisting application, structured into six functional modules. Each item is classified by type and supplemented with additional recommendations to help the tech team prioritise and build a more complete, time-saving hiring tool.

**Item classification**

| Fix Bug / broken flow — must be resolved | Add Missing feature — needs to be built | Enhance Existing feature needing improvement | Suggestion New idea that could add value |
| :---- | :---- | :---- | :---- |

| A | Applicant profile — links & documents |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Add** | **Portfolio link field** | Portfolio URL is missing from the applicant profile. Add a dedicated field alongside resume and LinkedIn so candidates can share work samples, GitHub, Dribbble, or personal sites. |
| **Add** | **LinkedIn profile link** | No field currently captures the LinkedIn URL. Add it to the profile form and flag it visually when a candidate has not provided one. |
| **Enhance** | **Missing link detection** | Auto-detect when portfolio or LinkedIn links are absent from the parsed resume and surface a 'Link missing' indicator on the profile card so reviewers know at a glance. |
| **Add** | **Resume file link / viewer** | The uploaded resume file should be accessible directly from the profile — either as a download link or an inline preview panel. Currently the file is not surfaced after upload. |
| **Suggestion** | **Auto-parse links from resume** | When a resume is uploaded, attempt to auto-extract LinkedIn, GitHub, portfolio, and email links and pre-fill the relevant fields — reduces manual data entry for applicants and reviewers. |

| B | JD creation — criteria & classification |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Fix** | **Criteria editing locked after submission** | Once a JD is submitted, criteria cannot be edited. This is a critical gap — requirements evolve. Add an 'Edit criteria' action for active JDs accessible to authorised users. |
| **Add** | **Criteria tier: Must / Strong / Nice-to-have** | Current system has Must and Nice. 'Strong' (highly preferred but not blocking) is a meaningful middle tier. Define clearly: Must \= disqualifying if absent; Strong \= heavily weighted in scoring; Nice \= bonus only. |
| **Enhance** | **JD preview before submission** | Add a formatted preview step before a JD is finalised so the creator can review how criteria will appear to reviewers and catch errors or missing fields before going live. |
| **Suggestion** | **Criteria weight configuration** | Let hiring managers assign numeric weights to Must / Strong / Nice criteria so the match score reflects actual priorities — e.g. a Must skill counts 3x more than a Nice-to-have. |
| **Suggestion** | **Edit history / audit trail** | Track who changed criteria and when. Useful for compliance and for understanding why a candidate's score changed after criteria were updated mid-pipeline. |

| C | Candidate ranking & scoring |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Add** | **Match score with rank distribution** | Show score \+ count, e.g. 98% (1), 80% (7), 65% (12). Lets reviewers instantly see score spread and cluster quality without opening individual profiles. |
| **Enhance** | **Filter & sort by score** | Allow filtering high-to-low by match score and quick Top N views (top 10, 15, 20). Essential for large applicant pools where scrolling through all profiles is inefficient. |
| **Suggestion** | **Score breakdown per criteria tier** | Instead of one aggregate score, show sub-scores: Must match 100% · Strong match 75% · Nice match 40%. Makes it easy to see why a candidate ranked where they did. |
| **Suggestion** | **Score change alert on criteria edit** | When a JD's criteria are modified, flag candidates whose rankings have shifted significantly — prevents silent re-ranking going unnoticed by the team. |

| D | Applicant list & pipeline view |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Enhance** | **JD tag on global applicant list** | In the all-applicants view, each candidate card should show a tag for the JD(s) they have applied to. Without it, context is lost when reviewing the overall shortlisted list. |
| **Add** | **Top candidates summary panel** | A quick-access 'Top candidates' view showing highest-scored applicants across all or per JD — saves time versus navigating into each JD separately to find the best matches. |
| **Suggestion** | **Applicant pipeline stages** | Consider adding pipeline stages beyond shortlisted — e.g. Applied \> Screened \> Interviewed \> Offer \> Hired / Rejected — so the tool tracks the full recruitment lifecycle. |
| **Suggestion** | **Bulk actions on candidate list** | Select multiple candidates and move them to a stage, export profiles, or send a templated email in one action — critical for managing large applicant pools efficiently. |

| E | JD management — active vs. closed jobs |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Add** | **Active / Closed job buckets** | Separate JDs into Active and Closed views. Closed jobs should be archived but accessible for reference — useful when rehiring for the same role or reviewing past decisions. |
| **Suggestion** | **Re-open or clone a closed JD** | Allow a closed JD to be cloned as a new draft or re-opened, inheriting prior criteria. Avoids re-creating the same role from scratch when it reopens. |
| **Suggestion** | **JD status timestamps** | Record when a JD was published, paused, and closed. Helps track time-to-fill metrics and gives useful context when revisiting archived roles. |

| F | Additional suggestions — new ideas |
| :---: | :---- |

| Type | Item | Detail |
| ----- | :---- | :---- |
| **Suggestion** | **Duplicate applicant detection** | Flag if the same person applies to multiple JDs — helps avoid assigning the same candidate to two separate pipelines without awareness. |
| **Suggestion** | **Reviewer notes & comments** | Allow HR reviewers to leave structured notes against a candidate visible to the team — reduces reliance on external spreadsheets or email threads. |
| **Suggestion** | **Shortlist export (PDF / CSV)** | Export a shortlisted candidate list with scores, criteria match, and contact details — useful for sharing with hiring managers who do not access the tool directly. |
| **Suggestion** | **Role-based access control** | Differentiate what hiring managers can see and do versus HR admins. E.g. managers view shortlists and leave feedback; admins manage JDs, criteria, and all candidates. |

**Priority quick wins**

The following three items will have the highest immediate impact on shortlisting efficiency and should be prioritised in the next sprint:

| 1 | Fix criteria editing (Section B) | Criteria cannot be edited after JD submission — this is a blocking issue that prevents the team from refining requirements as the role evolves. |
| :---: | :---- | :---- |
| **2** | **Add 'Strong' criteria tier (Section B)** | Introducing Must / Strong / Nice-to-have provides hiring managers with meaningful weighting control and makes match scores more accurate and trustworthy. |
| **3** | **Score-based filtering & Top N view (Section C)** | Filtering by score and surfacing a top 10/15/20 view will directly cut the time reviewers spend in the applicant list, especially for high-volume roles. |
