import { Dialog, DialogContent } from "@/components/ui/dialog"
import ImportMedia from '@/components/Editor/ImportMedia'

interface ImportMediaModalProps {
  isOpen: boolean
  onClose: () => void
  onFilesSelected: (files: File[]) => void
}

const ImportMediaModal = ({ isOpen, onClose, onFilesSelected }: ImportMediaModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <ImportMedia
          onFileSelect={(files) => {
            onFilesSelected(files)
            onClose()
          }}
          acceptedFileTypes="video/*,audio/*,image/*"
          maxFileSize={100}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ImportMediaModal