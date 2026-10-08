# Audit and Upwork recording guide

Use the current Alder website and `/audit` view. Record a new live browser take for the final video. The existing 10-second capture is a rehearsal reference made from actual browser frames, not a continuous Loom recording.

## 1. What you can honestly demonstrate

This demo proves local validation, confirmed lead capture, a matching simulated CRM record, a PII-free dataLayer event, duplicate suppression, and campaign attribution. It also reproduces intentional tracking defects.

The live GTM container loads but remains empty. GTM tag firing, GA4 receipt/key-event status, and Google Ads conversion delivery are unverified. Meta and Enhanced Conversions are absent. Do not describe a local event as a conversion received by Google Ads. “Apply corrected handler” activates a prebuilt corrected handler; it does not edit code live.

## 2. Prepare the demo

1. Open `http://127.0.0.1:3000/`. If it is unavailable, open a terminal in `C:\Users\Ranji\code-base\RL-Demo\demo` and run `npm run dev`. Do not start another server while port 3000 is already occupied.
2. Open this tagged landing URL in a fresh browser tab:

   `http://127.0.0.1:3000/?utm_source=google&utm_medium=cpc&utm_campaign=office_demo&utm_term=office_cleaning&utm_content=demo_ad&gclid=DEMO-CLICK-NOT-REAL`

3. Scroll to the footer and click **Verification details**. This navigates to `/audit` and preserves the campaign context.
4. If a previous receipt appears, click **Start another request**. Reload `/audit` to reset the mini repair demonstration, then click **Start another request** if the prior receipt returns. A fresh browser tab usually avoids this receipt state.
5. At the top, confirm **Defect demonstration** and counters `0 / 0 / 0`: False conversions, Invalid requests blocked, Confirmed lead events.
6. Wait until **Run synthetic valid lead through the real pipeline** is enabled. If it still says “Preparing synthetic lead…”, wait for the page to initialize.

Do not reset the entire CRM just to clean a recording. The evidence matches the specific submission ID, so older demo records do not interfere.

## 3. Perform the complete audit before recording

Do this slowly first. This audit is longer than the final introduction video.

| Step | Exact action | Expected evidence |
|---|---|---|
| Initial load | Inspect the top counters and the live evidence panel below | No new confirmed lead event merely from loading the page |
| Reproduce the defect | Leave the small Name/Work email fields blank. Click **Test invalid submission** once | False conversions becomes `1`; confirmed events stays `0`. The message says the broken handler emitted before validation and sent no lead request |
| Diagnose | Read the Root cause explanation | Conversion is coupled to click rather than successful API confirmation |
| Activate the correction | Click **Apply corrected handler** | Badge changes to **Corrected flow active** |
| Retest the same invalid action | Click **Test invalid submission** again | Invalid requests blocked becomes `1`; false conversions remains `1`; confirmed events remains `0`. The old false event is retained as evidence, not erased |
| Test a real successful flow | Click **Run synthetic valid lead through the real pipeline** once | Confirmed lead events becomes `1`; API result says **New record · event emitted once** |
| Verify persistence | Scroll to **What this browser can prove** | Lead API is confirmed; saved CRM record is **Matched by submission ID**; canonical count is `1` |
| Verify the event contract | Expand **Inspect actual canonical event payload** | `event: demo_lead_success`, `form_id: alder_consultation`, `lead_type: consultation`, submission ID, timestamp, campaign fields; no name/email/phone/form message |
| Verify attribution | Compare **Attribution sent to the local lead API** with **Persisted CRM attribution** | `google`, `office_demo`, and `DEMO-CLICK-NOT-REAL` agree; mapping is valid |
| Test duplicate protection | Click **Replay same request to demonstrate duplicate protection** | Existing record is confirmed; canonical event count remains `1`; API result says the earlier event is suppressed |
| Test refresh | Reload `/audit` | Current-page canonical count becomes `0`; prior receipt is labeled as earlier confirmation. Refresh emits no new conversion |
| Test the customer form itself | Click **Start another request**, then submit the large consultation form empty | Required-field errors, no new confirmed event, no successful lead request |

If the synthetic valid run fails, do not record a success claim. Check that the server is running, inspect the visible error, and retry the saved request using its retry button. Do not repeatedly create new submission IDs to conceal a failed request.

### Optional network evidence for a longer portfolio walkthrough

Open browser developer tools and the Network panel before the test. Clear its request list; filter for `leads`. The broken/corrected mini blank forms should create no `/api/leads` request. The valid run should return `201` for a new record; replay should return `200` with `duplicate: true` and the same submission ID. Inspect the response and compare that ID with the CRM evidence panel. A failed response is not a confirmed conversion.

Inspect the GTM script separately if needed. A successful script download proves container loading only. It does not prove GA4 or Google Ads tag execution.

Keep developer tools closed in the short introduction video so the client can read the main proof.

## 4. Set up the screen recording

1. Use a normal browser window showing only the website. Maximize it. Aim for a 1920×1080 landscape recording if your display supports it; otherwise preserve a readable landscape capture.
2. Use Loom's **Screen and Camera** mode for a live camera bubble. Select the intended microphone and camera, then select the browser capture surface. Available capture choices differ between recorder versions. [Official Loom capture modes](https://support.atlassian.com/loom/docs/use-looms-different-capture-modes/).
3. Put a small camera bubble in a corner that does not cover buttons, counters, or CRM evidence. Use your real camera for the most natural walkthrough. An avatar is optional presentation, never technical evidence.
4. Frame the page so **Test invalid submission**, **Apply corrected handler**, the valid-run button, and the three counters are readable together. Adjust browser zoom only as much as needed; do not shrink the text to fit everything.
5. Close unrelated tabs, disable distracting notifications, and hide developer tools. Keep the fictional/demo disclosure visible or add a small label: **Demo · synthetic lead · local CRM**.
6. Record a five-second test. Play it back. Verify the correct window, all edges, readable counters, working microphone, and a visible bubble. This catches the cropping problem encountered with the raw desktop capture.
7. Keep the same framing and bubble position across clips. Move the pointer deliberately and keep it away from the result after clicking.

## 5. Make the whole video: three clips, about 28 seconds

Record the clips separately. This lets you reset and rehearse the demonstration without rushing your introduction. Use your own name in place of `[Name]`. The narration is approximately 60 words; rehearse it to fit 25–30 seconds without speeding up your voice.

| Final time | What to show | What to say |
|---|---|---|
| 0–7 seconds | Alder homepage, with your small camera bubble | “Hi, I'm [Name]. I focus on conversion-tracking audits for Google Ads, GTM, and GA4.” |
| 7–20 seconds | `/audit`: broken blank submit → corrected handler → blank retest → valid synthetic lead | “In this demo, an invalid submit creates a false event. I switch to the corrected flow, then retest and verify one saved lead and one event.” |
| 20–28 seconds | Scroll to the real live evidence: matching CRM record, one canonical event, campaign comparison. Keep your bubble visible | “I check duplicate events and campaign data, too. Message me on Upwork to discuss your tracking.” |

The introduction states your focus. It does not say these platforms received this demo's conversions. If that focus does not accurately describe your services, replace the first sentence with the service you actually offer.

### Exact actions for the middle clip

Prepare `/audit` with all counters at zero and the valid-run button enabled. Start recording before the first click.

1. Hold the initial audit view for about one second.
2. Click **Test invalid submission**. Hold **False conversions: 1** for about two seconds.
3. Click **Apply corrected handler**, then **Test invalid submission**. Hold **Invalid requests blocked: 1**, **Confirmed lead events: 0** for about two seconds.
4. Click **Run synthetic valid lead through the real pipeline**. Wait for the actual API result; leave this wait in the recording.
5. Hold **Confirmed lead events: 1** and **New record · event emitted once** for at least two seconds.

The click sequence can take about 8–10 seconds after rehearsal. Give the middle clip up to 13 seconds for narration and readable holds. If the API takes longer, retain the genuine wait and shorten other narration or pauses. Never cut from an unconfirmed request directly to an unrelated success state.

### Prepare the closing clip

After the valid submission, scroll to the consultation/evidence area. Frame **Matched by submission ID**, canonical count `1`, and the CRM attribution comparison. Record the closing line there. You can record a separate duplicate-replay take if you want fuller portfolio footage, but do not cram every audit check into the introduction.

## 6. Edit and review

1. Join the three clips in order with simple cuts. Trim setup, silence, and navigation pauses; preserve the order of the tracking actions.
2. Keep total duration between 25 and 30 seconds. Prioritize readable proof over rapid cuts.
3. Add short captions matching the spoken words. A small **Demo / synthetic data** label is enough; avoid extra technical labels covering the counters.
4. Keep voice clear and consistent. Music is optional; omit it if it competes with the walkthrough. Avoid animated transitions, fake analytics screenshots, and artificial success badges.
5. Export a landscape video, preferably 1080p at the recorder's native 30 fps if available. Exporting the old 5 fps screenshot capture at 30 fps does not create a smoother live recording.
6. Watch the result once without sound: can you see the false event, corrected invalid check, and one successful lead? Then listen without looking: does the narration make sense?
7. Upload the finished video to YouTube, then add its YouTube URL to your Upwork profile's Video introduction field. Upwork's published instructions list **Find Work → Profile → + beside Video introduction**, and the type **Me talking about my skills and experience**. The layout may differ in your account. Disable monetization if it is enabled. Follow the current profile prompts before publishing. [Official Upwork upload and profile instructions](https://www.upwork.com/resources/self-introduction-video-script).

## 7. Final honesty check

- Fictional business and synthetic lead are disclosed.
- The repaired handler is demonstrated as a prebuilt corrected state, not a live code edit.
- The original false count remains visible; the correction prevents additional invalid events.
- Local CRM confirmation and a dataLayer push are described as local evidence.
- No claim says Google Ads received a conversion, GA4 accepted a key event, GTM tags fired, or Meta/Enhanced Conversions were verified.
- The final footage is a new live recording. The old raw desktop captures have crop/window-switching limitations and should not be used as the introduction footage.

Reference: `docs/v2-verification-report.md` contains the implementation and verification boundary for the current version.
