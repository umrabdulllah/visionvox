import { useState } from 'react';

interface TextStyle {
  fontSize: number;
  color: string;
  fontWeight: string;
}

interface TextEditorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, style: TextStyle) => Promise<void>;
}

export default function TextEditorOverlay({ isOpen, onClose, onSave }: TextEditorOverlayProps) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<TextStyle>({
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'normal'
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(text, style);
      onClose();
    } catch (err) {
      console.error('Failed to save text:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Text</h2>
        
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text..."
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <input
                type="number"
                value={style.fontSize}
                onChange={(e) => setStyle({ ...style, fontSize: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={style.color}
                onChange={(e) => setStyle({ ...style, color: e.target.value })}
                className="w-full h-10 p-1 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <select
                value={style.fontWeight}
                onChange={(e) => setStyle({ ...style, fontWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
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
            onClick={handleSave}
            disabled={!text.trim() || isLoading}
            className={`px-4 py-2 text-white rounded-md ${
              !text.trim() || isLoading
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading ? 'Adding...' : 'Add Text'}
          </button>
        </div>
      </div>
    </div>
  );
} 