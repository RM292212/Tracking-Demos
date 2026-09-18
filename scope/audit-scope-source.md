# Statement of Work: Lead & Conversion Integrity Audit

**Document Reference**: SOW-RL-2026-0350  
**Engagement Model**: Fixed-Fee Diagnostic Audit  
**Total Investment**: $350.00 USD (Fixed Fee, Net 7)  
**Turnaround Time**: 5 Business Days from Confirmed Access  
**Service Provider**: ResponseLock Analytics LLC  
**Client Entity**: Fictional Client Partner (e.g., Apex Horizon Technologies)  

---

## 1. Executive Summary & Purpose

The **ResponseLock Lead & Conversion Integrity Audit** is an independent, rigorous technical examination of a client's digital conversion tracking infrastructure. 

In high-velocity paid-media campaigns (Google Ads, Meta Ads, LinkedIn Ads), marketing performance relies fundamentally on the integrity of conversion signals. However, standard website verification often ceases at the visual layer: if a form displays a "Thank You" message, marketing teams assume conversion data is accurate. 

**Our Core Finding**: A web form that successfully submits does not mean conversion data is trustworthy.

Common silent tracking failures—such as duplicate event triggers, conversions firing on invalid submissions, attribution parameters dropped during multi-step navigation, and schema drift between the website and CRM—routinely contaminate automated bidding algorithms (e.g., Google Ads Smart Bidding). This results in misallocated ad spend, inflated cost-per-acquisition (CPA), and corrupted marketing attribution.

This Statement of Work defines the exact scope, boundaries, deliverables, and service level agreements (SLAs) for the **$350.00 USD Fixed-Fee Audit**.

---

## 2. In-Scope Deliverables

The fixed-fee audit encompasses a structured, 5-stage diagnostic process covering the end-to-end conversion chain across one primary web property:

```
[Ad Click / Entry URL] 
       │ (UTM Parameters & Click IDs)
       ▼
[Landing Page & Attribution Persistence]
       │ (First-Touch & Last-Touch Storage)
       ▼
[Client-Side Form Validation]
       │ (Honeypot, Constraint Validation, Error States)
       ▼
[Server API Submission & Idempotency]
       │ (HTTP 201 Response, UUIDv4 Idempotency Key)
       ▼
[CRM Record & Field Mapping]
       │ (lead_source, lead_source_detail, campaign_name, gclid)
       ▼
[Browser dataLayer & Tag Management]
       │ (Approved Event Whitelist, Zero PII Assertion)
       ▼
[Analytics & Ad Platform Signal Verification]
       │ (GA4 Key Events, Tag Assistant Verification)
```

### 2.1 Scope Parameters
- **Primary Domain**: Exactly one (1) primary production or pre-production web domain (e.g., `https://example.com` or `https://demo.example.com`).
- **Conversion Funnels**: Up to three (3) distinct lead-capture funnels or form workflows (e.g., Request a Demo, Contact Sales, Free Trial / Whitepaper Download).
- **Turnaround SLA**: Delivery of the full written audit report within **5 business days** following confirmed receipt of required read-only access.

### 2.2 Detailed Deliverable Breakdown

| Deliverable ID | Deliverable Name | Description & Acceptance Standard | Format |
|---|---|---|---|
| **DEL-01** | **dataLayer & Event Structure Analysis** | Comprehensive inspection of client-side `window.dataLayer` pushes during lead interactions. Verification against approved event names, parameter consistency, timestamp sequencing, and automated validation of the zero-PII policy (confirming no names, emails, phones, or URLs leak into analytics payloads). | Section in Written Audit Report |
| **DEL-02** | **Trigger & Firing Integrity Review** | Inspection of tag management firing triggers (GTM / Tag Manager). Verification that conversion events fire strictly **after** server-confirmed successful lead creation (201 Created), and identification of race conditions, duplicate listeners, or triggers bound to raw submit button clicks. | Section in Written Audit Report |
| **DEL-03** | **Attribution Capture & Persistence Inspection** | End-to-end evaluation of URL parameter handling (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, and `gclid`/`wbraid`). Auditing whether parameters survive multi-step form journeys, client-side routing (SPA navigation), or session interruptions. | Section in Written Audit Report |
| **DEL-04** | **CRM Attribution & Field Mapping Reconciliation** | Cross-verification of submitted form data against records stored in the client CRM or test database. Analysis of field mapping fidelity (e.g., ensuring `utm_source` maps to `lead_source` rather than `lead_source_detail`, and ensuring campaign names are preserved). | Section in Written Audit Report |
| **DEL-05** | **Financial Waste & Algorithmic Impact Model** | Quantitative estimation of ad spend wasted on phantom conversions (false positives), budget misallocation from missing conversions (false negatives), and efficiency drag on algorithmic Smart Bidding models. | Section in Written Audit Report |
| **DEL-06** | **Comprehensive Written Audit Report** | A formal, executive-ready technical audit report containing Executive Summary, Audit Methodology, Defect Severity Matrix, Technical Findings with verbatim payloads, Financial Impact Model, and Prioritized Remediation Roadmap. | Markdown & PDF Deliverable |
| **DEL-07** | **30-Minute Technical Debrief & Strategy Call** | Live screen-share session with ResponseLock lead technical auditor and client stakeholders (marketing director, growth lead, or developer) to review findings, demonstrate reproduction steps, and answer technical questions. | 30-Minute Video Conference |

---

## 3. Explicitly Out of Scope

To maintain strict turnaround velocity and fixed-fee economics ($350.00 USD), the following items are strictly **out of scope**:

1. **Application Code Refactoring & Web Development**:
   - Writing, deploying, or editing production JavaScript, TypeScript, HTML, or CSS code on the client's website.
   - Modifying client repositories, continuous integration (CI/CD) pipelines, or hosting infrastructure.
2. **Tag Management Implementation & Container Publishing**:
   - Creating new GTM workspaces, editing existing tags/triggers, or publishing GTM container versions. (ResponseLock requests read-only viewer access exclusively).
3. **Backend CRM Redesign & Database Migrations**:
   - Custom database schema alterations, CRM pipeline rebuilds, Zapier/Make automation re-engineering, or webhook programming.
4. **Active Ad Campaign Management & Media Buying**:
   - Modifying Google Ads, Meta Ads, or LinkedIn Ads campaign settings, bids, budgets, ad copy, or creative assets.
   - Direct execution of Google Ads offline conversion imports (OCI) or automated bidding strategy reconfiguration.
5. **Third-Party Platform Licensing & Subscription Fees**:
   - Provisioning or purchasing software licenses for Tag Manager platforms, analytics suites, or observability tools.
6. **Post-Audit Implementation Services**:
   - Hands-on implementation of the remediation roadmap. (Remediation engineering is available under a separate, optional Implementation Retainer upon request).

---

## 4. Client Prerequisites & Access Requirements

Timely execution of the 5-day turnaround SLA requires the client to supply the following items prior to project commencement:

1. **Google Tag Manager (GTM)**:
   - Read-only ("Viewer") access granted to the dedicated non-production auditor identity (`audit-agent@example.com`).
   - No edit, publish, or administrative rights required or accepted.
2. **Google Analytics 4 (GA4)**:
   - "Viewer" permissions granted to verify event schemas, custom dimensions, and GA4 DebugView streams.
3. **CRM / Lead Database Sample**:
   - Access to a staging/sandbox CRM instance OR a sanitized CSV export containing at least 25 recent test/lead records with all PII (names, emails, phones) fully redacted, showing only timestamp, submission identifier, and marketing source fields (`lead_source`, `lead_source_detail`, `campaign_name`, `gclid`).
4. **Primary URLs & Test Conditions**:
   - Confirmation of target landing page URLs, staging environments, and any URL query parameters required to trigger test workflows.

---

## 5. Timeline, Milestones & Engagement Schedule

The engagement adheres to a strict 5-business-day execution lifecycle:

```
Day 0: Access Verification & Baseline Handshake
  └── Client grants read-only access; ResponseLock validates connectivity.

Day 1: Synthetic Lead Injection & Baseline Instrumentation
  └── Automated test harness fires controlled test leads across target funnels.
  └── Attribution parameters captured across first-touch and last-touch storage.

Day 2: dataLayer, Trigger & Analytics Deep Dive
  └── Inspection of client-side events, timing sequences, race conditions.
  └── Validation of zero-PII assertion and parameter schema consistency.

Day 3: CRM Reconciliation & Attribution Matching
  └── Reconciliation of dataLayer payloads with stored CRM records.
  └── Identification of dropped parameters and field mapping corruptions.

Day 4: Financial Waste Modeling & Report Assembly
  └── Quantitative calculation of ad spend misallocation and phantom conversion drag.
  └── Compilation of Defect Severity Matrix and Prioritized Remediation Roadmap.

Day 5: Delivery & Technical Debrief
  └── Written Audit Report delivered via secure email.
  └── 30-minute technical debrief call conducted; access revocation confirmation.
```

---

## 6. Commercial Terms & Pricing Fidelity

- **Fixed Professional Fee**: **$350.00 USD** (Three Hundred Fifty Dollars and 00/100 USD).
- **Payment Structure**: 100% due upon project kickoff and delivery of commercial invoice (Net 7 terms).
- **No Hidden Fees**: The $350.00 fee covers all research, automated instrumentation, analysis, report generation, and the 30-minute technical debrief.
- **Guarantee of Independence**: ResponseLock does not accept vendor referral kickbacks, affiliate commissions, or ad-spend percentage markups. All audit evaluations are purely objective and evidence-backed.

---

## 7. Acceptance & Authorization

By signing below or approving via digital confirmation, the parties agree to the scope, deliverables, limitations, and terms detailed in this Statement of Work.

**For ResponseLock Analytics LLC**:  
Name: Alex Mercer  
Title: Principal Conversion Integrity Lead  
Email: `alex.mercer@example.com`  
Date: September 15, 2026  

**For Client Partner**:  
Name: Jordan Taylor  
Title: VP of Growth & Digital Marketing  
Email: `jordan.taylor@example.com`  
Date: September 16, 2026  
