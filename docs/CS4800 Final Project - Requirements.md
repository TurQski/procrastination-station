# CS4800 Final Project - Requirements

- Course: [[CS4800|CS4800 - Software Engineering]]
- Status: Requirements initialized; product definition and implementation pending further instructions.
- Initialized: 2026-10-18
- Source: [[raw/Course Materials/Assignments/CS4800/CS4800 AI - Assignment 2.pdf|Assignment 2 — original prompt]] (pages 1–2)
- Source summary: [[CS4800 Assignment 2 - Source Notes]]
- Working approach: AI-assisted / vibe coding with professor approval, as reported by the student. Specific workflow instructions will follow.

## Objective

Build and deploy the first working version (MVP) of the final project. An MVP is the smallest usable version that demonstrates the product’s main purpose. The product idea and its essential user workflow have not yet been provided in this workspace.

## Required baseline

These requirements come from the assignment. The verification column translates them into proposed practical checks; it does not add professor-specified requirements.

| ID | Assignment requirement | Proposed verification / evidence | Status |
| --- | --- | --- | --- |
| REQ-01 | Include a backend server; any stack is allowed. | Demonstrate the deployed backend handling an application request. | Pending |
| REQ-02 | Include a frontend; any stack is allowed. | Open the deployed frontend and complete the main user workflow. | Pending |
| REQ-03 | Persist data in a database; any stack is allowed. | Save a record and retrieve it in a later session; confirm it exists in the database. Browser-only or in-memory storage would not satisfy database persistence. | Pending |
| REQ-04 | Push code to GitHub. | Record the repository URL and confirm the implemented code is pushed. The prompt does not specify repository visibility. | Pending |
| REQ-05 | Use a clean project structure. | Review folders and responsibilities; proposed supporting evidence is a README explaining setup and layout. No particular folder layout or README is mandated by the prompt. | Pending |
| REQ-06 | Deploy to AWS EC2, Vercel, or another cloud service. | Open the public app URL and verify the core workflow, backend, and database work in the deployed environment. | Pending |
| REQ-07 | Implement continuous integration (CI). | Trigger an automated pipeline from a code change and retain a successful run with relevant build/test checks. The prompt does not prescribe the provider or exact checks. | Pending |
| REQ-08 | Submit the public deployed web-app URL in Canvas. | Record the final URL and Canvas submission confirmation after submission. | Pending |

CI means automatically checking integrated code changes. Automatic deployment may be useful, but the prompt does not explicitly require continuous deployment.

## Timeline and grading

| Phase | Milestone | Date listed in prompt |
| --- | --- | --- |
| 1 | Ideation | 2026-09-07 |
| 2 | MVP deployed | 2026-10-19 |
| 3 | Marketing milestone — first 100 users | 2026-11-10 |
| 4 | Final submission / presentation | 2026-12-01 |

Assignment 2 is worth **10 points**. Its due-date field says **see Canvas**; the timeline separately lists October 19 for the deployed MVP. Canvas has not been checked. Completion of earlier milestones is unknown. The 100-user milestone and final presentation are later phases, not stated Assignment 2 submission requirements.

## Product decisions awaiting further instructions

| Decision | Current state |
| --- | --- |
| App name and problem to solve | TBD |
| Target users | TBD |
| Core user journey and MVP features | TBD |
| Features deferred beyond the MVP | TBD |
| Data entities, relationships, and validation rules | TBD |
| Frontend and backend technologies | Any stack allowed; selection pending |
| Database technology | Any stack allowed; selection pending |
| Cloud provider and deployment architecture | EC2, Vercel, or another cloud service allowed; selection pending |
| GitHub repository and CI workflow | TBD |
| Authentication, roles, and external integrations | Need depends on the app; not explicitly required by this prompt |
| Canvas due date and any additional final-project rubric | Not yet verified / supplied |

The PDF defines technical and delivery requirements, but does not define the app’s business features. No product-specific features or technology choices have been committed.

## Example of a future acceptance criterion

Illustration only, not a chosen project feature: if the app manages tasks, a user can create a task through the frontend, the backend saves it in the database, and the same task remains available after closing and reopening the app. This single workflow supplies evidence for REQ-01 through REQ-03 and can be repeated at the deployed URL for REQ-06.

Once the app idea is supplied, replace this illustration with product-specific acceptance criteria and map each feature to its data and verification steps.

## MVP delivery checklist

- [ ] Define the app, target user, and smallest useful end-to-end workflow.
- [ ] Choose the stack and deployment architecture within the allowed options.
- [ ] Implement and verify REQ-01 through REQ-03.
- [ ] Organize the code and push it to GitHub (REQ-04 and REQ-05).
- [ ] Implement CI and retain a successful run (REQ-07).
- [ ] Deploy and verify the public app (REQ-06).
- [ ] Confirm the Canvas deadline and submit the public URL (REQ-08).

## Delivery record

- GitHub repository: TBD
- CI configuration / successful run: TBD
- Hosting provider: TBD
- Public app URL: TBD
- Verification evidence: TBD
- Canvas submission confirmation: Pending

## Related

- [[CS4800]]
- [[Assignments Dashboard]]
- [[Current Semester Hub]]
