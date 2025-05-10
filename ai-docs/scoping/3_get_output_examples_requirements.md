# Output Examples and Requirements

## Core Outputs of IPSA

### 1. Structured Problem Documentation (`<problem-id>.plan.md`)

The primary tangible output of IPSA is a comprehensive Markdown document that captures the entire problem-solving journey. This document serves as both a guide during the process and valuable documentation afterward.

#### Example Structure:
```markdown
# Search Faceting Bug Investigation

## Problem Statement
The product search faceting feature is incorrectly filtering results when multiple facets are selected. This investigation aims to identify and fix the root cause.

## Initial Plan
1. Reproduce the issue with specific test cases
2. Analyze the facet selection handling in the frontend
3. Trace the request flow to the backend
4. Examine the query construction logic
5. Identify the root cause
6. Implement and test a fix

## Iteration 1: Reproduction and Initial Analysis
### Findings
- Successfully reproduced with the following steps:
  1. Search for "laptop"
  2. Select "Electronics" category
  3. Select "Price: $500-$1000" filter
  4. Select "Brand: Dell" filter
  - Expected: 15 results matching all criteria
  - Actual: 0 results shown

### Code Analysis
```javascript
// Current implementation in facetSelection.js
const applyFacets = (searchResults, selectedFacets) => {
  return selectedFacets.reduce((results, facet) => {
    return results.filter(item => item[facet.key] === facet.value);
  }, searchResults);
}
```
- This implementation uses AND logic between different facet types, which is correct
- However, it also uses AND logic between values of the same facet type, which should be OR

### Next Steps
- Investigate the backend query construction in `searchService.js`
- Check how facet selections are serialized in the API request

## Iteration 2: Backend Analysis
...
```

#### Requirements for the Plan Document:
- Must be human-readable and well-structured
- Should clearly separate different iterations and findings
- Must support code blocks with syntax highlighting
- Should include both the plan and its evolution
- Must capture key decisions and reasoning
- Should be easily navigable and searchable

### 2. Contextual Prompts

IPSA generates structured prompts that incorporate relevant context from the problem-solving process.

#### Example Prompt:
```
I'm working on fixing a search faceting bug. Here's what I know so far:

GOAL: Fix incorrect filtering when multiple facets are selected in product search

CURRENT PLAN STEP: Examine the query construction logic in the backend

RELEVANT FINDINGS:
1. The issue occurs when selecting multiple values within the same facet type
2. Frontend code in facetSelection.js uses AND logic between different facet types
3. The API request serializes facets as: ?category=Electronics&price=500-1000&brand=Dell
4. The searchService.js constructs a query using the following code:

```javascript
function buildFilterQuery(params) {
  return Object.entries(params).map(([key, value]) => {
    return { match: { [key]: value } };
  });
}
```

CURRENT TASK: Analyze how the backend constructs Elasticsearch queries from these parameters and identify if the issue is in the query construction logic.

Please examine the code snippet and explain how it might be causing the observed behavior. Then suggest a fix that would implement OR logic between values of the same facet type while maintaining AND logic between different facet types.
```

#### Requirements for Prompts:
- Must include the overall goal
- Should reference the current plan step
- Must incorporate relevant findings from previous iterations
- Should include specific code snippets when applicable
- Must clearly state the current task or question
- Should guide the AI toward a specific type of response

### 3. Findings Extraction

IPSA helps users extract and categorize key findings from AI responses.

#### Example AI Response with Extracted Findings:
```
I've analyzed the query construction code and found the issue. The `buildFilterQuery` function is creating an Elasticsearch "match" query for each parameter, and these are combined with AND logic by default.

The problem is that when you have multiple values for the same facet (like multiple brands), they're overwriting each other in the params object because they use the same key. This is why only the last selected value is being applied.

Here's how the current code processes the URL parameters:
```javascript
// URL: ?category=Electronics&brand=Dell&brand=HP
// Becomes params object: { category: 'Electronics', brand: 'HP' }
// Note that 'Dell' is lost because 'HP' overwrites it
```

To fix this, you need to:
1. Parse URL parameters to properly handle multiple values for the same key
2. Modify the query construction to use "should" (OR) clauses for values of the same facet type
3. Use "must" (AND) clauses between different facet types

Here's a proposed solution:
```javascript
function buildFilterQuery(params) {
  // Group parameters by key
  const groupedParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (!groupedParams[key]) groupedParams[key] = [];
    groupedParams[key].push(value);
  });
  
  // Build query with proper OR/AND logic
  return {
    bool: {
      must: Object.entries(groupedParams).map(([key, values]) => {
        if (values.length === 1) {
          return { match: { [key]: values[0] } };
        } else {
          return {
            bool: {
              should: values.map(value => ({ match: { [key]: value } }))
            }
          };
        }
      })
    }
  };
}
```

This solution will properly handle multiple values for the same facet type with OR logic, while maintaining AND logic between different facet types.
```

#### Extracted Findings:
- **Issue Identification**: URL parameters with the same key overwrite each other in the params object
- **Root Cause**: The query construction doesn't handle multiple values for the same facet type
- **Code Snippet**: Example of how URL parameters are currently processed
- **Solution Approach**: Use nested bool queries with "should" clauses for same-facet values
- **Implementation**: Proposed code solution with grouping by parameter key

#### Requirements for Findings Extraction:
- Must support different types of findings (code, analysis, issues, solutions)
- Should preserve code formatting and syntax
- Must be easily categorizable
- Should capture the essence of the AI's response
- Must be structured for integration into the plan document

### 4. VS Code UI Components

IPSA provides a user interface within VS Code for managing the problem-solving process.

#### UI Components Include:
- Session management controls
- Plan document viewer/editor
- Prompt construction and editing area
- Agent response display
- Findings extraction interface
- Navigation between plan steps

#### Requirements for UI:
- Must integrate seamlessly with VS Code
- Should be intuitive and unobtrusive
- Must support all core IPSA workflows
- Should be responsive and performant
- Must follow VS Code UI/UX guidelines
- Should support keyboard shortcuts for efficiency

## Technical Requirements

### Functional Requirements

1. **Session Management**
   - Create new problem-solving sessions
   - Resume existing sessions
   - End sessions with clear state management

2. **Plan Document Management**
   - Create structured Markdown files
   - Parse and update these files programmatically
   - Support for templates and dynamic content

3. **Prompt Construction**
   - Extract relevant context from plan document
   - Combine multiple context elements into coherent prompts
   - Allow user editing before sending to agent

4. **Agent Interaction**
   - Interface with existing VS Code AI assistants
   - Send prompts to the agent
   - Capture agent responses

5. **Findings Extraction**
   - Parse agent responses for key information
   - Categorize and structure findings
   - Integrate findings into plan document

6. **Version Control**
   - Track changes to plan documents
   - Support for committing updates
   - History viewing and comparison

### Non-Functional Requirements

1. **Performance**
   - Extension load time under 2 seconds
   - UI operations respond within 200ms
   - File operations complete within 1 second
   - No noticeable impact on VS Code performance

2. **Reliability**
   - Robust error handling for all operations
   - Data persistence across VS Code sessions
   - Recovery mechanisms for unexpected failures

3. **Usability**
   - Intuitive workflow requiring minimal training
   - Clear visual indicators of system state
   - Helpful error messages and guidance
   - Accessibility compliance

4. **Security**
   - No direct handling of API keys or credentials
   - Secure storage of any sensitive information
   - No transmission of data outside the local environment

5. **Extensibility**
   - Modular architecture for future enhancements
   - Well-documented extension points
   - Support for potential customization
