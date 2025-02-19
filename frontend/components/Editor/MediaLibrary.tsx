import { MediaAsset } from "@/types";

interface MediaLibraryProps {
  assets: MediaAsset[];
  onAssetSelect: (assetId: string) => void;
}

export default function MediaLibrary({ assets, onAssetSelect }: MediaLibraryProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Media Library</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onAssetSelect(asset.id)}
              className="group cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-purple-500 p-3 transition-colors"
            >
              {asset.type === 'video' && (
                <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                  <video src={asset.url} className="w-full h-full object-cover" />
                </div>
              )}
              {asset.type === 'image' && (
                <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                  <img src={asset.url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {asset.type === 'audio' && (
                <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                  <span className="text-gray-400">🎵 Audio File</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                {asset.url.split('/').pop()}
                {asset.duration && ` (${Math.round(asset.duration)}s)`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 