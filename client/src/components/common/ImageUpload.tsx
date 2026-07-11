import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  name: string;
  onUploadStart?: (promise: Promise<string>) => void;
}

export default function ImageUpload({ value, onChange, name, onUploadStart }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const promise = api.upload(file);
    onUploadStart?.(promise);
    promise
      .then((url) => onChange(url))
      .catch((err: any) => alert(err.message))
      .finally(() => {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        {value ? (
          <img src={value} alt={name} className="w-full h-full rounded-2xl object-cover border border-gray-100" />
        ) : (
          <div className="w-full h-full rounded-2xl border border-gray-200 flex items-center justify-center bg-gray-50">
            <Upload className="w-5 h-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Profile Photo
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {value ? "Change" : "Upload"}
          </button>
          {uploading && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
            </span>
          )}
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
