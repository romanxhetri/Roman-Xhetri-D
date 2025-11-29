import React, { useState, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { LoadingSpinner, SearchIcon } from './Icons';

export const CommandBar: React.FC = () => {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Removed automatic location request
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

    const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && command.trim() && !isLoading) {
            setIsLoading(true);
            try {
                // We send an empty history as this is a one-off command interface
                const response = await getChatResponse([], command, location);

                if (response.functionCalls) {
                    for (const fc of response.functionCalls) {
                        if (fc.name === 'navigateApp' && fc.args.view) {
                            const view = fc.args.view as string;
                            const commandEvent = new CustomEvent('sagex-command', {
                                detail: { command: 'navigate', payload: { view } }
                            });
                            window.dispatchEvent(commandEvent);
                            setCommand('');
                            // The main chat window will show the confirmation message if it's open.
                            // The command bar's job is just to trigger the navigation.
                            break; 
                        }
                    }
                }
                 // Even if it's not a navigation command, clear the input.
                 // This bar is primarily for navigation.
                setCommand('');

            } catch (error) {
                console.error('CommandBar error:', error);
                 // Optionally, you could add a state to show a temporary error message
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {isLoading ? <LoadingSpinner /> : <SearchIcon className="h-4 w-4 text-gray-400" />}
            </div>
            <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleCommand}
                placeholder="Navigate with AI... (e.g., 'go to chat')"
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                disabled={isLoading}
            />
        </div>
    );
};