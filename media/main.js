// Get access to the VS Code API
const vscode = acquireVsCodeApi();

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
  if (!sendPromptBtn) missingElements.push('send-prompt-btn');
  if (!captureResponseBtn) missingElements.push('capture-response-btn');
  if (!extractFindingsBtn) missingElements.push('extract-findings-btn');
  if (!newIterationBtn) missingElements.push('new-iteration-btn');
  if (!nextStepBtn) missingElements.push('next-step-btn');
  if (!prevStepBtn) missingElements.push('prev-step-btn');
  if (!skipStepBtn) missingElements.push('skip-step-btn');
  if (!completeStepBtn) missingElements.push('complete-step-btn');
  if (!openPlanBtn) missingElements.push('open-plan-btn');

  if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements.join(', '));
    return false;
  }

  return true;
}

// Initialize the WebView
function initialize() {
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
}

// Handle messages from the extension
function handleMessage(message) {
  switch (message.type) {
    case 'updateSession':
      currentSession = message.session;
      updateSessionUI();
      break;
    case 'updatePlanDocument':
      currentPlanDocument = message.planDocument;
      updatePlanDocumentUI();
      break;
    case 'updateCurrentStep':
      currentStep = message.step;
      updateCurrentStepUI();
      break;
    case 'updateCurrentIteration':
      currentIteration = message.iteration;
      updateCurrentIterationUI();
      break;
    case 'updateFindings':
      currentFindings = message.findings;
      updateFindingsUI();
      break;
    case 'showNotification':
      showNotification(message.message, message.level);
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
  if (currentFindings && currentFindings.length > 0) {
    findingsListElement.innerHTML = '';

    currentFindings.forEach(finding => {
      const findingElement = document.createElement('div');
      findingElement.classList.add('finding-item');

      const findingHeader = document.createElement('div');
      findingHeader.classList.add('finding-header');

      const findingTitle = document.createElement('span');
      findingTitle.textContent = `Finding ${finding.id}`;

      const findingBadge = document.createElement('span');
      findingBadge.classList.add('badge', finding.type);
      findingBadge.textContent = finding.type;

      findingHeader.appendChild(findingTitle);
      findingHeader.appendChild(findingBadge);

      const findingContent = document.createElement('div');
      findingContent.classList.add('finding-content');

      if (finding.type === 'code' && finding.metadata && finding.metadata.language) {
        const codeElement = document.createElement('code');
        codeElement.textContent = finding.content;
        findingContent.appendChild(codeElement);
      } else {
        findingContent.textContent = finding.content;
      }

      findingElement.appendChild(findingHeader);
      findingElement.appendChild(findingContent);
      findingsListElement.appendChild(findingElement);
    });
  } else {
    findingsListElement.textContent = 'No findings available';
  }
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
  const prompt = promptInputElement.value.trim();
  if (!prompt) {
    showNotification('Please enter a prompt', 'warning');
    return;
  }

  vscode.postMessage({
    type: 'sendPromptToAssistant',
    prompt
  });
}

// Capture the assistant response
function captureResponse() {
  vscode.postMessage({
    type: 'captureAssistantResponse'
  });
}

// Extract findings from the response
function extractFindings() {
  vscode.postMessage({
    type: 'extractFindings'
  });
}

// Start a new iteration
function startNewIteration() {
  const prompt = promptInputElement.value.trim();

  vscode.postMessage({
    type: 'startNewIteration',
    prompt: prompt || undefined
  });
}

// Advance to the next step
function advanceToNextStep() {
  const prompt = promptInputElement.value.trim();

  vscode.postMessage({
    type: 'advanceToNextStep',
    startNewIteration: true,
    prompt: prompt || undefined
  });
}

// Go to the previous step
function goToPreviousStep() {
  vscode.postMessage({
    type: 'goToPreviousStep'
  });
}

// Skip the current step
function skipCurrentStep() {
  vscode.postMessage({
    type: 'skipCurrentStep'
  });
}

// Mark the current step as completed
function markStepCompleted() {
  vscode.postMessage({
    type: 'markStepCompleted'
  });
}

// Open the plan document
function openPlanDocument() {
  vscode.postMessage({
    type: 'openPlanDocument'
  });
}

// Initialize the WebView
initialize();
