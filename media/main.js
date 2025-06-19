// Get access to the VS Code API
const vscode = acquireVsCodeApi();

// Define message type constants to avoid typos and ensure consistency
const MessageType = {
  // From extension to WebView
  UPDATE_SESSION: 'updateSession',
  UPDATE_PLAN_DOCUMENT: 'updatePlanDocument',
  UPDATE_CURRENT_STEP: 'updateCurrentStep',
  UPDATE_CURRENT_ITERATION: 'updateCurrentIteration',
  UPDATE_FINDINGS: 'updateFindings',
  SHOW_NOTIFICATION: 'showNotification',
  OPEN_DOCUMENT_EDITOR: 'openDocumentEditor',
  UPDATE_PROBLEM_STATEMENT: 'updateProblemStatement',
  UPDATE_PLAN_STEP: 'updatePlanStep',

  // From WebView to extension
  START_NEW_ITERATION: 'startNewIteration',
  ADVANCE_TO_NEXT_STEP: 'advanceToNextStep',
  GO_TO_PREVIOUS_STEP: 'goToPreviousStep',
  SKIP_CURRENT_STEP: 'skipCurrentStep',
  MARK_STEP_COMPLETED: 'markStepCompleted',
  SEND_PROMPT_TO_ASSISTANT: 'sendPromptToAssistant',
  CAPTURE_ASSISTANT_RESPONSE: 'captureAssistantResponse',
  EXTRACT_FINDINGS: 'extractFindings',
  OPEN_PLAN_DOCUMENT: 'openPlanDocument',
  ADD_PLAN_STEP: 'addPlanStep',
  REMOVE_PLAN_STEP: 'removePlanStep',
  REORDER_PLAN_STEPS: 'reorderPlanSteps',
  SAVE_DOCUMENT_CHANGES: 'saveDocumentChanges',
  CREATE_FINDING: 'createFinding',
  DELETE_FINDING: 'deleteFinding',
  UPDATE_FINDINGS_SETTINGS: 'updateFindingsSettings'
};

// State management
let currentSession = null;
let currentPlanDocument = null;
let currentStep = null;
let currentIteration = null;
let currentFindings = [];

// DOM Elements - will be initialized when DOM is ready
let sessionStatusElement;
let currentSessionSection;
let problemIdElement;
let currentStepElement;
let currentIterationElement;
let stepsListElement;
let findingsListElement;
let promptInputElement;
let notificationElement;

// Document editor elements - will be initialized when DOM is ready
let documentEditorSection;
let problemStatementEditor;
let stepsEditorList;
let iterationsEditorList;

// Buttons - will be initialized when DOM is ready
let sendPromptBtn;
let captureResponseBtn;
let extractFindingsBtn;
let newIterationBtn;
let nextStepBtn;
let prevStepBtn;
let skipStepBtn;
let completeStepBtn;
let openPlanBtn;

// Document editor buttons - will be initialized when DOM is ready
let editDocumentBtn;
let saveDocumentBtn;
let cancelEditBtn;
let addStepBtn;

// Findings interface elements - will be initialized when DOM is ready
let createFindingBtn;
let findingsSettingsBtn;
let findingsSearchInput;
let findingsFilterSelect;
let findingsSortSelect;
let createFindingModal;
let findingsSettingsModal;
let closeFindingModalBtn;
let closeSettingsModalBtn;
let saveFindingBtn;
let cancelFindingBtn;
let saveSettingsBtn;
let cancelSettingsBtn;

// Findings state
let filteredFindings = [];
let findingsSettings = {
  autoExtract: true,
  preferredTypes: ['code', 'analysis', 'issue', 'solution', 'documentation'],
  previewBeforeSave: true
};

// Function to get DOM elements and add null checks
function initializeDOMElements() {
  sessionStatusElement = document.getElementById('session-status');
  currentSessionSection = document.getElementById('current-session');
  problemIdElement = document.getElementById('problem-id');
  currentStepElement = document.getElementById('current-step');
  currentIterationElement = document.getElementById('current-iteration');
  stepsListElement = document.getElementById('steps-list');
  findingsListElement = document.getElementById('findings-list');
  promptInputElement = document.getElementById('prompt-input');
  notificationElement = document.getElementById('notification');

  // Document editor elements
  documentEditorSection = document.getElementById('document-editor');
  problemStatementEditor = document.getElementById('problem-statement-editor');
  stepsEditorList = document.getElementById('steps-editor-list');
  iterationsEditorList = document.getElementById('iterations-editor-list');

  // Buttons
  sendPromptBtn = document.getElementById('send-prompt-btn');
  captureResponseBtn = document.getElementById('capture-response-btn');
  extractFindingsBtn = document.getElementById('extract-findings-btn');
  newIterationBtn = document.getElementById('new-iteration-btn');
  nextStepBtn = document.getElementById('next-step-btn');
  prevStepBtn = document.getElementById('prev-step-btn');
  skipStepBtn = document.getElementById('skip-step-btn');
  completeStepBtn = document.getElementById('complete-step-btn');
  openPlanBtn = document.getElementById('open-plan-btn');

  // Document editor buttons
  editDocumentBtn = document.getElementById('edit-document-btn');
  saveDocumentBtn = document.getElementById('save-document-btn');
  cancelEditBtn = document.getElementById('cancel-edit-btn');
  addStepBtn = document.getElementById('add-step-btn');

  // Findings interface elements
  createFindingBtn = document.getElementById('create-finding-btn');
  findingsSettingsBtn = document.getElementById('findings-settings-btn');
  findingsSearchInput = document.getElementById('findings-search');
  findingsFilterSelect = document.getElementById('findings-filter');
  findingsSortSelect = document.getElementById('findings-sort');
  createFindingModal = document.getElementById('create-finding-modal');
  findingsSettingsModal = document.getElementById('findings-settings-modal');
  closeFindingModalBtn = document.getElementById('close-finding-modal-btn');
  closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');
  saveFindingBtn = document.getElementById('save-finding-btn');
  cancelFindingBtn = document.getElementById('cancel-finding-btn');
  saveSettingsBtn = document.getElementById('save-settings-btn');
  cancelSettingsBtn = document.getElementById('cancel-settings-btn');

  // Check if all elements were found
  const missingElements = [];

  if (!sessionStatusElement) missingElements.push('session-status');
  if (!currentSessionSection) missingElements.push('current-session');
  if (!problemIdElement) missingElements.push('problem-id');
  if (!currentStepElement) missingElements.push('current-step');
  if (!currentIterationElement) missingElements.push('current-iteration');
  if (!stepsListElement) missingElements.push('steps-list');
  if (!findingsListElement) missingElements.push('findings-list');
  if (!promptInputElement) missingElements.push('prompt-input');
  if (!notificationElement) missingElements.push('notification');

  // Document editor elements
  if (!documentEditorSection) missingElements.push('document-editor');
  if (!problemStatementEditor) missingElements.push('problem-statement-editor');
  if (!stepsEditorList) missingElements.push('steps-editor-list');
  if (!iterationsEditorList) missingElements.push('iterations-editor-list');

  // Buttons
  if (!sendPromptBtn) missingElements.push('send-prompt-btn');
  if (!captureResponseBtn) missingElements.push('capture-response-btn');
  if (!extractFindingsBtn) missingElements.push('extract-findings-btn');
  if (!newIterationBtn) missingElements.push('new-iteration-btn');
  if (!nextStepBtn) missingElements.push('next-step-btn');
  if (!prevStepBtn) missingElements.push('prev-step-btn');
  if (!skipStepBtn) missingElements.push('skip-step-btn');
  if (!completeStepBtn) missingElements.push('complete-step-btn');
  if (!openPlanBtn) missingElements.push('open-plan-btn');

  // Document editor buttons
  if (!editDocumentBtn) missingElements.push('edit-document-btn');
  if (!saveDocumentBtn) missingElements.push('save-document-btn');
  if (!cancelEditBtn) missingElements.push('cancel-edit-btn');
  if (!addStepBtn) missingElements.push('add-step-btn');

  if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements.join(', '));
    return false;
  }

  return true;
}

// Initialize the WebView
function initialize() {
  // Initialize DOM elements
  if (!initializeDOMElements()) {
    // If DOM elements initialization failed, show an error and return
    console.error('Failed to initialize DOM elements. WebView may not function correctly.');
    return;
  }

  try {
    // Add event listeners to buttons
    sendPromptBtn.addEventListener('click', sendPrompt);
    captureResponseBtn.addEventListener('click', captureResponse);
    extractFindingsBtn.addEventListener('click', extractFindings);
    newIterationBtn.addEventListener('click', startNewIteration);
    nextStepBtn.addEventListener('click', advanceToNextStep);
    prevStepBtn.addEventListener('click', goToPreviousStep);
    skipStepBtn.addEventListener('click', skipCurrentStep);
    completeStepBtn.addEventListener('click', markStepCompleted);
    openPlanBtn.addEventListener('click', openPlanDocument);

    // Add event listeners for document editor buttons
    editDocumentBtn.addEventListener('click', openDocumentEditor);
    saveDocumentBtn.addEventListener('click', saveDocumentChanges);
    cancelEditBtn.addEventListener('click', cancelDocumentEdit);
    addStepBtn.addEventListener('click', addPlanStep);

    // Add event listeners for findings interface
    if (createFindingBtn) createFindingBtn.addEventListener('click', openCreateFindingModal);
    if (findingsSettingsBtn) findingsSettingsBtn.addEventListener('click', openFindingsSettingsModal);
    if (findingsSearchInput) findingsSearchInput.addEventListener('input', filterFindings);
    if (findingsFilterSelect) findingsFilterSelect.addEventListener('change', filterFindings);
    if (findingsSortSelect) findingsSortSelect.addEventListener('change', sortFindings);

    // Modal event listeners
    if (closeFindingModalBtn) closeFindingModalBtn.addEventListener('click', closeCreateFindingModal);
    if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeFindingsSettingsModal);
    if (saveFindingBtn) saveFindingBtn.addEventListener('click', saveFinding);
    if (cancelFindingBtn) cancelFindingBtn.addEventListener('click', closeCreateFindingModal);
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveFindingsSettings);
    if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeFindingsSettingsModal);

    // Close modals when clicking outside
    if (createFindingModal) {
      createFindingModal.addEventListener('click', (e) => {
        if (e.target === createFindingModal) closeCreateFindingModal();
      });
    }
    if (findingsSettingsModal) {
      findingsSettingsModal.addEventListener('click', (e) => {
        if (e.target === findingsSettingsModal) closeFindingsSettingsModal();
      });
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      handleMessage(message);
    });

    // Restore state if available
    const state = vscode.getState();
    if (state) {
      currentSession = state.session || null;
      currentPlanDocument = state.planDocument || null;
      currentStep = state.currentStep || null;
      currentIteration = state.currentIteration || null;
      currentFindings = state.findings || [];
      updateUI();
    }
  } catch (error) {
    console.error('Error initializing WebView:', error);
  }
}

// Handle messages from the extension
function handleMessage(message) {
  try {
    if (!message || !message.type) {
      console.error('Received invalid message:', message);
      return;
    }

    switch (message.type) {
      case MessageType.UPDATE_SESSION:
        currentSession = message.session;
        updateSessionUI();
        break;
      case MessageType.UPDATE_PLAN_DOCUMENT:
        currentPlanDocument = message.planDocument;
        updatePlanDocumentUI();
        break;
      case MessageType.UPDATE_CURRENT_STEP:
        currentStep = message.step;
        updateCurrentStepUI();
        break;
      case MessageType.UPDATE_CURRENT_ITERATION:
        currentIteration = message.iteration;
        updateCurrentIterationUI();
        break;
      case MessageType.UPDATE_FINDINGS:
        currentFindings = message.findings;
        updateFindingsUI();
        break;
      case MessageType.SHOW_NOTIFICATION:
        showNotification(message.message, message.level);
        break;
      case MessageType.OPEN_DOCUMENT_EDITOR:
        showDocumentEditor(message.planDocument);
        break;
      case MessageType.UPDATE_PROBLEM_STATEMENT:
        updateProblemStatementInEditor(message.problemStatement);
        break;
      case MessageType.UPDATE_PLAN_STEP:
        updatePlanStepInEditor(message.step);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }

    // Save state
    vscode.setState({
      session: currentSession,
      planDocument: currentPlanDocument,
      currentStep: currentStep,
      currentIteration: currentIteration,
      findings: currentFindings
    });
  } catch (error) {
    console.error('Error handling message:', error, message);
  }
}

// Update the UI based on current state
function updateUI() {
  updateSessionUI();
  updatePlanDocumentUI();
  updateCurrentStepUI();
  updateCurrentIterationUI();
  updateFindingsUI();
}

// Update the session UI
function updateSessionUI() {
  if (currentSession) {
    sessionStatusElement.textContent = `Active session: ${currentSession.problemId}`;
    currentSessionSection.classList.remove('hidden');
    problemIdElement.textContent = `Problem: ${currentSession.problemId}`;

    // Enable/disable buttons based on session state
    sendPromptBtn.disabled = false;
    captureResponseBtn.disabled = false;
    extractFindingsBtn.disabled = false;
    newIterationBtn.disabled = false;
    nextStepBtn.disabled = false;
    prevStepBtn.disabled = false;
    skipStepBtn.disabled = false;
    completeStepBtn.disabled = false;
    openPlanBtn.disabled = false;
  } else {
    sessionStatusElement.textContent = 'No active session';
    currentSessionSection.classList.add('hidden');

    // Disable buttons when no session is active
    sendPromptBtn.disabled = true;
    captureResponseBtn.disabled = true;
    extractFindingsBtn.disabled = true;
    newIterationBtn.disabled = true;
    nextStepBtn.disabled = true;
    prevStepBtn.disabled = true;
    skipStepBtn.disabled = true;
    completeStepBtn.disabled = true;
    openPlanBtn.disabled = true;
  }
}

// Update the plan document UI
function updatePlanDocumentUI() {
  if (currentPlanDocument && currentPlanDocument.initialPlan) {
    stepsListElement.innerHTML = '';

    currentPlanDocument.initialPlan.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.classList.add('step-item');

      // Add classes based on step status
      if (currentSession && index === currentSession.currentStep) {
        stepElement.classList.add('active');
      }

      if (step.status === 'done' || step.status === 'completed') {
        stepElement.classList.add('completed');
      } else if (step.status === 'skipped') {
        stepElement.classList.add('skipped');
      }

      stepElement.textContent = `${index + 1}. ${step.description}`;
      stepsListElement.appendChild(stepElement);
    });
  } else {
    stepsListElement.textContent = 'No plan steps available';
  }
}

// Update the current step UI
function updateCurrentStepUI() {
  if (currentStep && currentSession) {
    const stepIndex = currentSession.currentStep;
    currentStepElement.textContent = `Current Step: ${stepIndex + 1}. ${currentStep.description}`;
  } else {
    currentStepElement.textContent = 'No current step';
  }
}

// Update the current iteration UI
function updateCurrentIterationUI() {
  if (currentIteration) {
    currentIterationElement.textContent = `Current Iteration: ${currentIteration.number}`;
  } else if (currentSession) {
    currentIterationElement.textContent = `Current Iteration: ${currentSession.currentIteration}`;
  } else {
    currentIterationElement.textContent = 'No current iteration';
  }
}

// Update the findings UI
function updateFindingsUI() {
  // Initialize filtered findings if not done yet
  if (!filteredFindings || filteredFindings.length === 0) {
    filteredFindings = currentFindings ? [...currentFindings] : [];
  }

  if (filteredFindings && filteredFindings.length > 0) {
    findingsListElement.innerHTML = '';

    filteredFindings.forEach((finding, index) => {
      const findingElement = createEnhancedFindingElement(finding, index);
      findingsListElement.appendChild(findingElement);
    });
  } else {
    findingsListElement.innerHTML = '<div class="empty-message">No findings available</div>';
  }
}

// Create an enhanced finding element with actions
function createEnhancedFindingElement(finding, index) {
  const findingElement = document.createElement('div');
  findingElement.classList.add('finding-item');
  findingElement.dataset.findingId = finding.id;

  const findingHeader = document.createElement('div');
  findingHeader.classList.add('finding-header');

  const findingTitleContainer = document.createElement('div');
  findingTitleContainer.style.display = 'flex';
  findingTitleContainer.style.alignItems = 'center';
  findingTitleContainer.style.gap = '8px';

  const findingTitle = document.createElement('span');
  findingTitle.textContent = `Finding ${finding.id}`;

  const findingBadge = document.createElement('span');
  findingBadge.classList.add('badge', finding.type);
  findingBadge.textContent = finding.type;

  findingTitleContainer.appendChild(findingTitle);
  findingTitleContainer.appendChild(findingBadge);

  const findingActions = document.createElement('div');
  findingActions.classList.add('finding-actions');

  const editBtn = document.createElement('button');
  editBtn.classList.add('finding-action-btn');
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    editFinding(finding);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('finding-action-btn', 'delete');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteFinding(finding.id);
  });

  findingActions.appendChild(editBtn);
  findingActions.appendChild(deleteBtn);

  findingHeader.appendChild(findingTitleContainer);
  findingHeader.appendChild(findingActions);

  const findingContent = document.createElement('div');
  findingContent.classList.add('finding-content');

  if (finding.type === 'code' && finding.metadata && finding.metadata.language) {
    const codeElement = document.createElement('code');
    codeElement.textContent = finding.content;
    findingContent.appendChild(codeElement);
  } else {
    findingContent.textContent = finding.content;
  }

  // Add metadata section
  if (finding.metadata) {
    const metadataDiv = document.createElement('div');
    metadataDiv.classList.add('finding-metadata');

    const metadataItems = [];
    if (finding.metadata.language) metadataItems.push(`Language: ${finding.metadata.language}`);
    if (finding.metadata.source) metadataItems.push(`Source: ${finding.metadata.source}`);
    if (finding.metadata.timestamp) {
      const date = new Date(finding.metadata.timestamp);
      metadataItems.push(`Created: ${date.toLocaleString()}`);
    }

    metadataDiv.textContent = metadataItems.join(' • ');
    findingContent.appendChild(metadataDiv);

    // Add tags if available
    if (finding.metadata.tags && finding.metadata.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.classList.add('finding-tags');

      finding.metadata.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('finding-tag');
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });

      findingContent.appendChild(tagsDiv);
    }
  }

  findingElement.appendChild(findingHeader);
  findingElement.appendChild(findingContent);

  // Make header clickable to expand/collapse
  findingHeader.addEventListener('click', () => {
    findingElement.classList.toggle('expanded');
  });

  return findingElement;
}

// Show a notification
function showNotification(message, level = 'info') {
  notificationElement.textContent = message;
  notificationElement.className = ''; // Clear existing classes
  notificationElement.classList.add(level);
  notificationElement.classList.remove('hidden');

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notificationElement.classList.add('hidden');
  }, 5000);
}

// Send a prompt to the assistant
function sendPrompt() {
  try {
    const prompt = promptInputElement.value.trim();
    if (!prompt) {
      showNotification('Please enter a prompt', 'warning');
      return;
    }

    vscode.postMessage({
      type: MessageType.SEND_PROMPT_TO_ASSISTANT,
      prompt
    });
  } catch (error) {
    console.error('Error sending prompt:', error);
    showNotification('Failed to send prompt', 'error');
  }
}

// Capture the assistant response
function captureResponse() {
  try {
    vscode.postMessage({
      type: MessageType.CAPTURE_ASSISTANT_RESPONSE
    });
  } catch (error) {
    console.error('Error capturing response:', error);
    showNotification('Failed to capture response', 'error');
  }
}

// Extract findings from the response
function extractFindings() {
  try {
    vscode.postMessage({
      type: MessageType.EXTRACT_FINDINGS
    });
  } catch (error) {
    console.error('Error extracting findings:', error);
    showNotification('Failed to extract findings', 'error');
  }
}

// Start a new iteration
function startNewIteration() {
  try {
    const prompt = promptInputElement.value.trim();

    vscode.postMessage({
      type: MessageType.START_NEW_ITERATION,
      prompt: prompt || undefined
    });
  } catch (error) {
    console.error('Error starting new iteration:', error);
    showNotification('Failed to start new iteration', 'error');
  }
}

// Advance to the next step
function advanceToNextStep() {
  try {
    const prompt = promptInputElement.value.trim();

    vscode.postMessage({
      type: MessageType.ADVANCE_TO_NEXT_STEP,
      startNewIteration: true,
      prompt: prompt || undefined
    });
  } catch (error) {
    console.error('Error advancing to next step:', error);
    showNotification('Failed to advance to next step', 'error');
  }
}

// Go to the previous step
function goToPreviousStep() {
  try {
    vscode.postMessage({
      type: MessageType.GO_TO_PREVIOUS_STEP
    });
  } catch (error) {
    console.error('Error going to previous step:', error);
    showNotification('Failed to go to previous step', 'error');
  }
}

// Skip the current step
function skipCurrentStep() {
  try {
    vscode.postMessage({
      type: MessageType.SKIP_CURRENT_STEP
    });
  } catch (error) {
    console.error('Error skipping current step:', error);
    showNotification('Failed to skip current step', 'error');
  }
}

// Mark the current step as completed
function markStepCompleted() {
  try {
    vscode.postMessage({
      type: MessageType.MARK_STEP_COMPLETED
    });
  } catch (error) {
    console.error('Error marking step as completed:', error);
    showNotification('Failed to mark step as completed', 'error');
  }
}

// Open the plan document
function openPlanDocument() {
  try {
    vscode.postMessage({
      type: MessageType.OPEN_PLAN_DOCUMENT
    });
  } catch (error) {
    console.error('Error opening plan document:', error);
    showNotification('Failed to open plan document', 'error');
  }
}

// Open the document editor
function openDocumentEditor() {
  try {
    vscode.postMessage({
      type: MessageType.OPEN_DOCUMENT_EDITOR
    });
  } catch (error) {
    console.error('Error opening document editor:', error);
    showNotification('Failed to open document editor', 'error');
  }
}

// Show the document editor with the given plan document
function showDocumentEditor(planDoc) {
  try {
    // If no plan document is provided, use the current one
    const docToEdit = planDoc || currentPlanDocument;

    if (!docToEdit) {
      showNotification('No plan document available to edit', 'warning');
      return;
    }

    // Show the document editor section
    documentEditorSection.classList.remove('hidden');

    // Populate the problem statement editor
    problemStatementEditor.value = docToEdit.problemStatement || '';

    // Populate the steps editor
    populateStepsEditor(docToEdit.initialPlan || []);

    // Populate the iterations editor
    populateIterationsEditor(docToEdit.iterations || []);

    // Scroll to the document editor
    documentEditorSection.scrollIntoView({ behavior: 'smooth' });

    showNotification('Document editor opened', 'info');
  } catch (error) {
    console.error('Error showing document editor:', error);
    showNotification('Failed to show document editor', 'error');
  }
}

// Populate the steps editor with the given steps
function populateStepsEditor(steps) {
  try {
    stepsEditorList.innerHTML = '';

    steps.forEach((step, index) => {
      const stepItem = createStepEditorItem(step, index);
      stepsEditorList.appendChild(stepItem);
    });

    if (steps.length === 0) {
      stepsEditorList.innerHTML = '<div class="empty-message">No steps defined. Click "Add Step" to add a new step.</div>';
    }
  } catch (error) {
    console.error('Error populating steps editor:', error);
  }
}

// Create a step editor item
function createStepEditorItem(step, index) {
  const stepItem = document.createElement('div');
  stepItem.classList.add('step-editor-item');
  stepItem.dataset.stepId = step.id || `step-${index}`;

  const stepInput = document.createElement('input');
  stepInput.type = 'text';
  stepInput.value = step.description || '';
  stepInput.placeholder = 'Step description';
  stepInput.classList.add('step-description-input');

  const statusSelect = document.createElement('select');
  statusSelect.classList.add('step-status-select');

  const statuses = ['pending', 'in-progress', 'completed', 'skipped', 'done'];
  statuses.forEach(status => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    option.selected = step.status === status;
    statusSelect.appendChild(option);
  });

  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('step-editor-actions');

  const moveUpBtn = document.createElement('button');
  moveUpBtn.textContent = '↑';
  moveUpBtn.title = 'Move Up';
  moveUpBtn.classList.add('step-move-up');
  moveUpBtn.disabled = index === 0;
  moveUpBtn.addEventListener('click', () => moveStepUp(index));

  const moveDownBtn = document.createElement('button');
  moveDownBtn.textContent = '↓';
  moveDownBtn.title = 'Move Down';
  moveDownBtn.classList.add('step-move-down');
  moveDownBtn.addEventListener('click', () => moveStepDown(index));

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '×';
  deleteBtn.title = 'Delete Step';
  deleteBtn.classList.add('step-delete');
  deleteBtn.addEventListener('click', () => removeStep(index));

  actionsDiv.appendChild(moveUpBtn);
  actionsDiv.appendChild(moveDownBtn);
  actionsDiv.appendChild(deleteBtn);

  stepItem.appendChild(stepInput);
  stepItem.appendChild(statusSelect);
  stepItem.appendChild(actionsDiv);

  return stepItem;
}

// Populate the iterations editor with the given iterations
function populateIterationsEditor(iterations) {
  try {
    iterationsEditorList.innerHTML = '';

    iterations.forEach(iteration => {
      const iterationItem = createIterationEditorItem(iteration);
      iterationsEditorList.appendChild(iterationItem);
    });

    if (iterations.length === 0) {
      iterationsEditorList.innerHTML = '<div class="empty-message">No iterations available.</div>';
    }
  } catch (error) {
    console.error('Error populating iterations editor:', error);
  }
}

// Create an iteration editor item
function createIterationEditorItem(iteration) {
  const iterationItem = document.createElement('div');
  iterationItem.classList.add('iteration-editor-item');

  const iterationHeader = document.createElement('div');
  iterationHeader.classList.add('iteration-header');
  iterationHeader.textContent = `Iteration ${iteration.number}`;

  const iterationFindings = document.createElement('div');
  iterationFindings.classList.add('iteration-findings');

  if (iteration.findings && iteration.findings.length > 0) {
    iteration.findings.forEach(finding => {
      const findingItem = createFindingEditorItem(finding);
      iterationFindings.appendChild(findingItem);
    });
  } else {
    iterationFindings.innerHTML = '<div class="empty-message">No findings in this iteration.</div>';
  }

  iterationItem.appendChild(iterationHeader);
  iterationItem.appendChild(iterationFindings);

  return iterationItem;
}

// Create a finding editor item
function createFindingEditorItem(finding) {
  const findingItem = document.createElement('div');
  findingItem.classList.add('finding-editor-item');

  const findingHeader = document.createElement('div');
  findingHeader.classList.add('finding-editor-header');

  const findingTitle = document.createElement('span');
  findingTitle.textContent = `Finding ${finding.id}`;

  const findingBadge = document.createElement('span');
  findingBadge.classList.add('badge', finding.type);
  findingBadge.textContent = finding.type;

  findingHeader.appendChild(findingTitle);
  findingHeader.appendChild(findingBadge);

  const findingContent = document.createElement('div');
  findingContent.classList.add('finding-editor-content');

  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = finding.content || '';
  contentTextarea.readOnly = true; // Findings are read-only in the editor

  findingContent.appendChild(contentTextarea);

  findingItem.appendChild(findingHeader);
  findingItem.appendChild(findingContent);

  return findingItem;
}

// Update the problem statement in the editor
function updateProblemStatementInEditor(problemStatement) {
  if (problemStatementEditor) {
    problemStatementEditor.value = problemStatement || '';
  }
}

// Update a plan step in the editor
function updatePlanStepInEditor(step) {
  if (!step || !step.id) return;

  const stepItems = stepsEditorList.querySelectorAll('.step-editor-item');
  for (const item of stepItems) {
    if (item.dataset.stepId === step.id) {
      const descInput = item.querySelector('.step-description-input');
      const statusSelect = item.querySelector('.step-status-select');

      if (descInput && step.description !== undefined) {
        descInput.value = step.description;
      }

      if (statusSelect && step.status !== undefined) {
        for (const option of statusSelect.options) {
          if (option.value === step.status) {
            option.selected = true;
            break;
          }
        }
      }

      break;
    }
  }
}

// Add a new plan step
function addPlanStep() {
  try {
    const newStepIndex = stepsEditorList.children.length;
    const newStep = {
      id: `step-${Date.now()}`,
      description: '',
      status: 'pending',
      order: stepsEditorList.children.length + 1
    };

    const stepItem = createStepEditorItem(newStep, newStepIndex);
    stepsEditorList.appendChild(stepItem);

    // Clear any empty message
    const emptyMessage = stepsEditorList.querySelector('.empty-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }

    // Focus the new step's description input
    const descInput = stepItem.querySelector('.step-description-input');
    if (descInput) {
      descInput.focus();
    }
  } catch (error) {
    console.error('Error adding plan step:', error);
    showNotification('Failed to add plan step', 'error');
  }
}

// Move a step up in the list
function moveStepUp(index) {
  try {
    if (index <= 0) return;

    const stepItems = Array.from(stepsEditorList.children);
    if (index >= stepItems.length) return;

    const itemToMove = stepItems[index];
    const itemBefore = stepItems[index - 1];

    stepsEditorList.insertBefore(itemToMove, itemBefore);

    // Update move buttons for all items
    updateMoveButtons();
  } catch (error) {
    console.error('Error moving step up:', error);
    showNotification('Failed to move step up', 'error');
  }
}

// Move a step down in the list
function moveStepDown(index) {
  try {
    const stepItems = Array.from(stepsEditorList.children);
    if (index < 0 || index >= stepItems.length - 1) return;

    const itemToMove = stepItems[index];
    const itemAfter = stepItems[index + 1];

    stepsEditorList.insertBefore(itemAfter, itemToMove);

    // Update move buttons for all items
    updateMoveButtons();
  } catch (error) {
    console.error('Error moving step down:', error);
    showNotification('Failed to move step down', 'error');
  }
}

// Update the move buttons for all steps
function updateMoveButtons() {
  const stepItems = Array.from(stepsEditorList.children);

  stepItems.forEach((item, index) => {
    const moveUpBtn = item.querySelector('.step-move-up');
    const moveDownBtn = item.querySelector('.step-move-down');

    if (moveUpBtn) {
      moveUpBtn.disabled = index === 0;
    }

    if (moveDownBtn) {
      moveDownBtn.disabled = index === stepItems.length - 1;
    }
  });
}

// Remove a step from the list
function removeStep(index) {
  try {
    const stepItems = Array.from(stepsEditorList.children);
    if (index < 0 || index >= stepItems.length) return;

    stepItems[index].remove();

    // Update move buttons for all items
    updateMoveButtons();

    // If no steps left, show empty message
    if (stepsEditorList.children.length === 0) {
      stepsEditorList.innerHTML = '<div class="empty-message">No steps defined. Click "Add Step" to add a new step.</div>';
    }
  } catch (error) {
    console.error('Error removing step:', error);
    showNotification('Failed to remove step', 'error');
  }
}

// Save document changes
function saveDocumentChanges() {
  try {
    // Collect the problem statement
    const problemStatement = problemStatementEditor.value.trim();

    // Collect the steps
    const steps = [];
    const stepItems = stepsEditorList.querySelectorAll('.step-editor-item');

    stepItems.forEach((item, index) => {
      const descInput = item.querySelector('.step-description-input');
      const statusSelect = item.querySelector('.step-status-select');

      if (descInput && statusSelect) {
        steps.push({
          id: item.dataset.stepId || `step-${index}`,
          description: descInput.value.trim(),
          status: statusSelect.value,
          order: index + 1
        });
      }
    });

    // Create the updated plan document
    const updatedPlanDoc = {
      ...currentPlanDocument,
      problemStatement,
      initialPlan: steps
    };

    // Send the updated plan document to the extension
    vscode.postMessage({
      type: MessageType.SAVE_DOCUMENT_CHANGES,
      planDocument: updatedPlanDoc
    });

    // Hide the document editor
    documentEditorSection.classList.add('hidden');

    showNotification('Document changes saved', 'info');
  } catch (error) {
    console.error('Error saving document changes:', error);
    showNotification('Failed to save document changes', 'error');
  }
}

// Cancel document edit
function cancelDocumentEdit() {
  try {
    // Hide the document editor without saving changes
    documentEditorSection.classList.add('hidden');

    showNotification('Document edit cancelled', 'info');
  } catch (error) {
    console.error('Error cancelling document edit:', error);
    showNotification('Failed to cancel document edit', 'error');
  }
}

// Findings Interface Functions

// Open the create finding modal
function openCreateFindingModal() {
  try {
    if (createFindingModal) {
      // Clear the form
      document.getElementById('finding-type-select').value = 'code';
      document.getElementById('finding-content-input').value = '';
      document.getElementById('finding-language-input').value = '';
      document.getElementById('finding-tags-input').value = '';

      createFindingModal.classList.remove('hidden');
      document.getElementById('finding-content-input').focus();
    }
  } catch (error) {
    console.error('Error opening create finding modal:', error);
    showNotification('Failed to open create finding modal', 'error');
  }
}

// Close the create finding modal
function closeCreateFindingModal() {
  try {
    if (createFindingModal) {
      createFindingModal.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error closing create finding modal:', error);
  }
}

// Open the findings settings modal
function openFindingsSettingsModal() {
  try {
    if (findingsSettingsModal) {
      // Populate current settings
      document.getElementById('auto-extract-enabled').checked = findingsSettings.autoExtract;
      document.getElementById('preview-before-save').checked = findingsSettings.previewBeforeSave;

      // Set preferred types
      const typeCheckboxes = document.querySelectorAll('#extraction-types input[type="checkbox"]');
      typeCheckboxes.forEach(checkbox => {
        checkbox.checked = findingsSettings.preferredTypes.includes(checkbox.value);
      });

      findingsSettingsModal.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error opening findings settings modal:', error);
    showNotification('Failed to open findings settings modal', 'error');
  }
}

// Close the findings settings modal
function closeFindingsSettingsModal() {
  try {
    if (findingsSettingsModal) {
      findingsSettingsModal.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error closing findings settings modal:', error);
  }
}

// Save a new finding
function saveFinding() {
  try {
    const type = document.getElementById('finding-type-select').value;
    const content = document.getElementById('finding-content-input').value.trim();
    const language = document.getElementById('finding-language-input').value.trim();
    const tagsInput = document.getElementById('finding-tags-input').value.trim();

    if (!content) {
      showNotification('Please enter finding content', 'warning');
      return;
    }

    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Create the finding object
    const finding = {
      id: `finding_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: type,
      content: content,
      metadata: {
        source: 'user',
        timestamp: Date.now(),
        ...(language && { language }),
        ...(tags.length > 0 && { tags })
      }
    };

    // Send to extension
    vscode.postMessage({
      type: 'CREATE_FINDING',
      finding: finding
    });

    closeCreateFindingModal();
    showNotification('Finding created successfully', 'info');
  } catch (error) {
    console.error('Error saving finding:', error);
    showNotification('Failed to save finding', 'error');
  }
}

// Save findings settings
function saveFindingsSettings() {
  try {
    const autoExtract = document.getElementById('auto-extract-enabled').checked;
    const previewBeforeSave = document.getElementById('preview-before-save').checked;

    const preferredTypes = [];
    const typeCheckboxes = document.querySelectorAll('#extraction-types input[type="checkbox"]:checked');
    typeCheckboxes.forEach(checkbox => {
      preferredTypes.push(checkbox.value);
    });

    findingsSettings = {
      autoExtract,
      preferredTypes,
      previewBeforeSave
    };

    // Send to extension
    vscode.postMessage({
      type: 'UPDATE_FINDINGS_SETTINGS',
      settings: findingsSettings
    });

    closeFindingsSettingsModal();
    showNotification('Settings saved successfully', 'info');
  } catch (error) {
    console.error('Error saving findings settings:', error);
    showNotification('Failed to save settings', 'error');
  }
}

// Filter findings based on search and filter criteria
function filterFindings() {
  try {
    if (!currentFindings) {
      filteredFindings = [];
      updateFindingsUI();
      return;
    }

    const searchTerm = findingsSearchInput ? findingsSearchInput.value.toLowerCase() : '';
    const filterType = findingsFilterSelect ? findingsFilterSelect.value : 'all';

    filteredFindings = currentFindings.filter(finding => {
      // Apply type filter
      if (filterType !== 'all' && finding.type !== filterType) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchableText = [
          finding.content,
          finding.type,
          finding.metadata?.language || '',
          ...(finding.metadata?.tags || [])
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    updateFindingsUI();
  } catch (error) {
    console.error('Error filtering findings:', error);
  }
}

// Sort findings based on selected criteria
function sortFindings() {
  try {
    if (!filteredFindings || filteredFindings.length === 0) return;

    const sortBy = findingsSortSelect ? findingsSortSelect.value : 'timestamp-desc';

    filteredFindings.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp-asc':
          return (a.metadata?.timestamp || 0) - (b.metadata?.timestamp || 0);
        case 'timestamp-desc':
          return (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'source':
          return (a.metadata?.source || '').localeCompare(b.metadata?.source || '');
        default:
          return 0;
      }
    });

    updateFindingsUI();
  } catch (error) {
    console.error('Error sorting findings:', error);
  }
}

// Edit a finding
function editFinding(finding) {
  try {
    // Populate the modal with existing finding data
    document.getElementById('finding-type-select').value = finding.type;
    document.getElementById('finding-content-input').value = finding.content;
    document.getElementById('finding-language-input').value = finding.metadata?.language || '';
    document.getElementById('finding-tags-input').value = finding.metadata?.tags?.join(', ') || '';

    // Store the finding ID for updating
    createFindingModal.dataset.editingId = finding.id;

    openCreateFindingModal();
  } catch (error) {
    console.error('Error editing finding:', error);
    showNotification('Failed to edit finding', 'error');
  }
}

// Delete a finding
function deleteFinding(findingId) {
  try {
    if (confirm('Are you sure you want to delete this finding?')) {
      vscode.postMessage({
        type: 'DELETE_FINDING',
        findingId: findingId
      });

      showNotification('Finding deleted successfully', 'info');
    }
  } catch (error) {
    console.error('Error deleting finding:', error);
    showNotification('Failed to delete finding', 'error');
  }
}

// Initialize the WebView when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initialize();
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});
