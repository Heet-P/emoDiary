# emoDiary — Project Documentation
### The AI-Powered Emotional Wellness Journal Built for India

---

## 1. What is emoDiary?

**emoDiary** is an intelligent emotional wellness platform that combines the intimacy of a private diary with the depth of AI-powered mental health support. It gives users a safe, always-available space to express their feelings — through writing or speaking — and translates those raw emotions into structured, actionable insights about their mental wellness journey.

Unlike clinical therapy apps that feel cold or detached, emoDiary speaks to users in their own language — literally and emotionally — with support for **Hindi, Hinglish, Gujarati and English**, making it one of the few emotional wellness platforms designed ground-up for the Indian user.

The core promise is simple: **You pour your heart out. emoDiary understands it, mirrors it back, and helps you grow.**

---

## 2. The Problem We Solve

### The Mental Health Crisis in India (Hidden in Plain Sight)

India has one of the world's largest populations with mental health conditions: **150+ million people** suffer from conditions needing active intervention. Yet less than 10% of them ever seek help. Why?

- **Stigma**: Seeing a therapist is still seen as a sign of weakness in most Indian communities.
- **Cost**: A single therapy session in urban India costs ₹1,500–₹4,000. Most Indians can't afford consistent sessions.
- **Availability**: India has approximately **0.3 psychiatrists per 100,000 people** — one of the worst ratios in the world.
- **Language Barrier**: The vast majority of mental health apps are English-only, excluding hundreds of millions of potential users.
- **Access Gap**: Tier 2 and Tier 3 cities have virtually zero access to licensed therapists.

emoDiary addresses all five barriers at once.

---

## 3. Core Features

### 3.1 AI-Powered Emotional Journal
Users write about their day, feelings, or anything on their mind. The journal is not a passive notepad — every entry is passed through an advanced **multi-label emotion classification model** (running on Llama via Groq's API) that:

- Generates a **primary emotion tag** (joy, sadness, anxiety, anger, etc.)
- Assigns **multiple contextual tags** (e.g., "lonely + nostalgic + hopeful")
- Writes a **detailed sentiment analysis report** interpreted in natural, human language
- Auto-generates a **title** for the entry based on the emotional theme

This turns a raw stream of consciousness into structured emotional data the user can revisit, search, and analyse over time.

### 3.2 Voice AI Therapy Sessions ("Talk")
This is emoDiary's most distinguishing feature. Users have a **real-time, voice-to-voice conversation** with an AI companion — not just a chatbot, but a trained emotional support entity powered by the **Llama model (Groq)** with a carefully crafted system prompt designed for empathetic, non-clinical, emotionally intelligent responses.

The talk flow works end-to-end:
- User speaks → audio is captured and transcribed using **Groq Whisper**
- Transcript is sent to the AI companion which generates a contextually aware response
- The text response is synthesized back into realistic speech using **Sarvam AI's TTS** — which natively supports Indian languages with proper accent and intonation
- A **custom animated avatar** on screen shows lip-sync animations in real-time, making the experience feel like talking to someone, not a machine

The system uses **Voice Activity Detection (VAD)** to automatically detect when the user has finished speaking and starts the response cycle — creating a natural, hands-free conversational loop.

Sessions can be optionally **converted and saved as journal entries**, where the entire conversation is summarised by AI and stored with emotion tags.

### 3.3 Custom Avatar System
Users can configure their AI companion's appearance (skin tone, hair color, head shape, accent color) and give them a name. This avatar appears during voice sessions with real-time lip-sync driven by audio amplitude analysis — a subtle but powerful feature that makes the interaction feel alive and personal.

### 3.4 Emotional Insights Dashboard
The insights page is a data visualization layer built on top of the journal and voice history. It shows:

- **Emotional trend charts** over time (7-day, 30-day views)
- **Mood distribution graphs** showing the proportion of different emotions
- **Therapist score** — an AI-computed score from 1–10 indicating whether the user's emotional state warrants professional attention
- **A streak and activity tracker** to gamify consistent journaling

### 3.5 Therapist Recommendations (Threshold-Based)
If a user's AI-computed therapist score crosses a defined threshold, the platform surfaces a **curated set of therapist cards** — real, associated mental health professionals — with their clinic name, specialization, and contact information. Each card includes a **referral discount code ("EmoDiary")** that patients can present at the clinic for a 15–20% discount on their first session.

This creates a bridge between the digital-first experience and real-world professional care when it's truly needed.

### 3.6 Multi-Language Support
The entire application is available in:
- **English**
- **Hindi (हिंदी)**
- **Hinglish** (the colloquial mix spoken by most urban Indians)
- **Gujarati (ગુજરાતી)**

Language can be switched mid-session. The AI's responses adapt to the chosen language, and the TTS voices are phonetically accurate for each Indian language. This alone makes emoDiary accessible to an audience that virtually no other mental health app reaches.

---

## 4. Technical Architecture

### 4.1 Frontend
Built with **Next.js** (App Router), TypeScript, and Tailwind CSS. The UI is designed with a warm, sage-green aesthetic — deliberately chosen to feel calm and non-clinical. Key technical decisions include:
- **Context API** for global language switching and authentication state
- A **glassmorphism/neobrutalist-inspired design system** across some UI components

### 4.2 Backend
The backend is a **FastAPI** (Python) server organized into clean, modular routers. Each domain — journals, chat, voice, analytics, subscription, profile — has its own dedicated router and service layer.

Key backend services:
- **`chat_service`**: Manages session lifecycle, message exchanges, and AI conversation history
- **`voice_service`**: Handles audio transcription (Whisper) and speech synthesis (Sarvam AI)
- **`emotion_service`**: Drives multi-label sentiment analysis using Llama
- **`analytics_service`**: Aggregates journal and session data into structured insights
- **`subscription_service`**: Tracks usage counts and enforces freemium limits
- **`razorpay_service`**: Handles payment order creation and cryptographic signature verification

### 4.3 Database (Supabase / PostgreSQL)
The database schema is built around 6 primary tables:
- **`profiles`**: User preferences, avatar config, subscription status, Razorpay customer data
- **`journal_entries`**: All journal content, AI emotion tags, sentiment reports, word counts
- **`chat_sessions`**: Session records with mode (voice/text), language, lifecycle timestamps
- **`chat_messages`**: Individual messages per session with role (user/assistant) and content
- **`emotion_records`**: Detailed emotion score records per journal/session for analytics
- **`user_settings`**: Per-user configuration (TTS voice, language preference, data retention)

Row-level security (RLS) is enforced at the database level — users can only access their own data.

### 4.4 AI Layer — Why Llama for Sentiment Analysis
**Llama (via Groq)** was chosen deliberately over simpler NLP classifiers for sentiment analysis because:

1. **Contextual nuance**: Fixed-label classifiers can only detect predefined emotions. Llama understands context — it can detect "suppressed grief underneath a cheerful exterior" or "anxiety disguised as humor."
2. **Multi-label intelligence**: Llama generates multiple layered emotion tags in a single pass, not just a single classification.
3. **Narrative understanding**: The model writes a full sentiment report in natural language, not just labels — this is what users read and connect with.
4. **Speed via Groq**: Groq's hardware inference (LPU-based) gives Llama inference at near-human-readable output speeds, making journal analysis feel instant rather than laggy.

A traditional transformer like BERT would give you a score from 0-1 on predefined labels. Llama gives you a story.

### 4.5 Voice Pipeline — Sarvam AI
**Sarvam AI** is India's leading multilingual AI provider for Indian languages. It was chosen for TTS because:

- It produces **natural-sounding Hindi/Gujarati/Hinglish speech** that doesn't sound robotic
- It handles the prosody of Indian languages correctly (natural stress, intonation, and pauses)
- Global TTS providers like Google or ElevenLabs produce Indian language audio that sounds clearly foreign

This is a critical UX decision — hearing your emotional reflection spoken back in a voice that feels natural to you is deeply personal.

### 4.6 Payments — Razorpay
**Razorpay** was selected as the payment gateway because it is the dominant Indian payments platform with native support for:
- **UPI** (the primary payment method for most Indians)
- **NetBanking**, Credit/Debit Cards, Wallets
- **Subscriptions and recurring billing** infrastructure
- Full INR support with Indian compliance
- Easy integration with minimal KYC friction for test-to-production mode

---

## 5. Business Model

### 5.1 Freemium Tier
Every user gets a meaningful free experience:
- **14 journal entries** per month
- **4 voice therapy sessions** per month

14 entries is exactly 2 weeks of daily journaling — enough for a user to build a habit and see real value before hitting the limit. 4 voice sessions is enough for a user to form a genuine connection with their AI companion before being asked to pay.

### 5.2 Premium Tier
#### Monthly Plan — ₹299/month
- Unlimited journal entries
- Unlimited voice chat sessions

#### Yearly Plan — ₹2,499/year (~₹208/month)
- Everything in monthly
- ~30% savings vs monthly billing
- Ideal for committed users building a long-term emotional wellness practice

### 5.3 Therapist Partnership Revenue (Referral Model)
emoDiary has a B2B2C component: partnered therapists and clinics are listed on the platform. When users above the clinical threshold visit a partner clinic using the referral code, **the clinic provides a discount and emoDiary earns a referral fee**. This model:
- Monetizes high-intent, high-need users without being predatory
- Creates a legitimate pipeline for mental health professionals
- Builds institutional trust in the platform

### 5.4 Pricing Philosophy
₹299/month is the price of:
- One cup of coffee at a café, twice a week
- Less than 20% of the cost of a single therapy session

This pricing makes mental health support accessible at a scale that professional therapy never could. It's not competing with therapy — it's the accessible layer underneath it.

---

## 6. Unique Selling Propositions (USPs)

### 🇮🇳 USP 1: Truly Indian-First
- Hindi, Hinglish, Gujarati support, not just English
- Indian language TTS that sounds human
- Razorpay with UPI support — payments work the way Indians pay
- Understanding of Indian cultural context in AI responses (joint family stress, exam pressure, career expectations)

### 🧠 USP 2: The Only App That Listens — Literally
No other Indian emotional wellness app offers **real-time voice conversation** with an AI companion that speaks back. Writing is powerful. But speaking your feelings out loud — and having them reflected back in your language — is a fundamentally different and more cathartic experience.

### 📊 USP 3: Emotion Intelligence, Not Just Mood Tracking
Most wellness apps ask you to tap an emoji. emoDiary uses a language model to conduct deep sentiment analysis. Users don't enter their mood — they express themselves freely, and the AI understands the emotional subtext automatically.

### 🩺 USP 4: Triage Without stigma
The therapist score + referral card system allows users who need professional help to be gently guided toward it — without being told "you're sick, see a doctor." It's a soft, dignified bridge that respects Indian cultural sensitivities around mental health stigma.

### 💪 USP 5: Full Offline Resilience Design
The platform's architecture is designed to be responsive even in lower-bandwidth environments. The lightweight frontend, server-side rendering, and streamlined API payloads mean it works acceptably even in Tier 2/3 city networks.

---

## 7. Target User Segments in India

### Segment 1: Urban Young Professionals (22–32 years)
- High-stress careers, relationship transitions, career pressure
- Comfortable with AI tools
- Can afford ₹299/month
- In metros and Tier 1 cities
- Speak Hinglish naturally

### Segment 2: College Students (18–24 years)
- Exam anxiety, social comparison, identity pressure
- Heavy mobile users
- Benefit most from the free tier to build habit
- Represent the highest conversion path to paid if value is demonstrated early

### Segment 3: Women in Tier 2/3 Cities
- Often have no access to a therapist
- May not feel safe journaling using paper at home
- Need privacy + convenience
- Hindi and regional language support is critical for this segment

### Segment 4: Parents (30–45 years)
- Caregiver burnout, marital stress, existential concerns
- Not native tech users but can use voice features naturally
- Therapist recommendation feature directly valuable

---

## 8. Market Context

| Metric | Value |
|--------|-------|
| India's mental health market size (2024) | ~$2.2 Billion |
| CAGR of digital mental health in India | ~22% |
| Urban Indians open to AI-based mental wellness | ~65% |
| Psychiatrists per 100,000 Indians | 0.3 |
| Average cost of therapy session | ₹1,500–₹4,000 |
| emoDiary Premium cost per session equivalent | ~₹75 |

---

## 9. Data Privacy & Ethics

- All journal entries and voice sessions are stored with row-level security — no data is shared across users
- Users can control data retention via settings (auto-delete after N days)
- Voice audio is processed ephemerally — raw audio is never stored, only the transcript
- The AI companion is explicitly not a licensed therapist and this is communicated clearly
- The therapist referral only triggers above a defined clinical threshold — it is never pushed aggressively

---

## 10. Current State of the Product

| Feature | Status |
|---------|--------|
| Multi-language journaling with AI emotion analysis | ✅ Complete |
| Voice therapy sessions (VAD + TTS) | ✅ Complete |
| Custom avatar with lip sync | ✅ Complete |
| Emotional insights dashboard | ✅ Complete |
| Therapist score + recommendation cards | ✅ Complete |
| Therapist referral code ("EmoDiary") | ✅ Complete |
| Freemium model (14 journals / 4 voice sessions) | ✅ Complete |
| Razorpay Payment integration (test mode) | ✅ Complete |
| Pricing page with Monthly & Yearly plans | ✅ Complete |
| Upgrade prompts and paywall UI | ✅ Complete |
| Production deployment readiness (Supabase, Groq, Sarvam) | ✅ Complete |

---

## 11. What Makes emoDiary Worth Talking About

emoDiary is not another mood tracker with pretty charts. It is an attempt to **democratize emotional wellness for India** — a country that desperately needs mental health infrastructure but lacks it at a systemic level.

It does this by:
1. Meeting users where they are — in their language, on their device
2. Making the experience feel warm and personal, not clinical
3. Providing genuine AI intelligence (not just an emoji picker)
4. Knowing when to step back and direct someone to a real human professional
5. Pricing it at a point where the cost is never the barrier

If just 1% of the 150 million Indians who need mental health support used emoDiary, that's 1.5 million people gaining access to a tool they wouldn't have had otherwise.

That is the mission. That is the product.

---

*Document prepared: March 2026 | emoDiary v1.0 | Built for Reckon 7.0*
