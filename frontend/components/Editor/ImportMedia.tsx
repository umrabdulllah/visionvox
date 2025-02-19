import { useState, useRef, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  Folder, 
  FileIcon, 
  X, 
  Film, 
  Image as ImageIcon,
  Pencil,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

interface MediaDimensions {
  width: number;
  height: number;
}

interface MediaFile {
  id: string;
  file: File;
  progress: number;
  folderId: string | null;
  thumbnail: string | null;
  dimensions?: MediaDimensions;
  name: string;
  isEditing?: boolean;
  originalName?: string;
  url?: string;
  type: 'video' | 'image' | 'audio';
  duration?: number;
}

interface Folder {
  id: string;
  name: string;
  isEditing: boolean;
  isExpanded: boolean;
}

interface ImportMediaProps {
  onFileSelect: (files: File[]) => void;
  onPreviewSelect: (file: File) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
}

export default function ImportMedia({ 
  onFileSelect, 
  onPreviewSelect, 
  acceptedFileTypes = "video/*,audio/*,image/*",
  maxFileSize = 100 
}: ImportMediaProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isGridView, setIsGridView] = useState(true)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null) // For delete confirmation

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // For local video playback (not directly relevant to folder logic)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // -- Thumbnail generation helpers --

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)

      const handleLoadedData = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)
        video.removeEventListener('loadeddata', handleLoadedData)
        URL.revokeObjectURL(objectUrl)
        resolve(thumbnailUrl)
      }

      video.addEventListener('loadeddata', handleLoadedData)
      video.src = objectUrl
      video.currentTime = 1
    })
  }

  const generateImageThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  // -- File validation and dimension checks --

  const validateFile = (file: File): boolean => {
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSize}MB limit`)
      return false
    }
    
    const fileType = file.type.split('/')[0]
    const allowedTypes = acceptedFileTypes.split(',')
    if (!allowedTypes.some(type => type.includes(fileType))) {
      setError('File type not supported')
      return false
    }
    
    return true
  }

  const getVideoDimensions = (file: File): Promise<MediaDimensions> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };

      video.src = objectUrl;
    });
  };

  const getImageDimensions = (file: File): Promise<MediaDimensions> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.src = objectUrl;
    });
  };

  // -- Handling new files (drag & drop or input) --

  const handleFiles = async (files: FileList) => {
    setIsLoading(true)
    const validFiles: MediaFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (validateFile(file)) {
        const fileType = file.type.split('/')[0]
        let thumbnail: string | null = null
        let dimensions: MediaDimensions | undefined
        
        try {
          if (fileType === 'video') {
            thumbnail = await generateVideoThumbnail(file)
            dimensions = await getVideoDimensions(file)
          } else if (fileType === 'image') {
            thumbnail = await generateImageThumbnail(file)
            dimensions = await getImageDimensions(file)
          }
        } catch {
          thumbnail = null
        }

        validFiles.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          progress: 0,
          folderId: currentFolderId, // <--- place them in current folder if inside a folder
          thumbnail,
          dimensions,
          isEditing: false,
          type: fileType as 'video' | 'image' | 'audio'
        })
      }
    }

    setMediaFiles(prev => [...prev, ...validFiles])

    // Simulate an upload progress
    for (const file of validFiles) {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setMediaFiles(prev => 
          prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          )
        )
      }
    }

    setIsLoading(false)
    onFileSelect(validFiles.map(f => f.file))
  }

  // -- Folder creation --

  const getUniqueFolderName = (baseName: string): string => {
    let counter = 1
    let newName = baseName
    while (folders.some(folder => folder.name === newName)) {
      newName = `${baseName} (${counter})`
      counter++
    }
    return newName
  }

  const createNewFolder = () => {
    const defaultName = getUniqueFolderName('New Folder')
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: defaultName,
      isEditing: true,
      isExpanded: true
    }
    setFolders([...folders, newFolder])
    
    setTimeout(() => {
      if (newFolderInputRef.current) {
        newFolderInputRef.current.focus()
        newFolderInputRef.current.select()
      }
    }, 50)
  }

  const handleFolderNameChange = (folderId: string, newName: string) => {
    if (newName.trim() === '') {
      newName = getUniqueFolderName('New Folder')
    } else {
      const unique = getUniqueFolderName(newName.trim())
      newName = unique
    }

    setFolders(prev => prev.map(folder => 
      folder.id === folderId
        ? { ...folder, name: newName, isEditing: false }
        : folder
    ))
  }

  // Toggles for folder editing / expanding

  const toggleFolderEdit = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId
        ? { ...folder, isEditing: true }
        : folder
    ))
  }

  const toggleFolderExpand = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ))
  }

  const handleKeyDown = (e: React.KeyboardEvent, folderId: string, currentName: string) => {
    if (e.key === 'Enter') {
      handleFolderNameChange(folderId, currentName)
    }
    if (e.key === 'Escape') {
      setFolders(prev => prev.map(folder => 
        folder.id === folderId
          ? { ...folder, isEditing: false }
          : folder
      ))
    }
  }

  // Clean up any object URLs for thumbnails
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.thumbnail) {
          URL.revokeObjectURL(file.thumbnail)
        }
      })
    }
  }, [mediaFiles])

  // -- Drag & Drop logic (folder vs. file) --

  const handleDragStart = (e: React.DragEvent, file: MediaFile) => {
    // We store the file's info in dataTransfer so we can read it upon drop
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: file.id,
      type: file.type,
      duration: file.duration
    }));
    setDraggedItem(file.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-primary')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      // If user dropped external files
      handleFiles(files)
    }
  }

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary')
    
    // First check if user dropped external files
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
      return
    }

    // Otherwise, internal drag from one folder to another
    if (draggedItem) {
      setMediaFiles(prev =>
        prev.map(file =>
          file.id === draggedItem
            ? { ...file, folderId: targetFolderId }
            : file
        )
      )
      setDraggedItem(null)
    }
  }

  // For icons
  const getFileIcon = (file: File) => {
    const fileType = file.type.split('/')[0]
    switch (fileType) {
      case 'video':
        return <Film className="h-6 w-6" />
      case 'image':
        return <ImageIcon className="h-6 w-6" />
      default:
        return <FileIcon className="h-6 w-6" />
    }
  }

  // Deleting entire folder
  const handleDeleteFolder = (folderId: string) => {
    // Move any files in that folder to root or delete them
    setMediaFiles(prev => prev.filter(file => file.folderId !== folderId))
    setFolders(prev => prev.filter(folder => folder.id !== folderId))
  }

  // Clicking on a file
  const handleFileClick = (file: MediaFile) => {
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Show file in preview
    onPreviewSelect(file.file);
  };

  // So that user can't rename or delete while playing a local preview
  const disableWhilePlaying = () => isPlaying;

  // rename/delete handlers for the list & grid item
  const handleRenameOrDeleteFile = (action: string, fileId: string) => {
    if (disableWhilePlaying()) return;
    if (action === 'rename') {
      startRename(fileId);
    } else if (action === 'delete') {
      const target = mediaFiles.find(file => file.id === fileId);
      if (target) promptDeleteFile(target);
    }
  };

  const startRename = (fileId: string) => {
    setMediaFiles(prev => 
      prev.map(f => 
        f.id === fileId
          ? { ...f, isEditing: true, originalName: f.name }
          : f
      )
    )
  }

  const commitRename = (fileId: string, newName: string) => {
    setMediaFiles(prev => 
      prev.map(f => {
        if (f.id === fileId) {
          const finalName = newName.trim() === '' ? f.originalName ?? f.file.name : newName.trim()
          return { ...f, name: finalName, isEditing: false, originalName: undefined }
        }
        return f
      })
    )
  }

  const cancelRename = (fileId: string) => {
    setMediaFiles(prev => 
      prev.map(f => {
        if (f.id === fileId) {
          return { ...f, name: f.originalName ?? f.name, isEditing: false, originalName: undefined }
        }
        return f
      })
    )
  }

  // Deleting a file
  const promptDeleteFile = (file: MediaFile) => {
    setFileToDelete(file)
  }

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      setMediaFiles(prev => prev.filter(f => f.id !== fileToDelete.id))
      setFileToDelete(null)
    }
  }

  // -- Folder item rendering: we handle both list and grid --

  function FolderItem({ folder }: { folder: Folder }) {
    const [editName, setEditName] = useState(folder.name)
    const inputRef = useRef<HTMLInputElement>(null)
    const filesInFolder = mediaFiles.filter(file => file.folderId === folder.id)
    
    useEffect(() => {
      if (folder.isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [folder.isEditing])

    // double-click in either view to open
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      if (!disableWhilePlaying()) {
        setCurrentFolderId(folder.id)
      }
    }

    // LIST VIEW
    if (!isGridView) {
      return (
        <div
          className="border-b border-border"
          onDragOver={e => {
            e.preventDefault()
            e.currentTarget.classList.add('border-primary')
          }}
          onDragLeave={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-primary')
          }}
          onDrop={e => handleFolderDrop(e, folder.id)}
        >
          {/* One row for the folder itself */}
          <div className="grid grid-cols-[40px_2fr_100px_100px_100px_auto] gap-2 px-4 py-2 hover:bg-muted/50 rounded-lg items-center group">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFolderExpand(folder.id)
              }}
            >
              {folder.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Folder name & edit */}
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 flex-shrink-0" />
              {folder.isEditing ? (
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleFolderNameChange(folder.id, editName)}
                  onKeyDown={(e) => handleKeyDown(e, folder.id, editName)}
                  className="h-8 text-sm"
                  disabled={disableWhilePlaying()}
                />
              ) : (
                <span
                  className="text-sm font-medium cursor-pointer"
                  onDoubleClick={handleDoubleClick}
                >
                  {folder.name}
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground">Folder</div>
            <div className="text-sm text-muted-foreground">
              {filesInFolder.length} items
            </div>
            <div className="text-sm text-muted-foreground">-</div>

            {/* Edit/Delete Button - now visible in LIST view */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolderEdit(folder.id)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteFolder(folder.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* If expanded, show files within folder */}
          {folder.isExpanded && filesInFolder.length > 0 && (
            <div className="pl-12">
              {filesInFolder.map(file => (
                <div
                  key={file.id}
                  className="grid grid-cols-[40px_2fr_100px_100px_100px_auto] gap-2 px-4 py-2 hover:bg-muted/50 rounded-lg items-center group cursor-pointer"
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDrop={e => e.stopPropagation()}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="w-8 h-8 flex-shrink-0">
                    {file.thumbnail ? (
                      <img 
                        src={file.thumbnail} 
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file.file)
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.isEditing ? (
                      <Input
                        value={file.name}
                        onChange={(e) => setMediaFiles(prev => 
                          prev.map(f => f.id === file.id ? { ...f, name: e.target.value } : f)
                        )}
                        onBlur={() => commitRename(file.id, file.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(file.id, file.name)
                          if (e.key === 'Escape') cancelRename(file.id)
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {file.file.type.split('/')[1]?.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {file.dimensions ? `${file.dimensions.width}x${file.dimensions.height}` : '-'}
                  </div>

                  {/* Edit/Delete for file in the folder (list view) */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRenameOrDeleteFile('rename', file.id)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRenameOrDeleteFile('delete', file.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // GRID VIEW
    return (
      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.classList.add('border-primary')
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.classList.remove('border-primary')
        }}
        onDrop={(e) => {
          e.stopPropagation()
          handleFolderDrop(e, folder.id)
        }}
      >
        <div className="relative aspect-video bg-muted flex items-center justify-center">
          {/* Edit/Delete in top-right corner */}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolderEdit(folder.id)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFolder(folder.id)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Folder 
            className="h-16 w-16 text-muted-foreground cursor-pointer"
            // Double-click to open folder
            onDoubleClick={handleDoubleClick}
          />
        </div>

        {/* Folder name below the icon, centered */}
        <div className="p-3 text-center">
          {folder.isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleFolderNameChange(folder.id, editName)}
              onKeyDown={(e) => handleKeyDown(e, folder.id, editName)}
              className="h-8 text-sm"
              disabled={disableWhilePlaying()}
            />
          ) : (
            <div className="flex flex-col items-center">
              <p 
                className="text-sm font-medium truncate cursor-pointer"
                onDoubleClick={handleDoubleClick}
              >
                {folder.name}
              </p>
              <span className="text-xs text-muted-foreground">
                {filesInFolder.length} items
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card 
      className="w-full h-full flex flex-col"
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.classList.add('border-primary')
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.classList.remove('border-primary')
      }}
      onDrop={handleDrop}
    >
      {/* Header row */}
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-bold">Import Media</h2>
        <div className="flex gap-2">
          {(mediaFiles.length > 0 || folders.length > 0) && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsGridView(!isGridView)}
          >
            {isGridView ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={createNewFolder}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div 
        className="flex-1 overflow-y-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* If nothing in library */}
        {mediaFiles.length === 0 && folders.length === 0 ? (
          <div 
            className="h-full flex items-center justify-center -mt-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors w-full max-w-md mx-4"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={(e) => e.target.files && handleFiles(e.target.files)} 
                accept={acceptedFileTypes}
                multiple
              />
              <Upload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drop files here or click to upload
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Hidden input for file uploads */}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={(e) => e.target.files && handleFiles(e.target.files)} 
              accept={acceptedFileTypes}
              multiple
            />

            {/* Actual listing */}
            <div className="p-4">
              {/* List View */}
              {!isGridView && (
                <div className="w-full">
                  {/* Header for columns */}
                  <div className="grid grid-cols-[40px_2fr_100px_100px_100px_auto] gap-2 px-4 py-2 bg-muted rounded-t-lg border-b font-medium text-sm">
                    <div className="w-8"></div>
                    <div>Name</div>
                    <div>Type</div>
                    <div>Size</div>
                    <div>Dimensions</div>
                    <div className="text-right pr-2">Actions</div>
                  </div>
                  
                  {/* Folder rows */}
                  {folders.map(folder => (
                    <FolderItem key={folder.id} folder={folder} />
                  ))}

                  {/* Top-level files (folderId === null) */}
                  {mediaFiles
                    .filter(file => file.folderId === null)
                    .map(file => (
                      <div
                        key={file.id}
                        className="grid grid-cols-[40px_2fr_100px_100px_100px_auto] gap-2 px-4 py-2 hover:bg-muted/50 rounded-lg items-center group cursor-pointer"
                        draggable
                        onDragStart={(e) => handleDragStart(e, file)}
                        onDrop={e => e.stopPropagation()}
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="w-8 h-8 flex-shrink-0">
                          {file.thumbnail ? (
                            <img 
                              src={file.thumbnail} 
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            getFileIcon(file.file)
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {file.isEditing ? (
                            <Input
                              value={file.name}
                              onChange={(e) => setMediaFiles(prev => 
                                prev.map(f => f.id === file.id ? { ...f, name: e.target.value } : f)
                              )}
                              onBlur={() => commitRename(file.id, file.name)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitRename(file.id, file.name);
                                } else if (e.key === 'Escape') {
                                  cancelRename(file.id);
                                }
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="truncate">{file.name}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {file.file.type.split('/')[1]?.toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {file.dimensions ? `${file.dimensions.width}x${file.dimensions.height}` : '-'}
                        </div>

                        {/* Buttons for rename/delete */}
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameOrDeleteFile('rename', file.id)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameOrDeleteFile('delete', file.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Grid View */}
              {isGridView && (
                <div className="relative grid grid-cols-4 gap-4">
                  {/* If inside a folder, show a "Back" button */}
                  {currentFolderId && (
                    <Button
                      variant="ghost"
                      className="absolute -top-10 left-0 p-2 flex items-center gap-2"
                      onClick={() => setCurrentFolderId(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                  )}

                  {/* Folders (only root-level if not inside a folder) */}
                  {folders
                    .filter(folder => !currentFolderId)
                    .map(folder => (
                      <FolderItem key={folder.id} folder={folder} />
                    ))}

                  {/* Files in the current folder */}
                  {mediaFiles
                    .filter(file => file.folderId === currentFolderId)
                    .map(file => (
                      <div
                        key={file.id}
                        className="relative border rounded-lg overflow-hidden group"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, file)
                        }}
                        onDragEnd={() => setDraggedItem(null)}
                        onClick={() => handleFileClick(file)}
                        onDrop={e => e.stopPropagation()}
                        onDragOver={e => e.preventDefault()}
                      >
                        {/* Rename/Delete top corners */}
                        <div className={`absolute top-2 left-2 z-10 transition-opacity ${file.isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameOrDeleteFile('rename', file.id)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className={`absolute top-2 right-2 z-10 transition-opacity ${file.isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameOrDeleteFile('delete', file.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Thumbnail area */}
                        <div className="relative">
                          {file.dimensions && (
                            <div 
                              className="w-full"
                              style={{
                                paddingTop: `${(file.dimensions.height / file.dimensions.width) * 100}%`
                              }}
                            >
                              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                {file.thumbnail ? (
                                  <img 
                                    src={file.thumbnail} 
                                    alt={file.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  getFileIcon(file.file)
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Name/size below */}
                        <div className="p-3">
                          {file.isEditing ? (
                            <Input
                              value={file.name}
                              onChange={(e) => setMediaFiles(prev => 
                                prev.map(f => f.id === file.id ? { ...f, name: e.target.value } : f)
                              )}
                              onBlur={() => commitRename(file.id, file.name)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(file.id, file.name)
                                if (e.key === 'Escape') cancelRename(file.id)
                              }}
                              className="h-8 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                                {file.dimensions && ` • ${file.dimensions.width}x${file.dimensions.height}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
          </AlertDialogHeader>
          <p>Are you sure you want to delete this file?</p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
