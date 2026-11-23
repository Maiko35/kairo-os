# KAIRO OS --- Overall Development Roadmap

## The original roadmap for the steps forward

**Document status:** Recovered roadmap summary from earlier KAIRO
planning conversations\
**Scope:** Overall KAIRO OS development, before the separate Gemma 4
model-upgrade discussion\
**Project vision:** Personal Intelligence Operating System (PIOS)

> This document reconstructs the previously discussed sequence and
> decisions from conversation history. It is not represented as a
> verbatim copy of an earlier document. Where the earlier discussion
> established a direction but not implementation detail, that
> distinction is preserved.

------------------------------------------------------------------------

## 1. The overall vision

KAIRO is not intended to be just another chatbot. It is a Personal
Intelligence Operating System: a personal, modular, local-first system
that can work across devices and support the user's work, learning,
projects, knowledge, and ministry responsibilities.

The long-term architecture should have one shared, platform-independent
Kernel, with different clients and platform-specific integrations around
it.

The guiding principles are:

-   Local-first and privacy-conscious.
-   Modular and extensible.
-   A shared Kernel rather than separate duplicated applications.
-   Model- and provider-independent architecture.
-   Incremental implementation, with each phase verified before moving
    on.
-   Build what is needed now without prematurely implementing the
    distant roadmap.

## 2. The original sequence

``` text
KAIRO Foundation
      |
      v
v1.0.0-foundation
      |
      v
People Registry
      |
      v
Knowledge Vault
      |
      v
RAG / Knowledge Integration
      |
      v
Model Broker Upgrades
      |
      v
Specialized Agents & Ministry Intelligence
      |
      v
Native macOS and Android Clients
      |
      v
Personal Model Development and Training
```

This is the overall sequence recovered from the earlier planning
discussion. The phases below describe the intent and known decisions.

------------------------------------------------------------------------

## 3. Phase 1 --- Complete KAIRO Foundation

**Goal:** Establish a reliable core application and stable architecture
before adding major capabilities.

### Known foundation work

The outstanding priorities discussed were:

1.  English-only responses unless another language is explicitly
    requested.
2.  Smooth streaming experience:
    -   Allow the user to scroll while a response is generating.
    -   Automatically follow new output only when the user is near the
        bottom.
    -   Resume following when the user returns to the bottom.
3.  Runtime Configuration Registry:
    -   Establish a central place for runtime configuration.
    -   Avoid scattered, duplicated configuration.
4.  Proper Model Broker routing:
    -   Separate model selection/routing from application features.
    -   Prepare for more than one model/provider.
5.  Verify remaining thread behavior, timestamps, error handling, and UI
    polish.
6.  Confirm code-block syntax highlighting and other remaining
    presentation details.
7.  Test the application and inspect the final changes.

### Release target

After the Foundation work is verified, create the release tag:

`v1.0.0-foundation`

The tag is a target from the earlier plan; its completion was not
confirmed in the conversation history available for this reconstruction.

------------------------------------------------------------------------

## 4. Phase 2 --- KAIRO People Registry

**Goal:** Build a practical, multi-user web application for recording
and following up with people, initially supporting Catalyst Fellowship
Kyambogo's Freshers' Week work.

The People Registry was identified as the next major build after
Foundation because it had an immediate real-world use.

### Intended capabilities

-   A mobile-friendly web interface.
-   Access for multiple ministry leaders from different devices.
-   Centralized database persistence.
-   Capture relevant contact and student information.
-   Record volunteered interests and follow-up needs.
-   Track interactions and follow-up progress.
-   Make the information available for future integration with KAIRO's
    Knowledge Vault, subject to appropriate permissions.

### Initial architecture decision

The agreed MVP direction was online-first:

``` text
Leader
  |
  v
People Registry Web App
  |
  v
API / Service Layer
  |
  v
Central Database
  |
  v
Confirmation
```

Do not build an offline-first synchronization engine for the MVP. Keep
the service layer structured so a local queue and background
synchronization can be added later if genuinely needed.

### Important data principles

-   Collect only information that is useful and appropriate.
-   Make the purpose of collection clear.
-   Respect consent and access controls.
-   Treat personal and ministry-related information carefully.
-   Avoid unnecessary sensitive information.
-   Plan for appropriate retention and deletion.

The application should be called **People Registry**, not simply a
Freshers' Week app. Freshers' Week is its first major use case.

------------------------------------------------------------------------

## 5. Phase 3 --- KAIRO Knowledge Vault

**Goal:** Give KAIRO a structured local knowledge repository that can
grow beyond individual chat threads.

The Knowledge Vault was planned as a first-class part of KAIRO's
architecture.

Its future role is to organize and make useful information available to
KAIRO, including relevant documents, notes, project material, and other
knowledge sources.

The detailed implementation design was not finalized in the recovered
roadmap. It should be planned after the Foundation and People Registry
milestones, using actual requirements and data-access rules.

------------------------------------------------------------------------

## 6. Phase 4 --- Retrieval-Augmented Generation (RAG)

**Goal:** Connect KAIRO's models to relevant information in the
Knowledge Vault without requiring entire collections of documents to be
placed into every prompt.

The intended direction:

-   Ingest and process supported knowledge sources.
-   Split content into retrievable units.
-   Generate embeddings.
-   Store and search vector representations.
-   Retrieve relevant material for a user's request.
-   Supply retrieved context to the selected model.
-   Preserve source references where appropriate.

People Registry and Knowledge Vault integration was part of the
longer-term direction, with appropriate permissions and access controls.

The exact database, embedding model, vector store, ingestion pipeline,
and retrieval strategy were not fixed in the recovered plan. These
require a separate design decision when the phase is reached.

------------------------------------------------------------------------

## 7. Phase 5 --- Model Broker upgrades

**Goal:** Evolve KAIRO's model infrastructure so it can use different
models for different tasks while keeping the application independent of
individual model providers.

The earlier architecture direction was:

``` text
Intent / Task
      |
      v
Agent or Application Capability
      |
      v
Model Broker
      |
      v
Selected Model Provider
      |
      v
Model
```

The Broker should provide a consistent interface for model requests and
isolate provider-specific details.

The broader plan anticipated multiple models and task-specific routing.
The later Gemma 4 discussion is a separate, concrete model-upgrade
milestone that can fit within this broader phase.

Do not turn this phase into a premature autonomous-agent system.
Establish reliable provider abstraction and deterministic routing before
introducing more complex orchestration.

------------------------------------------------------------------------

## 8. Phase 6 --- Specialized Agents and Ministry Intelligence

**Goal:** Introduce specialized capabilities that help KAIRO carry out
defined tasks, using shared Kernel services and appropriate knowledge
access.

The longer-term vision included support for areas such as:

-   Ministry support and follow-up assistance.
-   Working with notes and knowledge.
-   Reminders and personal organization.
-   Research and project assistance.
-   Specialized task workflows.

Agents should use shared services rather than each building their own
disconnected model, storage, and configuration infrastructure.

The precise agent list, permissions, tools, and orchestration design
were not finalized in the recovered roadmap.

For ministry-related information, KAIRO should support human judgment
and responsible follow-up rather than make assumptions about people's
spiritual lives or worth.

------------------------------------------------------------------------

## 9. Phase 7 --- Native desktop and mobile clients

**Goal:** Extend KAIRO beyond the current local web application while
reusing the shared Kernel and backend capabilities.

The platforms previously discussed were:

-   Native macOS desktop application.
-   Native Android companion application.

The user's known devices included a 2021 MacBook Pro with M1 Pro and a
Redmi Note 13.

The architectural principle is to keep the Kernel and core application
services platform-independent. Device-specific capabilities---such as
file access, OS automation, notifications, and local capture---belong in
platform-specific integration layers.

The exact desktop/mobile frameworks and release sequence were not
finalized.

------------------------------------------------------------------------

## 10. Phase 8 --- Personal model development and training

**Goal:** Build deeper understanding and, eventually, develop or adapt
smaller task-specific models for KAIRO.

The user's learning interests included:

-   Machine learning fundamentals.
-   Neural networks and transformers.
-   Embeddings.
-   Fine-tuning.
-   Quantization.
-   Retrieval-Augmented Generation.
-   Training and evaluating smaller specialized models.

This was a long-term learning and engineering direction, not a
prerequisite for the earlier KAIRO phases.

Model training, fine-tuning, retrieval, and tool use are different
approaches and should be selected based on a concrete need rather than
treated as interchangeable.

------------------------------------------------------------------------

## 11. Development order and working discipline

The intended order is:

1.  Finish Foundation.
2.  Verify and tag `v1.0.0-foundation`.
3.  Build People Registry.
4.  Build Knowledge Vault.
5.  Integrate retrieval and RAG.
6.  Continue Model Broker upgrades.
7.  Introduce specialized agents and ministry intelligence.
8.  Expand to native desktop and Android clients.
9.  Pursue personal model development and training.

This order reflects the earlier roadmap. It is not a requirement to
design every later phase in detail before starting the current one.

### Engineering cycle

Every milestone should follow:

1.  Understand the requirement.
2.  Inspect the existing implementation.
3.  Discuss architecture and trade-offs.
4.  Agree on the smallest appropriate change.
5.  Implement incrementally.
6.  Test and verify.
7.  Review the diff.
8.  Commit the completed work.
9.  Record what was learned.

### Project constraints established earlier

-   React + Vite.
-   Node.js + Express.
-   JavaScript ES Modules.
-   SQLite for the initial foundation.
-   Ollama as the existing local model runtime.
-   Plain CSS; no Tailwind.
-   No TypeScript unless explicitly agreed.
-   Keep business logic in the backend.
-   Keep the frontend as an API client.
-   Avoid unnecessary frameworks and premature complexity.
-   Preserve existing code and design unless a change is justified.
-   Explain the syntax and architecture as implementation proceeds.

------------------------------------------------------------------------

## 12. Relationship to the separate Gemma model-upgrade roadmap

The Gemma roadmap is not a replacement for this overall roadmap.

It is a focused implementation plan for one part of the broader Model
Broker/model-infrastructure direction.

The two documents have different scopes:

  -----------------------------------------------------------------------
  Overall KAIRO roadmap               Gemma model-upgrade roadmap
  ----------------------------------- -----------------------------------
  Covers the evolution of the whole   Covers adding one local model
  PIOS                                

  Starts with Foundation              Starts by verifying Gemma in LM
                                      Studio

  Includes People Registry and        Does not implement those systems
  Knowledge Vault                     

  Includes RAG and specialized agents Does not build RAG or agents

  Includes desktop/mobile expansion   Does not build native clients

  Includes long-term model learning   Benchmarks and integrates an
                                      existing model
  -----------------------------------------------------------------------

The immediate next step in the overall roadmap remains to verify the
actual completion state of Foundation before deciding whether to move to
People Registry or continue Foundation work.

------------------------------------------------------------------------

**Guiding principle:** Build KAIRO as one coherent personal intelligence
system, one verified milestone at a time.
