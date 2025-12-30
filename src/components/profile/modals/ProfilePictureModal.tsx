import { motion } from "framer-motion";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  alreadyUploaded?: boolean;
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
  alreadyUploaded = false,
}: ProfilePictureModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Camera className="size-5 text-blue-400" />
            </div>
            Upload Profile Picture
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {alreadyUploaded
              ? "You have already uploaded a profile picture"
              : "This photo will be permanently associated with your account"}
          </DialogDescription>
        </DialogHeader>

        {alreadyUploaded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="flex size-24 items-center justify-center rounded-full bg-amber-500/20">
              <Lock className="size-12 text-amber-400" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white">
                Profile Picture Already Set
              </h4>
              <p className="mt-2 text-sm text-white/60">
                For security reasons, profile pictures can only be uploaded once
                and cannot be changed.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            {/* File Upload Area */}
            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleBrowseClick}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex size-16 items-center justify-center rounded-full bg-blue-500/20">
                    <Upload className="size-8 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">
                      {isDragging ? "Drop your image here" : "Choose or drag image"}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    <ImageIcon className="mr-2 size-4" />
                    Browse Files
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="relative rounded-lg bg-white/5 p-4 border border-white/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveFile}
                    className="absolute right-2 top-2 size-8 rounded-full bg-red-500/20 p-0 text-red-400 hover:bg-red-500/30"
                  >
                    <X className="size-4" />
                  </Button>
                  <div className="flex items-center gap-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="size-24 rounded-full object-cover border-2 border-white/20"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {selectedFile?.name}
                      </p>
                      <p className="text-sm text-white/60">
                        {((selectedFile?.size || 0) / 1024).toFixed(2)} KB
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="size-3" />
                        <span>Ready to upload</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Warning Alert */}
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                <strong>Important:</strong> Once uploaded, your profile picture
                cannot be changed or removed. This is a security measure to
                prevent account impersonation. Please ensure you're happy with
                your selection before proceeding.
              </AlertDescription>
            </Alert>

            {/* Security Info */}
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Lock className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                Your photo is encrypted and stored securely. It will be used to
                verify your identity and will be visible to customer support
                staff only when needed.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <DialogFooter className="gap-2">
          {alreadyUploaded ? (
            <Button
              onClick={handleClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Upload Permanently
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
