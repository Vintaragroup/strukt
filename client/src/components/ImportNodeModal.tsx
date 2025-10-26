import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Upload, FileJson, AlertCircle, CheckCircle2, FileStack, GitBranch } from "lucide-react";
import { parseImportFile, detectImportType } from "../utils/import";
import { Alert, AlertDescription } from "./ui/alert";
import { motion } from "motion/react";

interface ImportNodeModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: any, importType: 'single' | 'multiple' | 'subgraph') => void;
}

export function ImportNodeModal({ open, onClose, onImport }: ImportNodeModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [importType, setImportType] = useState<'single' | 'multiple' | 'subgraph' | 'unknown' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    // Check file type
    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a valid JSON file');
      setIsProcessing(false);
      return;
    }

    // Parse file
    const result = await parseImportFile(selectedFile);
    
    if (!result.success) {
      setError(result.error || 'Failed to parse file');
      setIsProcessing(false);
      return;
    }

    // Detect import type
    const type = detectImportType(result.data);
    
    if (type === 'unknown') {
      setError('Unrecognized file format. Please use a valid FlowForge export file.');
      setIsProcessing(false);
      return;
    }

    setFile(selectedFile);
    setFileData(result.data);
    setImportType(type);
    setIsProcessing(false);
  };

  const handleImport = () => {
    if (fileData && importType && importType !== 'unknown') {
      onImport(fileData, importType);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileData(null);
    setImportType(null);
    setError(null);
    setDragActive(false);
    setIsProcessing(false);
    onClose();
  };

  const getImportTypeInfo = () => {
    switch (importType) {
      case 'single':
        return {
          icon: FileJson,
          label: 'Single Node',
          description: 'Import one node',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        };
      case 'multiple':
        return {
          icon: FileStack,
          label: 'Multiple Nodes',
          description: `Import ${Array.isArray(fileData) ? fileData.length : 0} nodes`,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
        };
      case 'subgraph':
        return {
          icon: GitBranch,
          label: 'Connected Subgraph',
          description: `Import ${fileData?.nodeCount || 0} connected nodes`,
          color: 'text-green-600',
          bg: 'bg-green-50',
        };
      default:
        return null;
    }
  };

  const typeInfo = getImportTypeInfo();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Node</DialogTitle>
          <DialogDescription>
            Import nodes from a previously exported JSON file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!file && (
            <div
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".json"
                onChange={handleFileInput}
              />
              
              <label htmlFor="file-upload" className="cursor-pointer">
                <motion.div
                  animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                </motion.div>
                
                <p className="text-gray-700 mb-2">
                  {dragActive ? 'Drop file here' : 'Drag & drop your JSON file here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or
                </p>
                <Button type="button" variant="outline" size="sm">
                  Browse Files
                </Button>
              </label>
            </div>
          )}

          {/* File Preview */}
          {file && typeInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 ${typeInfo.bg} border-gray-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white`}>
                  <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{typeInfo.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs ${typeInfo.bg} ${typeInfo.color} border border-current`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setFileData(null);
                    setImportType(null);
                  }}
                >
                  Change
                </Button>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Message */}
          {importType === 'single' && (
            <Alert>
              <AlertDescription>
                The node will be imported at the center of your current view. You can move it after import.
              </AlertDescription>
            </Alert>
          )}

          {importType === 'multiple' && (
            <Alert>
              <AlertDescription>
                Nodes will be arranged in a grid starting from the center of your view.
              </AlertDescription>
            </Alert>
          )}

          {importType === 'subgraph' && (
            <Alert>
              <AlertDescription>
                All nodes and their connections will be imported, preserving the original layout.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !fileData || importType === 'unknown' || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
