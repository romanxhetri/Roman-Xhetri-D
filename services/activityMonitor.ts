interface Activity {
    type: string;
    details: any;
    timestamp: number;
}

const MAX_LOG_SIZE = 20;
let activityLog: Activity[] = [];
let onActivity: () => void = () => {};

const logActivity = (type: string, details: any) => {
    activityLog.push({ type, details, timestamp: Date.now() });
    if (activityLog.length > MAX_LOG_SIZE) {
        activityLog.shift(); // Keep the log from growing indefinitely
    }
    // Notify the orchestrator that there was activity
    onActivity();
};

const handleGlobalClick = (event: MouseEvent) => {
    let targetElement = event.target as HTMLElement;
    let details = {
        tagName: targetElement.tagName,
        text: targetElement.innerText?.substring(0, 50), // Log first 50 chars of text
    };
    logActivity('click', details);
};

const handleViewChange = (event: Event) => {
    const customEvent = event as CustomEvent;
     if (customEvent.detail.command === 'navigate') {
        logActivity('navigate', { view: customEvent.detail.payload.view });
    }
}

let isInitialized = false;

export const initActivityMonitor = (activityCallback: () => void) => {
    if (isInitialized) return;

    onActivity = activityCallback;

    window.addEventListener('click', handleGlobalClick, true); // Use capture phase to get all clicks
    window.addEventListener('sagex-command', handleViewChange);
    
    isInitialized = true;

    // Log the initial view
    logActivity('navigate', { view: 'home' });
};

export const getActivityLog = (): Activity[] => {
    return [...activityLog];
};
