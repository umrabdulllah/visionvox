import { useState } from 'react';
import { MediaAsset } from "../../../types";

interface StockMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaAsset) => Promise<void>;
}

export default function StockMediaModal({ isOpen, onClose, onSelect }: StockMediaModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stockMedia?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl h-[80vh] flex flex-col">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Media</h2>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock media..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((media) => (
            <div
              key={media.id}
              className="group cursor-pointer bg-gray-100 rounded-lg overflow-hidden"
              onClick={() => onSelect(media)}
            >
              {media.type === 'video' && (
                <video src={media.url} className="w-full h-48 object-cover" />
              )}
              {media.type === 'image' && (
                <img src={media.url} alt="" className="w-full h-48 object-cover" />
              )}
              <div className="p-2 bg-white">
                <p className="text-sm text-gray-600 truncate">{media.url.split('/').pop()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 