interface TopToolbarProps {
  projectTitle: string;
  onImportClick: () => void;
  onTextClick: () => void;
  onStockMediaClick: () => void;
  onExportClick: () => void;
  onBackClick: () => void;
}

export default function TopToolbar({
  projectTitle,
  onImportClick,
  onTextClick,
  onStockMediaClick,
  onExportClick,
  onBackClick,
}: TopToolbarProps) {
  return (
    <div className="h-16 bg-gray-900 text-white px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBackClick}
          className="text-gray-300 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-lg font-medium">{projectTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onImportClick}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
        >
          Import Media
        </button>
        <button
          onClick={onTextClick}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
        >
          Add Text
        </button>
        <button
          onClick={onStockMediaClick}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
        >
          Stock Media
        </button>
        <button
          onClick={onExportClick}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-md text-sm"
        >
          Export
        </button>
      </div>
    </div>
  );
} 