/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";

interface PreviewFile {
  url: string;
  name: string;
  file: File;
}

interface FileUploaderRenderProps {
  previews: PreviewFile[];
  error: string;
  removeFile: (index: number) => void;
  triggerFileInput: () => void;
  isDragging: boolean;
  dropHandlers: {
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
  };
}

interface FileUploaderPropsBase {
  maxSizeMB: number;
  acceptFormats: string[];
  defaultFile?: string;
  renderTrigger?: (onClick: () => void) => React.ReactNode;
  render?: (props: FileUploaderRenderProps) => React.ReactNode;
  showPreview?: boolean;
  multiple?: boolean;
}

interface SingleFileUploaderProps extends FileUploaderPropsBase {
  multiple?: false;
  onFileUpload: (file: File) => void;
}

interface MultipleFileUploaderProps extends FileUploaderPropsBase {
  multiple: true;
  onFileUpload: (files: File[]) => void;
}

type FileUploaderProps = SingleFileUploaderProps | MultipleFileUploaderProps;

const CustomFileUploader: React.FC<FileUploaderProps> = ({
  maxSizeMB,
  acceptFormats,
  onFileUpload,
  defaultFile,
  renderTrigger,
  render,
  showPreview = true,
  multiple = false,
}) => {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultFile) {
      setPreviews([
        {
          url: defaultFile,
          name: defaultFile.split("/").pop() || "default",
          file: null as any,
        },
      ]);
    }
  }, [defaultFile]);

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const validateAndPreview = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const newPreviews: PreviewFile[] = [];

    Array.from(files).forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (sizeMB > maxSizeMB) {
        setError(`File size exceeds ${maxSizeMB} MB`);
        return;
      }

      if (ext && !acceptFormats.includes(ext)) {
        setError(
          `File format not supported! Please upload a ${acceptFormats.join(
            ", ",
          )} file`,
        );
        return;
      }

      validFiles.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        name: file.name,
        file,
      });
    });

    if (validFiles.length > 0) {
      setError("");
      setPreviews((prev) =>
        multiple ? [...prev, ...newPreviews] : newPreviews,
      );
      if (multiple) {
        (onFileUpload as (files: File[]) => void)(validFiles);
      } else {
        (onFileUpload as (file: File) => void)(validFiles[0]);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndPreview(e.target.files);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    validateAndPreview(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const dropHandlers = {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  if (render) {
    return (
      <>
        {render({
          previews,
          error,
          removeFile,
          triggerFileInput,
          isDragging,
          dropHandlers,
        })}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
          accept={acceptFormats.map((ext) => `.${ext}`).join(",")}
        />
      </>
    );
  }

  if (renderTrigger) {
    return (
      <>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`inline-block ${
            isDragging ? "border border-blue-400 bg-blue-50 rounded-md" : ""
          }`}
        >
          {renderTrigger(triggerFileInput)}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={acceptFormats.map((ext) => `.${ext}`).join(",")}
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${
        isDragging ? "border border-blue-400 bg-blue-50 rounded-full" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label
        htmlFor="dropzone-file"
        onClick={triggerFileInput}
        className="flex flex-col items-center justify-center px-6 border border-red-300 w-[100px] h-[100px] rounded-full cursor-pointer bg-gray-50"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {previews.length > 0 && showPreview ? (
            <img
              src={previews[0].url}
              alt="Preview"
              width={128}
              height={128}
              className="object-cover rounded-full"
            />
          ) : (
            <></>
          )}
        </div>
        <input
          ref={inputRef}
          id="dropzone-file"
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
          accept={acceptFormats.map((ext) => `.${ext}`).join(",")}
        />
      </label>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default CustomFileUploader;
