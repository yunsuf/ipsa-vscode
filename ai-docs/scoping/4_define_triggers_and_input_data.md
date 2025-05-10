# Define Triggers and Input Data

## System Triggers

IPSA is designed to be triggered by specific user actions within the VS Code environment. These triggers initiate different workflows and functionalities within the extension.

### Primary Triggers

1. **Start New Session Command**
   - **Trigger**: User selects "IPSA: Start New Iterative Session" from the VS Code Command Palette
   - **Action**: Initiates the creation of a new problem-solving session
   - **Follow-up**: Prompts user for problem name/ID and creates initial plan document

2. **Resume Existing Session Command**
   - **Trigger**: User selects "IPSA: Resume Iterative Session" from the VS Code Command Palette
   - **Action**: Presents a list of existing plan documents for selection
   - **Follow-up**: Loads the selected session and restores its state

3. **Send to Agent Command**
   - **Trigger**: User clicks "Send to Agent" button in IPSA panel or uses keyboard shortcut
   - **Action**: Sends the constructed prompt to the AI assistant
   - **Follow-up**: Displays the agent's response and prepares for findings extraction

4. **Extract Findings Command**
   - **Trigger**: User selects portions of agent response and categorizes them as findings
   - **Action**: Processes the selected content as findings
   - **Follow-up**: Integrates findings into the plan document

5. **Next Step Command**
   - **Trigger**: User clicks "Proceed to Next Step" button or uses keyboard shortcut
   - **Action**: Advances to the next step in the plan
   - **Follow-up**: Updates the UI and prepares a new prompt based on the next step

6. **End Session Command**
   - **Trigger**: User selects "IPSA: End Current Session" from Command Palette or clicks "End Session" button
   - **Action**: Terminates the current problem-solving session
   - **Follow-up**: Performs any necessary cleanup and state saving

### Secondary Triggers

1. **Edit Plan Command**
   - **Trigger**: User clicks "Edit Plan" button in IPSA panel
   - **Action**: Opens the plan document for direct editing
   - **Follow-up**: Updates the session state based on edited plan

2. **Add Context from Selection Command**
   - **Trigger**: User right-clicks on selected code and chooses "IPSA: Add as Context"
   - **Action**: Captures the selected code as context
   - **Follow-up**: Adds the code to the prompt construction area

3. **Save Findings Command**
   - **Trigger**: User clicks "Save Findings" after extraction
   - **Action**: Commits the extracted findings to the plan document
   - **Follow-up**: Updates the plan document and refreshes the UI

4. **Commit Changes Command**
   - **Trigger**: User clicks "Commit Changes" after significant updates
   - **Action**: Commits the plan document and any changed files to Git
   - **Follow-up**: Creates a commit with standardized message

## Input Data

IPSA processes various types of input data throughout its operation. These inputs come from different sources and are used in different ways within the system.

### User-Provided Inputs

1. **Problem Identification**
   - **Data Type**: Text string (problem name/ID)
   - **Source**: User input when starting a new session
   - **Usage**: Used to name the plan document and identify the session
   - **Example**: "search-faceting-bug" or "authentication-flow-redesign"

2. **Initial Problem Description**
   - **Data Type**: Markdown text
   - **Source**: User input in the plan document
   - **Usage**: Defines the problem to be solved and provides initial context
   - **Example**: "The product search faceting feature is incorrectly filtering results when multiple facets are selected. This investigation aims to identify and fix the root cause."

3. **Initial Plan Steps**
   - **Data Type**: Markdown list
   - **Source**: User input in the plan document
   - **Usage**: Outlines the initial approach to solving the problem
   - **Example**: 
     ```
     1. Reproduce the issue with specific test cases
     2. Analyze the facet selection handling in the frontend
     3. Trace the request flow to the backend
     4. Examine the query construction logic
     5. Identify the root cause
     6. Implement and test a fix
     ```

4. **Prompt Modifications**
   - **Data Type**: Text
   - **Source**: User edits to auto-generated prompts
   - **Usage**: Refines the prompt before sending to the AI assistant
   - **Example**: Adding specific questions or constraints to the generated prompt

5. **Findings Selection**
   - **Data Type**: Text selections with categorization
   - **Source**: User selection from agent responses
   - **Usage**: Identifies valuable information to be preserved
   - **Example**: Selecting a code snippet and categorizing it as "Solution Code"

6. **Code Selections**
   - **Data Type**: Code snippets
   - **Source**: User selection from editor
   - **Usage**: Adds relevant code context to prompts or findings
   - **Example**: Selecting a function definition to include in the prompt

### System-Generated Inputs

1. **Contextual Prompts**
   - **Data Type**: Structured text
   - **Source**: Generated by IPSA based on plan and findings
   - **Usage**: Sent to AI assistant to guide its response
   - **Example**: See example in Output Examples document

2. **Plan Document Structure**
   - **Data Type**: Markdown template
   - **Source**: Generated by IPSA when creating new sessions
   - **Usage**: Provides the initial structure for the plan document
   - **Example**: Headers for Problem Statement, Initial Plan, Iterations, etc.

3. **Session State**
   - **Data Type**: JSON object
   - **Source**: Generated and maintained by IPSA
   - **Usage**: Tracks the current state of the problem-solving session
   - **Example**: 
     ```json
     {
       "problemId": "search-faceting-bug",
       "currentIteration": 2,
       "currentStep": 3,
       "planDocPath": "/path/to/search-faceting-bug.plan.md",
       "lastPrompt": "...",
       "lastResponse": "..."
     }
     ```

### External Inputs

1. **AI Assistant Responses**
   - **Data Type**: Text (potentially with code blocks)
   - **Source**: Integrated AI assistant (e.g., Cursor, Copilot)
   - **Usage**: Provides solutions, analysis, and insights
   - **Example**: See example in Output Examples document

2. **File System Data**
   - **Data Type**: File content and metadata
   - **Source**: VS Code workspace
   - **Usage**: Provides context about the codebase
   - **Example**: Content of relevant source files, project structure

3. **Git Information**
   - **Data Type**: Version control metadata
   - **Source**: Git repository
   - **Usage**: Tracks changes to plan documents and code
   - **Example**: Commit history, branch information

## Data Flow

The input data flows through the IPSA system in the following manner:

1. User initiates a session and provides problem identification
2. IPSA creates a plan document with template structure
3. User defines the problem and initial plan steps
4. IPSA constructs a prompt based on the current plan step and context
5. User reviews and potentially modifies the prompt
6. The prompt is sent to the AI assistant
7. The AI assistant responds with analysis, code, or other information
8. User extracts findings from the response
9. IPSA integrates the findings into the plan document
10. The process repeats with updated context for subsequent steps

This iterative flow ensures that each input builds upon previous inputs, creating a comprehensive and evolving knowledge base throughout the problem-solving process.
