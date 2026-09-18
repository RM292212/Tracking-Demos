# Executive Client Explanation Scripts

**Document Version**: 1.0.0  
**Target Audience**: Agency Owners, Account Directors, Technical Auditors  
**Use Case**: Presenting ResponseLock Audit Findings to Non-Technical Stakeholders (CEOs, CMOs, Founders)  
**Constraint**: Each spoken script is strictly under 60 words in plain business English.

---

## 1. Executive Presentation Philosophy

Chief Executives and CMOs do not think in dataLayer pushes, JavaScript event listeners, or CSS selectors. They think in **wasted ad spend, distorted cost-per-acquisition (CPA), lost pipeline, and misallocated budgets**.

When presenting audit findings:
1. **Never lead with code**: Lead with the financial consequence.
2. **Translate mechanics to business reality**: Explain what the system *did* versus what the budget *spent*.
3. **Keep it under 60 words**: Deliver the core finding before the executive's attention drifts.

---

## 2. The Six Defect Explanation Scripts

---

### Defect 1: Conversion Fires on Invalid Submit Button Click
- **Finding ID**: `RL-AUDIT-DEF-001`
- **Technical Issue**: Submit button click listener fires conversion event before form validation occurs.
- **Target Persona**: Chief Executive Officer / VP of Marketing

#### Spoken Client Script (53 words)
> "Your website fires a conversion the moment someone clicks 'Submit,' even if they leave required fields blank. When people make mistakes or bots click around, your ad platforms count them as real leads. Google's algorithm thinks these accidental clicks are valuable customers, wasting your ad budget bidding on people who never contacted you."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"Our Google Ads dashboard shows our cost per lead is $45. Are you saying that's wrong?"*
- **Response**: *"Yes. Because every incomplete click counts as a lead, your true cost per legitimate customer inquiry is closer to $75. Your ad spend is actively buying empty clicks."*

---

### Defect 2: Duplicate Conversion Event (Legacy + Modern)
- **Finding ID**: `RL-AUDIT-DEF-002`
- **Technical Issue**: Both legacy tracking code and new post-success handler fire on a single lead.
- **Target Persona**: Chief Marketing Officer / Head of Paid Acquisition

#### Spoken Client Script (51 words)
> "An old tracking code and a new tracking code are running at the same time. Every time a customer submits your form, both codes fire. Your ad dashboard reports two leads for every one real customer, making your cost per lead look half of what it actually costs you in cash."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"Why didn't our previous agency catch this?"*
- **Response**: *"Because the form works and the CRM has the right lead count. Unless someone audits the browser events alongside the ad platform pixels, double-counting looks like great performance."*

---

### Defect 3: Missing Conversion (Typo in Event Constant)
- **Finding ID**: `RL-AUDIT-DEF-003`
- **Technical Issue**: Event constant misspelled as `demo_lead_sucess`, preventing GTM trigger match.
- **Target Persona**: Agency Owner / Managing Director

#### Spoken Client Script (47 words)
> "Your form works, but a single-letter spelling typo in your site code stops Google Tag Manager from recognizing the submission. Leads reach your inbox, but Google Ads sees zero conversions. The bidding algorithm assumes your campaigns failed and stops showing your ads, choking off real customer volume."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"How can the form work if the tracking is completely broken?"*
- **Response**: *"The form sends data to your sales team through the server, but the analytics tag in the browser is listening for a misspelled event name. It fails silently with zero errors."*

---

### Defect 4: Bad Event Parameters (Schema Drift)
- **Finding ID**: `RL-AUDIT-DEF-004`
- **Technical Issue**: Internal form identifiers changed, dropping `form_id` and setting `lead_type` to `'contact'`.
- **Target Persona**: VP of Growth / Performance Marketing Director

#### Spoken Client Script (47 words)
> "Your conversion event fires, but the labels identifying which form was filled out are missing or scrambled. In Google Analytics, your inquiries get lumped together under '(not set).' You cannot tell which landing pages produce qualified business, and automated bidding cannot prioritize high-value inquiries over general contacts."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"Does this affect our day-to-day lead volume?"*
- **Response**: *"No, but it cripples your optimization. Google Ads treats high-value sales requests the same as newsletter signups because it can't distinguish between them."*

---

### Defect 5: Attribution Loss Across Multi-Step Navigation
- **Finding ID**: `RL-AUDIT-DEF-005`
- **Technical Issue**: SPA router navigation strips query parameters; submit handler reads live URL.
- **Target Persona**: Chief Financial Officer / Chief Commercial Officer

#### Spoken Client Script (48 words)
> "When visitors click your ad and move between form steps, your site forgets the tracking link. By the time they submit, all Google ad tags have vanished. Your CRM credits the sale to 'Direct' traffic. You think paid ads aren't working, even when they're driving your biggest clients."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"Our reports show 80% of revenue comes from Direct. Could this be why?"*
- **Response**: *"Precisely. Paid clicks that cost you money are being labeled as free direct visits because the multi-step form drops the tracking string before saving to your CRM."*

---

### Defect 6: Incomplete and Mismapped CRM Record
- **Finding ID**: `RL-AUDIT-DEF-006`
- **Technical Issue**: Server mapper drops `utm_campaign`, swaps `utm_source` into detail, and leaves source blank.
- **Target Persona**: Chief Revenue Officer / VP of Sales

#### Spoken Client Script (47 words)
> "Your ad tracking looks fine, but the server connecting your website to your CRM is dropping campaign details and swapping data fields. Leads land in your sales database with blank sources. Sales reps can't prioritize them, and your pipeline reports cannot prove which campaigns generated closed revenue."

#### Delivery Guidance & Handling Executive Questions
- **Executive Question**: *"Why does our marketing team say tracking is green while sales complains about bad data?"*
- **Response**: *"Marketing is only looking at Google Analytics, where tags fire. Sales is looking at Salesforce, where the data arrives blank. The breakdown is happening in the server connection between them."*

---

## 3. Executive Script Word Count Verification

| Defect ID | Defect Name | Script Word Count | Compliance (≤ 60 Words) |
|---|---|:---:|:---:|
| `RL-AUDIT-DEF-001` | Premature Invalid Submit Conversion | **53 words** | PASS |
| `RL-AUDIT-DEF-002` | Duplicate Conversion Event | **51 words** | PASS |
| `RL-AUDIT-DEF-003` | Missing Conversion (Typo) | **47 words** | PASS |
| `RL-AUDIT-DEF-004` | Parameter Schema Drift | **47 words** | PASS |
| `RL-AUDIT-DEF-005` | SPA Attribution Loss | **48 words** | PASS |
| `RL-AUDIT-DEF-006` | Incomplete CRM Record | **47 words** | PASS |

*All scripts strictly satisfy the under-60-word requirement while clearly communicating financial and operational impact.*
