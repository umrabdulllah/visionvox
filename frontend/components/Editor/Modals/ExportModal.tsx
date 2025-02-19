import { useState } from 'react';

interface ExportOptions {
  format: 'mp4' | 'mov' | 'webm';
  quality: 'high' | 'medium' | 'low';
  resolution: '1080p' | '720p' | '480p';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p'
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await onExport(options);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Project</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value as ExportOptions['format'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality
            </label>
            <select
              value={options.quality}
              onChange={(e) => setOptions({ ...options, quality: e.target.value as ExportOptions['quality'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution
            </label>
            <select
              value={options.resolution}
              onChange={(e) => setOptions({ ...options, resolution: e.target.value as ExportOptions['resolution'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md ${
              isLoading
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
} 