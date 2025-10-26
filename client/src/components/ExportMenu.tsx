import { Download, FileImage, FileCode, FileText, Table, GitBranch } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface ExportMenuProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportMarkdown: () => void;
  onExportCSV?: () => void;
  onExportConnectionsCSV?: () => void;
}

export function ExportMenu({ onExportPNG, onExportSVG, onExportMarkdown, onExportCSV, onExportConnectionsCSV }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/80"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onExportPNG} className="gap-2 cursor-pointer">
          <FileImage className="w-4 h-4" />
          <div className="flex flex-col">
            <span>Export as PNG</span>
            <span className="text-xs text-gray-500">Save as image file</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportSVG} className="gap-2 cursor-pointer">
          <FileCode className="w-4 h-4" />
          <div className="flex flex-col">
            <span>Export as SVG</span>
            <span className="text-xs text-gray-500">Vector graphics format</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportMarkdown} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          <div className="flex flex-col">
            <span>Export Documentation</span>
            <span className="text-xs text-gray-500">Markdown format</span>
          </div>
        </DropdownMenuItem>
        {(onExportCSV || onExportConnectionsCSV) && (
          <>
            <DropdownMenuSeparator />
            {onExportCSV && (
              <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer">
                <Table className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Export as CSV</span>
                  <span className="text-xs text-gray-500">Data analysis format</span>
                </div>
              </DropdownMenuItem>
            )}
            {onExportConnectionsCSV && (
              <DropdownMenuItem onClick={onExportConnectionsCSV} className="gap-2 cursor-pointer">
                <GitBranch className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Export Connections CSV</span>
                  <span className="text-xs text-gray-500">Edge relationships</span>
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
