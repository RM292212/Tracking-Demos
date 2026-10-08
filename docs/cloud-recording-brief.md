# Cloud recording brief: 30-second tracking audit

## Required deliverable

Record the actual Alder V2 application in a cloud-hosted browser. Deliver an MP4 exactly 30.00 seconds long, at 1920x1080 and 30 fps (900 frames), using a real continuous screen/browser capture. Verify duration, dimensions, frame count, and playability with media tools. Target H.264 with yuv420p for broad compatibility, if the cloud encoder supports it.

This is screen footage for an Upwork introduction, not a complete presenter video. Do not generate an avatar, narration, fake analytics UI, or animated reconstruction. Do not reuse/upscale the previous local 5 fps frame assembly. Natural cursor movement and readable holds should make the actual audit understandable.

## Source and boundaries

- Repository: https://github.com/RM292212/Tracking-Demos.git
- Branch: codex/tracking-demo-v2
- Verified application revision before recording documentation: 4e9da56.
- Read `docs/v2-verification-report.md` and `docs/upwork-audit-recording-guide.md`.
- Preserve tracked application code and all six defect scenarios. Capture helpers/output may live outside the application.
- Use only synthetic inputs. Never copy local `.env` files, CRM records, credentials, or unrelated personal files into the cloud.
- Configure external Google identifiers only if the human confirms a dedicated test property/container. Otherwise leave them unset and report that boundary. Local CRM/dataLayer evidence remains valid; GTM loading or configured IDs never prove tag firing.
- No GA4 receipt/key-event, Google Ads receipt, Meta, or Enhanced Conversions proof currently exists. Keep those limitations visible and do not fabricate them.
- The broken mini example uses the excluded `form_id: alder_consultation_broken`. The corrected flow uses `alder_consultation` and emits `demo_lead_success` after matching API confirmation.
- “Apply corrected handler” activates the prebuilt repaired implementation. Do not describe this as live code editing.

## Execution

1. Clone the specified branch and inspect the repository. Confirm the Alder homepage, `/audit`, BusinessLeadForm, event contract, and receipt/deduplication behavior exist. If the branch is unavailable, stop and report the actual access problem; do not capture an older version.
2. Install from the lockfile. Start the real Next.js application in the cloud. Use a build/production server for clean footage if possible; test-only reset endpoints require development mode. Do not weaken that guard.
3. Set up a real graphical Chromium session on a cloud display, or a supported native browser-video capture. Verify recording dependencies and actual capture frame rate before claiming 30 fps. An Xvfb display plus native FFmpeg capture is one possible route where available. Use the environment's approved browser tools/workflow.
4. The primary cloud agent must personally drive and verify the browser. Rehearse the complete flow below before recording. Check API responses, CRM readback, dataLayer payload, duplicate suppression, and console/network behavior. Do not rely solely on source files or helper-generated assertions.
5. Open this URL in a fresh tab: `http://127.0.0.1:3000/?utm_source=google&utm_medium=cpc&utm_campaign=office_demo&utm_term=office_cleaning&utm_content=demo_ad&gclid=DEMO-CLICK-NOT-REAL`.
6. Navigate through **Verification details** to `/audit`. Confirm campaign context persists. Use **Start another request** if a prior receipt appears. Begin the recorded repair demonstration with counters zero and the valid-run button enabled.
7. Use consistent framing and purposeful cursor movement. Keep the important buttons/counters visible together, then scroll deliberately to CRM/payload evidence. Avoid recording terminals, build logs, private tabs, development warnings, or unrelated desktop windows.
8. Record the actual successful workflow. If timing varies, capture longer and edit genuine source ranges to exactly 30 seconds. Modest speed-up of navigation/setup is allowed. Preserve action order, visible API wait, and the relationship between a particular submission and its proof. Do not retime counts independently, animate fake cursor actions, or substitute unrelated success frames.
9. Review the entire final video and representative frames, including the failure, corrected blank test, valid success, duplicate replay, campaign comparison, and payload. Verify no clipping or unreadable text. Return the file, metadata, verification notes, and any actual limitation.

## Proposed 30-second screen story

| Time | Actual screen action and evidence |
|---|---|
| 0-3s | Show the fictional business homepage, then navigate through Verification details. Campaign context comes from the tagged landing. |
| 3-7s | In the blank mini form, click Test invalid submission once. Hold on False conversions: 1; confirmed events: 0. Explain the root cause visually through the existing click-before-confirmation text. |
| 7-11s | Click Apply corrected handler, then Test invalid submission again. Hold on Invalid requests blocked: 1 and confirmed events still 0. The historical false count remains 1. |
| 11-16s | Click Run synthetic valid lead through the real pipeline. Retain the actual API wait. Hold on New record / event emitted once and confirmed event count 1. |
| 16-20s | Scroll to the evidence panel. Show matching CRM submission ID and canonical dataLayer count 1. |
| 20-24s | Click Replay same request to demonstrate duplicate protection. Show the existing record / suppressed duplicate result and count still 1. |
| 24-27s | Show matching source google, campaign office_demo, and explicitly fictional click ID in the saved CRM attribution. |
| 27-30s | Expand Inspect actual canonical event payload. Frame demo_lead_success, alder_consultation, submission ID, and the visible local-verification boundary. Hold long enough to read the event name. |

Adjust framing/rehearsal before the final take if an action requires more time. The deliverable is exactly 30 seconds; the record of actual verification can be longer.

## Required final evidence

- Exact media duration 30.00s; resolution; actual capture/output fps; decoded frame count.
- Actual successful lead API response and same-ID CRM readback.
- Exactly one accepted canonical event after success; zero additional accepted events on duplicate replay.
- Broken diagnostic event is distinguished from the accepted conversion and produces no lead request.
- Preserved synthetic campaign context agrees with the saved CRM record.
- Browser console/network limitations and external platform boundaries stated plainly.
- A downloadable final MP4 and a still showing the genuine verified result.

If cloud browser/capture access, source access, or native recording support is missing, report the concrete blocker. Do not claim the recording succeeded or replace it with invented UI or recycled low-fps footage.
