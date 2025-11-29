import React, { useEffect, useRef } from 'react';
import { getProactiveHint } from '../services/geminiService';
import { initActivityMonitor, getActivityLog } from '../services/activityMonitor';
import { View } from '../constants';

// This is a simplified, in-memory representation of the project files.
// In a real app, this could be loaded dynamically.
import { initialProjectFiles } from './CodeWizard';

interface AIOrchestratorProps {
    activeView: View;
}

const IDLE_TIMEOUT = 20000; // 20 seconds

export const AIOrchestrator: React.FC<AIOrchestratorProps> = ({ activeView }) => {
    const idleTimerRef = useRef<number | null>(null);
    const isCheckingRef = useRef(false);

    const triggerAIAnalysis = async () => {
        if (isCheckingRef.current) return;
        console.log("User is idle. Triggering AI hint...");
        isCheckingRef.current = true;

        try {
            const context = {
                currentView: activeView,
                activityLog: getActivityLog(),
            };
            const hint = await getProactiveHint(context);

            console.log("AI Hint:", hint);

            // Dispatch a new event for the hint
            const event = new CustomEvent('sagex-show-hint', {
                detail: {
                    text: hint.hint_text,
                    view: hint.target_view,
                }
            });
            window.dispatchEvent(event);

        } catch (error) {
            console.error("AI Orchestrator failed to get hint:", error);
        } finally {
            // Wait a bit before allowing another check
            setTimeout(() => {
                isCheckingRef.current = false;
            }, 45000); // Cooldown of 45 seconds
        }
    };
    
    useEffect(() => {
        initActivityMonitor(() => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            idleTimerRef.current = window.setTimeout(triggerAIAnalysis, IDLE_TIMEOUT);
        });

        // Initial timer setup
        idleTimerRef.current = window.setTimeout(triggerAIAnalysis, IDLE_TIMEOUT);

        return () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [activeView]); // Rerun effect if the view changes to reset context

    // This component does not render anything.
    return null;
};
