import { Upload } from "lucide-react";
import { type ChangeEvent, type DragEvent, type RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { strings } from "@/lib/strings";

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
      <CardTitle className="text-sm font-medium">{strings.uploadLockfileCard.title}</CardTitle>
      <p className="text-sm text-muted-foreground">{strings.uploadLockfileCard.description}</p>
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
            strings.uploadLockfileCard.analyzing
          ) : fileName ? (
            <>
              <span className="font-medium text-foreground">{fileName}</span>
              <span>{strings.uploadLockfileCard.analyzedSuffix}</span>
            </>
          ) : (
            <>
              <span>{strings.uploadLockfileCard.promptPrefix}</span>
              <span className="font-medium text-foreground">{strings.uploadLockfileCard.promptPackageLockfile}</span>
            </>
          )}
        </p>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </CardContent>
  </Card>
);

export default UploadLockfileCard;