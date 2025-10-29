import { useCallback, useState } from "react";
import { Upload, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void;
}

export const ImageUpload = ({ onImageUpload }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-4 border-dashed rounded-xl p-12 text-center
        transition-all duration-300 cursor-pointer
        ${isDragging 
          ? "border-primary bg-primary/10 scale-105" 
          : "border-muted hover:border-primary/50 hover:bg-muted/50"
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="space-y-6">
          <Ghost className="w-24 h-24 mx-auto text-primary animate-float" />
          
          <div>
            <h3 className="text-2xl font-creepy text-primary mb-2">
              Upload Your Costume
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag & drop your photo here, or click to browse
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            className="spooky-hover"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="w-5 h-5 mr-2" />
            Choose Photo
          </Button>

          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, WEBP, and more
          </p>
        </div>
      </label>
    </div>
  );
};
