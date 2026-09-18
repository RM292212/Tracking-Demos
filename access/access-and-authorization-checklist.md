# Access & Authorization Onboarding Checklist

**Document Reference**: ACC-RL-2026-0350  
**Engagement**: ResponseLock Lead & Conversion Integrity Audit ($350 Fixed Fee)  
**Standard Audit Turnaround**: 5 Business Days  
**Auditor Lead Identity**: `audit-agent@example.com`  
**Security Governance Standard**: Zero-PII, Read-Only, Strict Non-Interference  

---

## 1. Governance & Security Policy Statement

ResponseLock operates under a strict principle of **least-privilege, read-only access**. 

During the 5-day diagnostic audit, ResponseLock analysts and automated verification harnesses inspect conversion tracking pathways without altering production configurations. 

### Core Access Principles:
1. **Zero Production Mutation**: ResponseLock will never create tags, edit triggers, modify variables, publish GTM container versions, or adjust live ad bids or campaign budgets.
2. **Zero PII Exposure**: Diagnostic audits exclusively utilize synthetic test data (`demo.user@example.com`, `+1-555-0100`). Live customer Personally Identifiable Information (PII) is neither requested nor ingested.
3. **Dedicated Auditor Identity**: All access is requested for a single, designated, organization-controlled account: `audit-agent@example.com`.
4. **Enforced Access Revocation**: Following the 30-minute debrief on Day 5, the client is requested to immediately revoke all provisioned accounts.

---

## 2. Platform Access Requirements Matrix

| System / Tool | Requested Role | Permitted Actions | Prohibited Actions (ResponseLock Policy) |
|---|---|---|---|
| **Google Tag Manager (GTM)** | **Viewer (Read-Only)** | View tags, triggers, variables, built-in variables, folder structures, and container version history. | ❌ Create/edit tags or triggers<br>❌ Edit workspace<br>❌ Approve or Publish versions<br>❌ Manage user permissions |
| **Google Analytics 4 (GA4)** | **Viewer** | View real-time reports, GA4 DebugView, custom dimension definitions, conversion key event flags. | ❌ Edit property settings<br>❌ Create custom definitions<br>❌ Link Google Ads accounts<br>❌ Modify data retention or filters |
| **CRM / Lead Database** | **Sandbox / Test Environment Access** OR **Redacted Test Export** | Inspect custom lead fields (`lead_source`, `lead_source_detail`, `campaign_name`, `gclid`), verify field mapping of synthetic test submissions. | ❌ View production customer PII<br>❌ Export production customer lists<br>❌ Alter CRM schema/workflows<br>❌ Send outbound email/SMS |
| **Google Ads (Conceptual / Verification)** | **Read-Only (Viewer)** *(Optional)* | View conversion action settings, attribution models, and conversion count settings (One vs Every). | ❌ Create or pause campaigns<br>❌ Modify budgets or bid targets<br>❌ Upload customer match lists<br>❌ Edit conversion actions |

---

## 3. Step-by-Step Provisioning Guide for Client Administrators

### 3.1 Google Tag Manager (GTM) Provisioning
1. Navigate to **Google Tag Manager** (`https://tagmanager.google.com`).
2. Select the target Container representing the audit domain.
3. Click the **Admin** tab located in the top navigation bar.
4. In the **Container** column (right side), select **User Management**.
5. Click the blue **+** (Add Users) button in the upper-right corner.
6. Enter the auditor email: `audit-agent@example.com`.
7. Under **Container Permissions**, ensure:
   - **Read** is checked (**YES**).
   - **Edit** is unchecked (**NO**).
   - **Approve** is unchecked (**NO**).
   - **Publish** is unchecked (**NO**).
8. Click **Save / Send Invitation**.

> **Verification Rule**: If your enterprise GTM setup automatically defaults new users to "Edit" permissions, explicitly uncheck "Edit" prior to sending the invitation. ResponseLock will decline any invitation provisioned with editing or publishing authority.

---

### 3.2 Google Analytics 4 (GA4) Provisioning
1. Navigate to **Google Analytics** (`https://analytics.google.com`).
2. Click the **Admin** gear icon in the bottom-left corner.
3. In the **Property** column, select **Property Access Management**.
4. Click the blue **+** icon in the top-right corner and select **Add users**.
5. Enter the auditor email: `audit-agent@example.com`.
6. Select standard **Viewer** role permissions:
   - Viewer: Can see report data and configuration settings.
   - Do NOT select *Marketer*, *Analyst*, *Editor*, or *Administrator*.
7. Uncheck any administrative notification options.
8. Click **Add**.

---

### 3.3 CRM / Lead Management Provisioning

ResponseLock verifies CRM attribution integrity by injecting controlled synthetic test leads and confirming whether marketing source fields (`utm_source`, `utm_medium`, `utm_campaign`, `gclid`) properly persist.

Clients may choose **Option A** (preferred) or **Option B**:

#### Option A: Dedicated Sandbox / Staging Environment (Preferred)
1. Provide credentials or an invitation to your CRM sandbox or staging environment.
2. Ensure the sandbox is configured to receive webhook/API submissions from the landing page.
3. Role: Standard Read-Only / API viewer.

#### Option B: Sanitized CSV Export of Test Records
If staging access is unavailable, the client marketing operations team can export recent test lead records created by ResponseLock:
1. Export the synthetic leads submitted during Day 1 of the audit (identified by synthetic email prefix `audit.lead+*@example.com`).
2. Verify that all production PII is completely excluded.
3. Ensure the CSV export contains the following columns:
   - `created_at` (timestamp)
   - `submission_id` (UUID identifier)
   - `lead_source`
   - `lead_source_detail`
   - `campaign_name`
   - `gclid` / `click_id`
   - `mapping_status`
4. Securely upload the CSV to the provided encrypted audit portal link.

---

## 4. Test Lead Data Specifications & Safeguards

To prevent internal team confusion and ensure synthetic test leads do not corrupt sales representative pipelines, all diagnostic submissions follow strict synthetic naming standards:

- **First Name**: `ResponseLock`
- **Last Name**: `TestAudit`
- **Email Format**: `audit.lead+[scenario-id]@example.com`
- **Company Name**: `ResponseLock Diagnostic Lab`
- **Phone Number**: `+1-555-0100` to `+1-555-0199`
- **Notes Field**: `[DO NOT CONTACT - AUTOMATED CONVERSION AUDIT TEST RECORD]`

### Client Internal Notification:
We recommend informing sales team leads and CRM admins that synthetic test leads will be submitted during Days 1 through 3 of the audit window. Any automation triggering SDR notifications or sales routing should filter out `@example.com` domains.

---

## 5. Security & Privacy Compliance Commitments

ResponseLock Analytics LLC warrants and covenants that:

1. **Zero External Data Egress**: All diagnostic tooling runs locally or within hardened non-production test harnesses. Stored test records are maintained on encrypted, ephemeral volumes and deleted upon engagement completion.
2. **Multi-Factor Authentication (MFA)**: All ResponseLock auditor accounts are secured with hardware-backed security keys and enforced FIDO2 MFA.
3. **No Credential Sharing**: Individual analyst credentials are never shared, pooled, or stored in plaintext.
4. **Regulatory Adherence**: All testing adheres strictly to GDPR, CCPA, and CPRA standards. No tracking scripts or consent-bypass mechanisms will be executed against real site visitors.
5. **Prompt Access Revocation**: On Day 5, upon conclusion of the 30-minute debrief, ResponseLock will submit a formal sign-off confirming engagement close and requesting immediate de-provisioning of `audit-agent@example.com`.

---

## 6. Onboarding Sign-Off & Verification Checklist

Please verify each item prior to notifying your ResponseLock audit lead:

- [ ] GTM Container Viewer permission granted to `audit-agent@example.com`
- [ ] GTM Edit/Publish permissions confirmed disabled
- [ ] GA4 Property Viewer permission granted to `audit-agent@example.com`
- [ ] Primary target domain and 1 to 3 conversion funnels confirmed in writing
- [ ] CRM verification approach confirmed (Option A: Sandbox OR Option B: Redacted Export)
- [ ] Sales team notified regarding synthetic test lead filtering (`@example.com`)
- [ ] Audit kickoff date confirmed

**Client Verification By**:  
Name: `[Client Admin Name]`  
Title: `[Client Admin Title]`  
Date Completed: `[YYYY-MM-DD]`  
Verification Status: `Ready for Audit Initiation`  
