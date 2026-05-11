import { Upload } from "lucide-react";
import { type ChangeEvent, type DragEvent, type RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UploadLockfileCardProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  fileName: string | null;
  error: string | null;
  onZoneClick: () => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

const UploadLockfileCard = ({
  fileInputRef,
  isLoading,
  fileName,
  error,
  onZoneClick,
  onFileInputChange,
  onDrop,
}: UploadLockfileCardProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">Upload Lockfile</CardTitle>
      <p className="text-sm text-muted-foreground">
        Upload your package-lock.json file to analyze dependency impact
      </p>
    </CardHeader>
    <CardContent>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={onFileInputChange}
      />
      <div
        onClick={onZoneClick}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input transition-colors hover:border-muted-foreground hover:bg-muted/40"
      >
        <Upload className="h-5 w-5 text-red-600" />
        <p className="px-2 text-center text-sm text-muted-foreground">
          {isLoading ? (
            "Analyzing package-lock.json..."
          ) : fileName ? (
            <>
              <span className="font-medium text-foreground">{fileName}</span>
              <span> analyzed. Click or drop to replace it.</span>
            </>
          ) : (
            <>
              <span>Click or drop your </span>
              <span className="font-medium text-foreground">package-lock.json</span>
            </>
          )}
        </p>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </CardContent>
  </Card>
);

export default UploadLockfileCard;