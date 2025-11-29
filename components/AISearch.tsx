import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAISearchResponse } from '../services/geminiService';
import { GroundingChunk } from '../types';
import { SearchIcon, LoadingSpinner, LinkIcon } from './Icons';

const AISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Removed automatic location request
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setSources([]);

    try {
      const result = await getAISearchResponse(query, location);
      setResponse(result.text);
      const metadata = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (metadata) {
        setSources(metadata as GroundingChunk[]);
      }
    } catch (err) {
      console.error('AI Search error:', err);
      setError('An error occurred while searching. My cosmic connection must be weak!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
        className="w-full md:max-w-4xl md:min-h-[75vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2 border border-white/10 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search the universe..."
          className="flex-1 bg-transparent focus:outline-none text-white px-2"
          disabled={isLoading}
        />
        <button onClick={handleSearch} disabled={isLoading} className="p-2 bg-purple-600 rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-600">
          {isLoading ? <LoadingSpinner /> : <SearchIcon />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {error && <p className="text-red-400 text-center">{error}</p>}
        {response && (
            <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">
                <p>{response}</p>
            </div>
        )}
        {sources.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-purple-300 mb-2">Sources:</h3>
            <ul className="space-y-2">
              {sources.map((source, index) => (
                <li key={index} className="bg-white/5 p-2 rounded-md hover:bg-white/10">
                   <a
                    href={source.web?.uri || source.maps?.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-300 hover:underline flex items-center gap-2"
                  >
                    <LinkIcon />
                    <span>{source.web?.title || source.maps?.title || 'Source Link'}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isLoading && !response && !error && (
            <div className="text-center text-gray-400 pt-8 md:pt-16">
                <h2 className="text-2xl font-bold mb-2">AI Semantic Search</h2>
                <p>Ask complex questions, get summarized answers with sources, powered by Google Search and Maps.</p>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default AISearch;