Okay, this is shaping up to be a powerful tool! Based on your clarifications, here's a more structured approach to defining the specification for your VS Code extension. Let's call it "**Iterative Problem-Solving Assistant (IPSA)**" for now.

**Project Title:** Iterative Problem-Solving Assistant (IPSA) - A VS Code Extension

**1. Introduction & Vision:**

* **Problem:** AI coding assistants (like those in Cursor, Augment, or general LLMs) can lose context, struggle with complex multi-step problems, or fail to conduct thorough upfront analysis. This leads to suboptimal solutions or requires significant manual re-prompting and context feeding by the user.
* **Solution:** IPSA is a VS Code extension that orchestrates a structured, iterative dialogue with an existing in-IDE AI agent. It helps the user (and the agent) maintain focus by:
    * Establishing and evolving a clear plan.
    * Systematically incorporating findings from each iteration into a persistent knowledge base.
    * Refining prompts with accumulated context.
    * Managing the overall problem-solving lifecycle.
* **Core Principle:** Leverage the IDE's existing AI agent capabilities without requiring separate API keys or direct LLM charges through the extension itself. IPSA acts as a "meta-layer" or a "scaffolding" around the existing agent.

**2. Key Goals & Objectives:**

* Improve the ability of users to solve complex coding or analytical problems using AI agents within VS Code.
* Reduce agent "hallucinations" or context loss by providing a structured, evolving context.
* Automate parts of the iterative prompting and knowledge synthesis process.
* Enable the creation of a "living document" (`plan-and-findings.md`) that tracks the problem-solving journey, the plan, and key insights.
* Allow for user intervention and control throughout the process.
* Facilitate the integration of agent-generated code and documentation into the user's project.

**3. Core Features & Functionality:**

* **3.1. Session Management:**
    * **Initiate Session:** Command Palette option (e.g., `IPSA: Start New Iterative Session`).
        * Prompts user for a problem name/ID, which will be used for naming the associated Markdown file (e.g., `search-faceting-bug.plan.md`).
    * **Load Existing Session:** Command Palette option (e.g., `IPSA: Resume Iterative Session`) allowing selection from existing `*.plan.md` files in the workspace.
    * **End Session:** Clear indication and mechanism to stop the iterative process.

* **3.2. Plan & Knowledge Base Management (`<problem-id>.plan.md`):**
    * **File Creation:** Auto-create the `<problem-id>.plan.md` file if it doesn't exist when a new session starts.
    * **Initial Plan:**
        * IPSA can offer a basic template for the plan (e.g., sections for Goal, Initial Plan Steps, Findings, Agent Responses Log).
        * User populates the initial goal and high-level plan steps. IPSA can guide the user to ask the agent to help generate this initial plan.
    * **Dynamic Updates:**
        * Findings (code snippets, logical inferences, documentation summaries, agent reasoning) are systematically added to this file after each iteration.
        * The plan itself can be marked as "evolving," allowing the user or the agent (via its suggestions) to update/add/remove/reprioritize plan steps during the process.
    * **Format:** Markdown for readability and easy version control.

* **3.3. Iterative Prompting Engine:**
    * **Contextual Prompt Construction:**
        * IPSA will construct prompts by combining:
            1.  The overall goal (from `plan.md`).
            2.  The current active plan step(s).
            3.  Relevant recent findings/context from `plan.md`.
            4.  A specific instruction for the current iteration (e.g., "Focus on implementing step X," "Analyze these findings for contradictions," "Propose test cases for this code").
            5.  Optionally, a directive to the agent on how to structure its response for easier parsing (e.g., "Prefix code blocks with ```language", "List logical inferences under a '## Logic:' heading").
    * **Prompt Review & Editing:** Before sending to the agent, the user can review and modify the IPSA-generated prompt.
    * **Prompt Templates:** Pre-defined or user-customizable prompt structures for common tasks (e.g., "generate code," "analyze document," "refine previous output").

* **3.4. Agent Interaction Layer (VS Code Focus):**
    * **Target:** Designed to work with VS Code-integrated AI agents (e.g., Cursor's agent, GitHub Copilot Chat, or other similar chat/inline assistants).
    * **Mechanism (to be refined based on VS Code API capabilities and target agent extensibility):**
        * **Option A (Preferred if feasible):** Programmatic interaction. IPSA attempts to:
            * Send the constructed prompt to the active/designated AI agent's input area.
            * Read the AI agent's response.
            * *(This is the most challenging and depends heavily on VS Code APIs or the agent's own extension APIs.)*
        * **Option B (Clipboard-Assisted):**
            * IPSA prepares the prompt and copies it to the clipboard.
            * User pastes it into the agent's chat.
            * User copies the agent's full response.
            * IPSA has a command/button to "Import Agent Response from Clipboard."
        * **Option C (Editor-Assisted for Response):**
            * User pastes agent response into a temporary scratchpad or a designated section in `plan.md`.
            * IPSA command to "Process Agent Response from Editor/Selection."
    * The extension should clearly state which interaction method it's currently using or configured for.

* **3.5. Findings Extraction & Processing:**
    * **User-Guided Extraction:** After the agent responds, IPSA helps the user identify and extract key "findings."
        * Present the raw agent response.
        * Allow user to select text portions and tag them (e.g., "code snippet," "logical inference," "documentation link," "plan update suggestion").
    * **Automated Assistance (Optional/Advanced):**
        * If the agent was prompted for structured output, IPSA attempts to parse it.
        * "Ask Agent to Summarize/Extract": IPSA can formulate a follow-up prompt to the agent asking it to summarize its own previous response or extract specific types of information.
    * **Storing Findings:** Extracted and validated findings are appended/integrated into the `plan.md` file under appropriate headings (e.g., "Iteration X Findings," "Code Suggestions," "Analysis").

* **3.6. Output Management:**
    * **Documentation:** The `plan.md` file serves as the primary output for understanding the process.
    * **Code Integration:**
        * Mechanisms to easily copy code snippets from `plan.md` or agent responses to active editor or specific files.
        * If agent provides diffs or specific file instructions, assist the user in applying them.
    * **Markdown File Updates:** The agent might be instructed to directly suggest additions or modifications to the `plan.md` itself (or other `.md` files in the project if it's performing documentation tasks).

* **3.7. Iteration Control & Validation:**
    * **Next Step Logic:** IPSA helps determine the next prompt based on the plan and the latest findings.
    * **User Intervention:**
        * Button/command to "Stop Iteration."
        * Ability to manually edit `plan.md` at any time to redirect the agent.
        * Ability to skip a planned step or go back to a previous one.
    * **Automated Validation (Configurable per plan):**
        * If the plan includes a "validation" step (e.g., "Run tests `npm test`"), the user can manually confirm if it passed.
        * (Advanced) IPSA could attempt to run a configurable terminal command and check exit code if specified in the plan.
        * The loop stops if a "completion criteria" defined in the plan is met and confirmed.

* **3.8. Version Control Integration (Git):**
    * **Automatic Commits (Optional):** After each successful iteration (findings saved to `plan.md`), IPSA can offer to commit the `plan.md` file (and any changed code files) with a standardized commit message (e.g., "IPSA: Iteration 5 - Findings on X").
    * **Viewing History:** Leverage VS Code's existing Git tools to view changes to `plan.md`.

**4. User Interface (UI) & User Experience (UX) - VS Code:**

* **Command Palette:** Primary entry point for starting/resuming sessions.
* **Dedicated IPSA Panel (Webview):**
    * Displays the current `plan.md` content (or a structured view of it).
    * Shows current iteration number and active plan step.
    * Area for the constructed prompt (editable).
    * Area to display agent's raw response.
    * Controls for "Send to Agent," "Extract Findings," "Proceed to Next Step," "Stop Session."
    * Section for managing/editing extracted findings before committing to `plan.md`.
* **Editor Integration:**
    * Context menu options (e.g., "IPSA: Use selected text as goal," "IPSA: Add selected code as finding").
    * Decorations or annotations in `plan.md` to highlight current step or new findings.
* **Notifications:** Use VS Code notifications for status updates, errors, or prompts for user action.

**5. Technical Considerations:**

* **Language:** TypeScript (standard for VS Code extensions).
* **State Management:**
    * Primary persistent state: `plan.md` files.
    * Session state (non-persistent or workspace state): current prompt, last response, UI state. VS Code `ExtensionContext.workspaceState` or `globalState`.
* **Prompt Engineering:** Core logic for building effective prompts. This will be an area of continuous refinement.
* **VS Code API Usage:** `commands`, `window`, `workspace`, `TextEditor`, `WebviewPanel`, potentially `scm` (for Git). Investigation needed for interacting with other agent extensions if going for deeper integration.
* **Modularity:** Design components (plan parser, prompt builder, findings extractor) to be as modular as possible.

**6. Non-Functional Requirements:**

* **Performance:** The extension should not significantly slow down VS Code. Prompt construction and file updates should be efficient.
* **Reliability:** Robust error handling, especially around agent interaction and file operations.
* **Usability:** Intuitive UI and clear workflow. Minimal learning curve for users familiar with VS Code and AI agents.
* **Extensibility (Future):** Consider if parts of the system (like findings extraction strategies or prompt templates) could be made pluggable.

**7. Assumptions & Dependencies:**

* User has VS Code installed.
* User has an AI coding assistant/agent already set up and working within their VS Code environment (e.g., Cursor, Copilot Chat).
* The project where IPSA is used is ideally under Git version control for full benefits of history tracking.

**8. Milestones (Potential Phased Approach):**

* **Phase 1 (MVP - Core Loop with Manual Agent Interaction):**
    * Session management (start new, use existing `plan.md`).
    * Manual `plan.md` creation and editing by user.
    * Basic prompt construction helper (user copies/pastes to agent).
    * User copies agent response back.
    * Simple UI for adding findings to `plan.md`.
    * Manual iteration control by user.
    * Clipboard-assisted agent interaction.
* **Phase 2 (Enhanced UX & Automation):**
    * Dedicated IPSA Webview Panel.
    * More sophisticated prompt templating and context injection.
    * Guided findings extraction from agent response.
    * Basic Git integration (offer to commit `plan.md`).
    * Attempt editor-assisted or more direct agent interaction if feasible.
* **Phase 3 (Advanced Features):**
    * Automated validation steps (e.g., running tests).
    * More intelligent plan evolution suggestions.
    * Refined agent interaction (closer to seamless).

**9. Open Questions & Areas for Further Investigation:**

* **Agent Interaction API:** What are the actual capabilities/limitations of VS Code APIs or specific agent extension APIs (like Cursor, Copilot) for programmatic interaction? This is critical for the level of automation.
* **Complexity of "Findings Extraction":** How sophisticated can the automated extraction be? Will it mostly rely on user guidance or simple structuring conventions?
* **User Customization:** How much control should users have over prompt templates, plan structures, etc.?

This detailed specification should provide a solid foundation. The next step would be to prioritize features for an MVP and start investigating the technical feasibility of the agent interaction layer.