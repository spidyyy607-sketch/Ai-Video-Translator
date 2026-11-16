# AI Video Translator — Updated MVP Implementation Plan

A simple, low-cost Android Jetpack Compose application and serverless Python backend that translates uploaded MP4/MOV/WebM videos (or accessible direct video URLs) into Hindi, English, Hinglish, and 20+ global languages with synchronized AI Voice or consent-verified Voice Cloning, background music preservation, and real MP4 preview/download.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Updated MVP Guardrails, Cost Estimate & Required API Keys (Before Coding)**
>
> All 10 requested revisions have been incorporated into this plan:
> - **Primary Input**: Direct gallery video upload (via zero-permission Android Photo Picker). Video URL input supports direct, legally accessible `.mp4`/`.mov`/`.webm` links only (explicitly blocking HTML streaming pages/DRM links).
> - **MVP Cost-Control Limits**: Enforced on **both** Android (pre-upload) and Backend: **Max 50 MB file size** and **Max 120 seconds (2 minutes)** duration.
> - **Zero Fake Behavior**: No demo/mock translations or fake downloads. Missing server URLs or API keys surface clear setup instructions.
> - **Auto-Cleanup Security**: Isolated per-job `/tmp` directories and temporary cloned voices are automatically deleted immediately after download or on job expiration/failure.

### Estimated Monthly Costs & Required API Keys

| Component | Service & Free Tier | Estimated Cost per 1-Min Video | Monthly MVP Cost | Required Key / Credential |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Hosting** | **Google Cloud Run** (2M requests, 180k vCPU-sec, 360k GiB-sec/mo free) | ~$0.00 (within free tier) | **$0 / month** (scales to $0 idle) | Google Cloud account (free tier) |
| **Speech Detection, STT & Translation** | **Gemini API** via Google AI Studio (Free tier rate-limited; Pay-as-you-go Flash is pennies/hr) | ~$0.00 (Free Tier) or <$0.01 | **$0 / month** (Free Tier) | `GEMINI_API_KEY` *(Mandatory)* |
| **AI Voice (Option 1)** | **Google Cloud Text-to-Speech** (4M Standard / 1M WaveNet chars/mo free) | ~$0.00 (~900 chars/min) | **$0 / month** (Free Tier) | Google Cloud TTS enabled on project *(Mandatory for AI Voice)* |
| **Voice Cloning (Option 2)** | **ElevenLabs Instant Voice Cloning** (`eleven_multilingual_v2`) | ~$0.15–$0.25 / min | **$5 / month** *(ElevenLabs Starter plan required for Instant Voice Cloning API)* | `ELEVENLABS_API_KEY` *(Optional — needed only for Clone Voice)* |
| **Media Engine & Temp Storage** | **FFmpeg** + Cloud Run ephemeral `/tmp` RAM-backed disk | $0.00 | **$0 / month** | None |
| **Optional Quick On-Device Mode** | **Firebase AI Logic** (`gemini-3.8-flash`) + Android **Media3 Transformer** | $0.00 (Spark Free Tier) | **$0 / month** | Provisioned via AI Studio Firebase Setup |

> [!NOTE]
> **Total Expected Cost for MVP**: **$0/month** for full AI Voice translation (Hindi, English, Hinglish, and 20+ languages) using Google Cloud Run + Gemini API + Google Cloud TTS free tiers; **~$5/month** if you enable ElevenLabs Instant Voice Cloning.

---

## 1. Overview & Core Concept

- **What It Does**: Lets any non-technical user pick a short video from their phone gallery (up to 50 MB / 2 minutes), preview it, pick a target language (**Hindi**, **English**, **Hinglish**, or 20+ others), choose **AI Voice** (Male/Female with audio preview) or **Clone Voice** (with speaker consent verification), monitor real-time dubbing progress, and preview/download the final MP4 with preserved background music.
- **Target Audience / Persona**: Beginners, creators, and educators looking for a simple, affordable, reliable mobile dubbing tool without complex timelines or GPU servers.
- **Key Value**: Beginner-friendly architecture where one clean Python FastAPI service handles FFmpeg extraction, Gemini speech/translation, TTS/cloning, audio ducking, and auto-deletion—with zero external storage bucket setup.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Server Connection Header**: A top status pill shows *Server Connected* (with active badges for AI Voice & Voice Cloning) or *Configure Server / Quick Mode*. Tapping opens a clean **Backend Setup & Diagnostics** sheet containing the Server URL field, a **Test Connection** button, live key status indicators, and a beginner step-by-step Cloud Run guide.
  2. **Step 1 — Direct Video Upload (Primary) & Link Fallback**:
     - Hero **Upload Video from Gallery** button launching the zero-permission Android Photo Picker (`MP4`, `MOV`, `WebM`).
     - Immediate client-side validation of **size (<= 50 MB)** and **duration (<= 120s)** before any upload starts, showing clear video metadata chips (`Duration`, `Size`, `Resolution`).
     - Secondary expandable **Paste Direct Video Link** field that checks for valid direct media URLs and explains clearly if a social/streaming webpage URL cannot be legally/technically fetched, guiding the user back to direct upload.
     - Embedded **Media3 ExoPlayer** preview of the selected video.
  3. **Step 2 — Source & Target Languages**:
     - **Original Language**: *Auto-Detect* by default (with optional manual language picker).
     - **Target Language**: Prominent quick-select pills for **Hindi**, **English**, and **Hinglish** (conversational Hindi-English blend), plus a searchable modal sheet for 20+ additional languages.
  4. **Step 3 — Two Clear Voice Cards**:
     - **Option 1 — AI Voice Card**: Select **Male** or **Female** voice with a working **Preview Voice** audio button playing a short sample in the selected target language.
     - **Option 2 — Clone Voice Card**: Choose between *Extract speaker sample from video* or *Upload audio sample (MP3/WAV/M4A)*, gated by a mandatory **Speaker Consent Verification** checkbox and attestation ("I confirm I have the speaker's explicit permission to clone their voice"). Shows a clear notice if the connected backend does not have `ELEVENLABS_API_KEY` configured.
  5. **Step 4 — Translate Video & Live Progress**:
     - Prominent **Translate Video** CTA button (disabled with helpful reason until video, valid mode, and consent—if cloning—are satisfied).
     - Real stage-by-stage progress tracker: *Uploading -> Extracting Audio -> Detecting & Translating Speech -> Generating Dubbed Voice -> Mixing Background Music & Exporting MP4*, plus a **Cancel** button and live **Detected Language + Transcript Preview**.
  6. **Step 5 — Translated MP4 Preview, Download & Reset**:
     - Play the dubbed MP4 inside **Media3 ExoPlayer** with play/pause/seek and transcript synchronization.
     - **Download MP4** button saving directly to `Downloads/AIVideoTranslator` via Android `MediaStore` (with real progress and system confirmation).
     - **Translate Another Video** button that cleans up local temp state for a fresh run.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Studio Midnight** — modern, dark blue and purple creator studio interface with clean visual hierarchy and zero clutter.
  - *Color Palette & Mood*:
    - Deep Midnight Navy canvas (`#070B18`) with subtle indigo-violet top atmospheric glow.
    - Layered Slate-Indigo surfaces (`#10162B` primary cards, `#17203D` nested controls, `#263159` borders).
    - Primary Accent: Electric Violet (`#7C4DFF`) -> Indigo (`#536DFE`) on primary actions.
    - Secondary Accent: Luminous Sky Blue (`#38BDF8`) for active progress indicators, language chips, and audio waveforms.
    - Semantic Feedback: Emerald (`#22C55E`) for ready/downloaded states, Amber (`#F59E0B`) for API key/limit notices, Coral (`#EF4444`) for honest errors.
  - *Typography & Hierarchy*: Local bundled Google Fonts (`Plus Jakarta Sans` for bold display headers, `Inter` for clean UI & bilingual text, `JetBrains Mono` for durations, file sizes, and URLs).
  - *Component Styling & Layout*: Material 3 dark theme, `enableEdgeToEdge()`, safe area insets, minimum `48.dp` touch targets, `20.dp` rounded studio cards, and adaptive `WindowSizeClass` support (single-column on phones, split controls + preview pane on tablets/foldables).

- **Interactive Feedback & Motion**:
  - Spring transitions and `AnimatedVisibility` between setup, processing, and output states.
  - Custom Compose `Canvas` animated audio bars during voice preview and dubbing progress.
  - Transparent error cards with exact actionable guidance (never fake progress bars or dummy download buttons).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Beginner-Friendly FastAPI + FFmpeg Container on Cloud Run**
  - *Chosen Approach*: Single-service Python FastAPI backend with bundled FFmpeg deployed via one `gcloud run deploy` command.
  - *Why*: Eliminates server administration, background worker queues, and paid S3/GCS storage buckets while scaling to zero ($0 idle cost).
  - *Alternatives Considered*: Multi-container Redis + Celery + S3 + GPU VM (too expensive and complex for an MVP).

- **Decision 2 — Gemini Multimodal + Google Cloud TTS + Consent-Gated ElevenLabs**
  - *Chosen Approach*: Gemini extracts timestamped dialogue, auto-detects source language, and translates meaning-for-meaning (including natural conversational Hinglish). Google Cloud TTS generates free-tier Male/Female AI voices; ElevenLabs generates cloned voices only when `consent_confirmed=true`.
  - *Why*: Minimizes paid services (AI Voice MVP runs completely on free tiers) while still delivering genuine speaker voice cloning when requested.
  - *Alternatives Considered*: Self-hosted Whisper + Coqui/XTTS (requires expensive GPU hosting).

- **Decision 3 — Timestamped Segment Sync & FFmpeg Background Music Ducking**
  - *Chosen Approach*: Each translated segment is synthesized individually, lightly time-stretched (`atempo` clamped between `0.85x` and `1.25x`) to fit its original speech window, positioned via `adelay`, and mixed over the original audio track with automatic speech-window ducking (lowering original dialogue/music during dubbed lines while keeping background music & SFX audible in between).
  - *Why*: Preserves background music and keeps dubbed audio aligned with video lip/scene timing without slow neural stem separation.
  - *Alternatives Considered*: Full vocal stem separation (Demucs) — exceeds free-tier CPU/RAM limits on Cloud Run.

- **Decision 4 — Automatic Ephemeral Cleanup & Dual Mode Transparency**
  - *Chosen Approach*: Backend writes per-job files only in `/tmp/jobs/{job_id}/`, deletes them immediately after the MP4 is downloaded (or via a 15-minute TTL reaper + `finally` block on error), and immediately deletes temporary ElevenLabs cloned voices after audio synthesis. On Android, an optional **Quick On-Device Mode** (Firebase AI Logic + Media3 Transformer) is available for small gallery videos if no backend URL is entered yet, while clearly labeling URL input & Voice Cloning as Backend Server features.
  - *Why*: Protects user privacy, prevents disk leaks, avoids surprise cloud bills, and ensures the app works honestly out of the box.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ANDROID CLIENT (Jetpack Compose)                  │
│                                                                         │
│  ┌──────────────────────┐   ┌───────────────────┐   ┌────────────────┐  │
│  │ Studio Dashboard UI  │──▶│ Translator        │──▶│ Media3         │  │
│  │ • Photo Picker (50MB │   │ ViewModel         │   │ ExoPlayer      │  │
│  │   / 2min Guardrail)  │   │ • Size/Dur Check  │   │ Preview &      │  │
│  │ • Optional Link Check│   │ • Job Polling     │   │ MediaStore     │  │
│  │ • Hindi/Eng/Hinglish │   │ • Consent Gate    │   │ MP4 Export     │  │
│  │ • AI vs Clone Cards  │   │ • Server Settings │   │                │  │
│  └──────────────────────┘   └─────────┬─────────┘   └────────────────┘  │
│                                       │                                 │
│                    ┌──────────────────┴──────────────────┐              │
│                    ▼ (Primary: Custom Backend URL)       ▼ (Optional)   │
│         ┌─────────────────────┐               ┌──────────────────────┐  │
│         │ Retrofit / OkHttp   │               │ Quick On-Device Mode │  │
│         │ Multipart Upload &  │               │ Firebase AI Logic +  │  │
│         │ Stream MP4 Download │               │ Media3 Transformer   │  │
│         └──────────┬──────────┘               └──────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────────┘
                     │ HTTPS (No Secrets in APK)
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             LOW-COST BACKEND (FastAPI + FFmpeg on Cloud Run)            │
│                                                                         │
│  ┌──────────────────────────┐    ┌───────────────────────────────────┐  │
│  │ REST API & Cleanup Guard │───▶│ Per-Job Temp Pipeline (/tmp/jobs) │  │
│  │ • GET  /health           │    │ 1. Validate <=50MB & <=120s       │  │
│  │ • GET  /voices/preview   │    │ 2. FFmpeg Extract Audio + Sample  │  │
│  │ • POST /jobs/translate   │    │ 3. Gemini Auto-Detect + Timestamp │  │
│  │ • GET  /jobs/{id}        │    │    Transcript + Hinglish/Target   │  │
│  │ • GET  /jobs/{id}/output │    │ 4. Google TTS OR Consent-Gated   │  │
│  │   (Auto-deletes on fetch │    │    ElevenLabs Clone (+ delete ID) │  │
│  │    & 15-min TTL sweep)   │    │ 5. FFmpeg Sync + Duck + Mux MP4   │  │
│  └──────────────────────────┘    └───────────┬───────────────────────┘  │
└──────────────────────────────────────────────┼──────────────────────────┘
                                               │ Server Env Vars Only
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
              ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
              │   Gemini API    │    │ Google Cloud TTS │    │  ElevenLabs API  │
              │ (Free Tier STT  │    │ (Free Tier 1M-4M │    │ (Consent-Gated   │
              │  & Translation) │    │  Chars/Mo AI Vox)│    │  Clone + Cleanup)│
              └─────────────────┘    └──────────────────┘    └──────────────────┘
```

### Data Model & State

- **VideoInput**: `GalleryVideo(uri, name, durationMs, sizeBytes, mimeType)` (validated `<= 50 MB` and `<= 120_000 ms`) or `DirectUrlVideo(url)` (validated HTTP/HTTPS direct video stream).
- **LanguageSelection**: `sourceLanguage` (*Auto-Detect* or specific language) and `targetLanguage` (top-pinned **Hindi**, **English**, **Hinglish**, plus 20+ global/regional languages).
- **VoiceChoice**:
  - `AiVoice(gender: Male | Female)` with real `/voices/preview` audio clip playback.
  - `CloneVoice(sampleMode: ExtractFromVideo | UploadedAudio, sampleUri, consentConfirmed: Boolean)` — blocked unless `consentConfirmed == true`.
- **ServerSettings** (DataStore): Saved `serverUrl`, active mode (`BackendServer` vs. `QuickOnDevice`), and last `/health` capability flags (`geminiConfigured`, `ttsConfigured`, `voiceCloningConfigured`, `maxFileSizeMb`, `maxDurationSeconds`).
- **TranslatorUiState**: Sealed states (`Ready`, `Uploading`, `Processing(jobId, stage, progress, detectedLanguage, transcriptPreview)`, `Completed(localMp4Uri, detectedLanguage, segments, fileName)`, `Error(title, details, actionHint)`).

### Interactive Component & State Mapping

- **Upload Video Button**: Opens `PickVisualMedia(VideoOnly)` -> inspects size & duration via `ContentResolver` + `MediaMetadataRetriever` -> rejects files > 50 MB or > 120s with an immediate clear message; otherwise loads `ExoPlayer` preview.
- **Video Link Input**: Validates URL syntax -> runs `HEAD` check (via backend or client check) -> rejects HTML/DRM pages cleanly and highlights direct upload.
- **Voice Cards & Preview**: Tapping **Preview** on AI Voice streams/plays a real synthesized sample in the chosen target language & gender; selecting **Clone Voice** displays the consent checkbox and optional audio clip picker (`OpenDocument`).
- **Translate Video Button**: Verifies inputs & consent -> uploads video + config to `POST /jobs/translate` -> polls `GET /jobs/{id}` -> streams completed MP4 from `GET /jobs/{id}/output` to app cache (triggering backend temp cleanup) -> opens the **Translated MP4 Preview** player with **Download MP4** (`MediaStore.Downloads`) and **Translate Another Video** actions.
