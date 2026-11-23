# KAIRO OS --- Model Upgrade Roadmap

**Purpose:** Integrate the locally downloaded `gemma-4-E4B-it-MLX-4bit`
into KAIRO as an additional local model, while preserving the existing
architecture and the ability to use other models and runtimes.

**Status:** Proposed roadmap\
**Date:** 19 November 2026

------------------------------------------------------------------------

## 1. Objective and guiding decision

This is a model-integration milestone, not a rewrite of KAIRO.

**KAIRO must not become dependent on LM Studio or Ollama.** They are
model runtimes/providers. KAIRO's backend should communicate with them
through a provider abstraction and Model Broker. The frontend should
continue communicating with KAIRO's backend, never directly with model
runtimes.

Intended direction:

``` text
KAIRO Frontend
      |
KAIRO Backend
      |
  Model Broker
      |
      +-------------------+
      |                   |
 LM Studio              Ollama
      |                   |
 Gemma 4 E4B           Qwen Coder
```

This is a target direction, not a claim about the current code. First
inspect the repository. Extend existing abstractions where possible; do
not invent filenames, routes, endpoints, or configuration structures.

## 2. Known environment

  Item                     Known information
  ------------------------ ------------------------------------
  Computer                 MacBook Pro 2021, Apple M1 Pro
  Unified memory           16 GB
  Storage                  1 TB
  Operating system         macOS Tahoe
  Frontend                 React + Vite
  Backend                  Node.js + Express
  Language                 JavaScript ES Modules
  Database                 SQLite
  Existing local runtime   Ollama
  Existing model family    Qwen 2.5, including a coding model
  New model                `gemma-4-E4B-it-MLX-4bit`
  New runtime              LM Studio
  Proposed local API       `http://localhost:1234/v1`

The exact installed model path, API identifier, runtime settings, and
current KAIRO configuration must be verified.

**Memory note:** Model download size is not total runtime memory use.
Weights, context/KV cache, runtime overhead, macOS, and other
applications consume unified memory. Measure actual memory pressure and
swap during tests.

## 3. Roadmap overview

  -----------------------------------------------------------------------
  Stage                   Milestone               Exit condition
  ----------------------- ----------------------- -----------------------
  0                       Verify local Gemma      Model loads and
                          installation            responds in LM Studio

  1                       Verify local API        Local HTTP request
                                                  returns a response

  2                       Benchmark Gemma against Results recorded;
                          Qwen                    initial model roles
                                                  chosen

  3                       KAIRO reconnaissance    Actual model request
                                                  flow and extension
                                                  points documented

  4                       Add LM Studio provider  Backend can call Gemma
                                                  without breaking Ollama

  5                       Model Broker            Model selection routes
                          integration             through the agreed
                                                  architecture

  6                       Streaming and           Both providers work
                          regression tests        reliably in KAIRO

  7                       Configuration and       Setup and model
                          documentation           configuration are
                                                  reproducible

  8                       Release                 Tests pass, changes
                                                  reviewed and committed
  -----------------------------------------------------------------------

Complete stages in order unless reconnaissance demonstrates a reason to
adjust them.

------------------------------------------------------------------------

## 4. Stage 0 --- Verify the local Gemma installation

**Purpose:** Confirm that the downloaded model is present, loadable, and
usable independently of KAIRO.

Tasks:

1.  Open LM Studio.
2.  Locate `gemma-4-E4B-it-MLX-4bit`.
3.  Load the model.
4.  Test it with ordinary prompts in LM Studio.
5.  Record load errors, warnings, and unusual latency.
6.  Observe macOS Memory Pressure and swap while it is loaded.

**Exit condition:** The intended model is identified, loads
successfully, produces coherent responses, and runs comfortably enough
to continue testing.

Do not change KAIRO code at this stage.

## 5. Stage 1 --- Verify the LM Studio local API

LM Studio commonly exposes an OpenAI-compatible API at
`http://localhost:1234/v1`. Confirm the actual host, port, and model
identifier in LM Studio.

### 5.1 List available models

``` bash
curl http://localhost:1234/v1/models
```

Confirm that the response includes the loaded model or an available
model identifier.

### 5.2 Test a chat completion

Replace `YOUR_EXACT_MODEL_ID` with the identifier returned by the models
endpoint:

``` bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_EXACT_MODEL_ID",
    "messages": [
      {
        "role": "user",
        "content": "Explain what a model broker does in a personal intelligence operating system."
      }
    ],
    "temperature": 0.7,
    "stream": false
  }'
```

Record the API host/port, model identifier, success or error,
approximate response time, and any unsupported parameters.

**Exit condition:** A local API request successfully produces a Gemma
response.

Do not expose the local model server to the public internet as part of
this milestone.

## 6. Stage 2 --- Benchmark Gemma against Qwen

**Purpose:** Decide where Gemma is useful using evidence, rather than
assuming a newer or smaller model is automatically better.

Test both models with the same prompts and comparable settings.

  -----------------------------------------------------------------------
  Area                                What to evaluate
  ----------------------------------- -----------------------------------
  General conversation                Clear and useful everyday answers

  Instruction following               Follows multi-part instructions

  Reasoning                           Explains a problem and reaches a
                                      defensible answer

  JavaScript                          Understands and writes correct
                                      JavaScript

  KAIRO architecture                  Reasons accurately when given the
                                      same project context

  Structured output                   Produces valid JSON when requested

  Language consistency                Uses English unless another
                                      language is requested

  Latency                             Time to first token and total
                                      generation time

  Memory                              Memory pressure and swap

  Reliability                         Repeated requests without crashes
                                      or malformed output
  -----------------------------------------------------------------------

Benchmark rules:

-   Use identical prompts.
-   Record model version, quantization, runtime, and generation
    settings.
-   Separate measured results from subjective impressions.
-   Repeat latency tests.
-   Test realistic context lengths.
-   Avoid running both models simultaneously on a 16 GB machine unless
    specifically testing that scenario.

A possible initial assignment is Gemma for general conversation and Qwen
Coder for coding. This is a hypothesis to test, not a fixed rule.

**Exit condition:** A concise benchmark record supports the initial
model assignments.

## 7. Stage 3 --- KAIRO architecture reconnaissance

**Purpose:** Understand the actual repository before changing it.

Inspect:

-   Existing Ollama integration.
-   Model selection and model configuration.
-   Any existing Model Broker or provider abstraction.
-   Backend routes and controllers involved in chat requests.
-   Services responsible for model calls.
-   SSE streaming implementation.
-   Runtime Configuration Registry, if present.
-   Error handling, timeouts, and cancellation.
-   Tests and relevant documentation.

Document the actual request path, for example:

``` text
Frontend action
    -> API route
    -> Controller
    -> Service / Broker
    -> Runtime provider
    -> Model response
    -> Stream or response handling
    -> Frontend
```

The real names and sequence must come from the repository.

Before implementation, answer:

1.  Does a Model Broker already exist? Can it be extended?
2.  Is Ollama isolated behind a provider/service?
3.  Where should the LM Studio base URL and model identifier live?
4.  How is model selection represented in a request?
5.  How does SSE handle provider-specific response formats?
6.  What is the smallest change that supports a second provider?

**Non-negotiable:** Do not invent filenames, routes, endpoints, schemas,
or configuration structures. Do not replace major files before
inspecting them.

**Exit condition:** The existing implementation and smallest safe
integration path are documented and agreed.

## 8. Stage 4 --- Add the LM Studio provider

**Purpose:** Allow the KAIRO backend to communicate with Gemma through
LM Studio.

Implementation should:

-   Reuse existing HTTP/client and service conventions where practical.
-   Keep provider-specific details out of frontend components.
-   Keep the LM Studio base URL configurable.
-   Use the exact model identifier verified in Stage 1.
-   Handle connection failures and model-not-loaded errors clearly.
-   Apply reasonable request timeouts.
-   Avoid logging secrets or unnecessary prompt content.
-   Preserve the existing Ollama integration.

If a provider abstraction already exists, extend it. If it does not,
discuss the smallest useful abstraction before introducing one.

Do not add Python or `mlx-vlm` merely to connect KAIRO to LM Studio. The
local HTTP API is the preferred first integration route.

**Exit condition:** A backend-level test sends a prompt to Gemma and
receives a valid response without breaking the existing provider.

## 9. Stage 5 --- Integrate model selection through the Model Broker

**Purpose:** Let KAIRO select a model without coupling application
features to a specific runtime.

The Broker should eventually:

-   Resolve a requested model or task to a provider and model.
-   Apply configured defaults.
-   Dispatch requests through the appropriate provider.
-   Normalize provider responses where necessary.
-   Preserve streaming behavior.
-   Report useful errors when a provider is unavailable.

Possible initial routing:

  Request type               Initial candidate
  -------------------------- -------------------------------
  General conversation       Gemma 4 E4B
  Coding task                Qwen Coder
  Explicit model selection   User-selected available model

Do not build a complex autonomous intent classifier as part of this
upgrade. Start with explicit, deterministic routing and the simplest
policy that fits the existing system.

**Exit condition:** KAIRO can use both models through its backend.
Frontend code does not need provider-specific API knowledge.

## 10. Stage 6 --- Streaming, reliability, and regression testing

Test:

-   Non-streaming responses.
-   Streaming chunks and token handling.
-   Time to first token and completion.
-   Conversation history and multi-turn context.
-   Model switching between requests.
-   Provider unavailable or server stopped.
-   Model not loaded.
-   Invalid model identifier.
-   Long-running requests and timeouts.
-   User cancellation, if currently supported.
-   English response preference.
-   Thread persistence and title generation.
-   Existing Ollama/Qwen functionality.

Providers may emit different streaming formats. Normalize them at the
backend/provider boundary where appropriate.

Verify that switching models does not accidentally mix incompatible
conversation formatting or expose internal reasoning content in saved
conversation history.

**Exit condition:** Existing chat behavior works with both providers and
regression tests pass.

## 11. Stage 7 --- Configuration and documentation

Use the existing Runtime Configuration Registry if it exists. If it does
not, inspect the current configuration approach and agree on a design
before creating a new registry.

Document:

-   Configured providers.
-   Local API base URLs.
-   Available model identifiers.
-   Default model.
-   Model assignment for supported tasks.
-   Provider enablement.

Do not hardcode local machine paths or personal usernames into
application source code.

Document how to start LM Studio, load Gemma, start its API server, start
KAIRO, select/switch models, and diagnose common connection errors.

**Exit condition:** The setup is reproducible from project
documentation.

## 12. Stage 8 --- Release and rollback

Before release:

-   Review the complete diff.
-   Run existing and new tests.
-   Verify the existing Ollama path.
-   Verify Gemma through LM Studio.
-   Check memory pressure during realistic use.
-   Confirm no credentials, private data, or machine-specific paths were
    committed.
-   Update relevant documentation.
-   Commit using the repository's conventions.

Create a release tag only after the milestone is verified and in line
with KAIRO's established versioning strategy. Do not assume this model
integration automatically changes the Foundation release tag.

Keep a straightforward rollback path: the previous Ollama configuration
must remain usable if LM Studio or Gemma is unavailable.

------------------------------------------------------------------------

## 13. Explicitly out of scope

To prevent scope creep, this upgrade does **not** include:

-   Rewriting KAIRO's frontend or backend.
-   Replacing Ollama.
-   Training a new foundation model.
-   Fine-tuning Gemma.
-   Building a Python inference service.
-   Building an autonomous multi-agent framework.
-   Implementing complex automatic model selection.
-   Building native macOS or Android clients.
-   Implementing Knowledge Vault or RAG.
-   Implementing People Registry.
-   Exposing local model servers to the public internet.

These may be future projects, but they are not prerequisites for adding
Gemma.

## 14. Development working agreement

Every implementation session follows this cycle:

1.  **Understand** --- clarify the milestone and expected outcome.
2.  **Reconnaissance** --- inspect actual files, code paths,
    configuration, and tests.
3.  **Discuss** --- explain the current design, options, trade-offs, and
    minimal change.
4.  **Decide** --- agree on the implementation before editing.
5.  **Implement** --- make one small, focused change at a time.
6.  **Test** --- run relevant tests and verify actual behavior.
7.  **Review** --- inspect the diff and check for regressions.
8.  **Commit** --- preserve a clear history of verified changes.
9.  **Reflect** --- explain what changed and what was learned.

### Project constraints

-   React + Vite frontend.
-   Node.js + Express backend.
-   JavaScript ES Modules.
-   SQLite.
-   Ollama and LM Studio as local model runtimes.
-   Plain CSS; no Tailwind.
-   No TypeScript unless explicitly agreed.
-   No unnecessary frameworks or dependencies.
-   Frontend communicates with KAIRO's backend; it does not call model
    providers directly.
-   Preserve existing design and architecture unless a change is
    justified.
-   Teach the syntax and reasoning behind implementation decisions.

### Instruction for AI coding assistants

> Inspect the existing repository and trace the actual implementation
> relevant to this task. Do not assume filenames, endpoints, schemas, or
> architecture. Explain what currently exists, identify the smallest
> safe extension, and discuss trade-offs before editing. Do not replace
> entire files or introduce future features without explicit agreement.
> Implement one milestone at a time, test it, inspect the diff, and
> explain the JavaScript and architectural concepts involved.

------------------------------------------------------------------------

## 15. Immediate next action

Start with **Stage 0: verify that Gemma loads successfully in LM
Studio**. Then complete Stage 1 by checking the local API.

Only after those two checks should KAIRO repository reconnaissance
begin.

**Guiding principle:** Upgrade KAIRO's intelligence without compromising
its architecture, reliability, privacy, or the learning process behind
the project.
