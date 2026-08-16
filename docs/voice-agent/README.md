# Rent With Heldy — ElevenLabs Turo Voice Agent Pack

Prepared and source-checked on August 15, 2026.

This pack has three different jobs:

1. `heldy-voice-recording-script.md` is the script Heldy reads aloud. It trains the sound, rhythm, warmth, and emotional range of the cloned voice.
2. `turo-agent-system-prompt.md` tells the agent how to behave during calls.
3. `turo-agent-knowledge-base.md` gives the agent approved Rent With Heldy and Turo information.

Reading Turo policies into a microphone does not teach the agent those policies. The recording trains the voice; the system prompt and knowledge base train the behavior and answers.

## Recommended setup

- Record the voice script in a quiet, soft room with one microphone and one mic position.
- Use the same natural voice customers already hear from Heldy. Do not perform or exaggerate.
- Record each numbered section as a separate clean file. If a line is flubbed, pause, start the sentence again, and remove the failed take before uploading.
- Avoid background music, noise removal that creates artifacts, speakerphone audio, and multiple speakers.
- For an ElevenLabs Professional Voice Clone, treat 30 minutes of clean audio as the minimum. ElevenLabs recommends at least one hour and says two to three hours can produce a stronger clone. Use this script as the first consistent recording set, then add more clean speech in the same microphone setup and conversational style if possible.
- Upload the system prompt in the ElevenLabs agent prompt field.
- Upload the knowledge-base file as a knowledge-base document. Enable RAG if the document or future fleet/policy documents become large.
- Keep the cloned voice private unless Heldy deliberately chooses to share it.
- If calls are recorded or stored, begin with the recording disclosure in the system prompt and confirm the final language with counsel. Florida law generally requires all parties' prior consent to interception of a private call.

## Before launch — owner confirmations

Replace or confirm these facts before the agent takes live calls:

- All-Star Host status is currently active.
- “1,400+ five-star reviews” is current and defensible.
- The current customer phone number is `+1 (786) 505-9330`.
- The current customer email is `rentwithheldy@gmail.com`.
- Tolls are passed through with no Rent With Heldy markup.
- Every listed vehicle actually supports contactless pickup.
- Current delivery fees, service hours, after-hours workflow, pet-friendly vehicles, toll transponder details, and the person or number used for human escalation.
- Whether ElevenLabs calls will be recorded, transcribed, or both, and the approved consent disclosure.

## Launch test set

Call the agent and test at least these scenarios:

- New guest landing at FLL with two adults, two children, and luggage.
- Existing guest whose flight is delayed.
- Guest asking to pick up curbside at MIA.
- Guest asking if their spouse may drive.
- Guest asking to pay Heldy through Zelle or Venmo.
- Guest running 45 minutes late and requesting an extension.
- Flat tire, dead battery, and undriveable accident.
- Guest reporting a dashboard warning light.
- Guest asking for a refund, fee waiver, or damage decision.
- Guest asking about a car that the agent cannot confirm is available.
- Angry guest who wants a human immediately.
- Spanish-speaking guest, if multilingual calling will be enabled.

The agent passes only if it stays concise, never invents availability or pricing, routes Turo-controlled actions back through Turo, and transfers emergencies or disputes correctly.
