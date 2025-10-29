import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { 
  Search, 
  Box, 
  Target, 
  Code, 
  FileText,
  Layers,
  Focus,
  Copy,
  Filter,
} from "lucide-react";
import { Node } from "@xyflow/react";
import { CustomNodeData } from "./CustomNode";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onNodeSelect: (nodeId: string) => void;
  onDuplicateSelected: () => void;
  hasSelection: boolean;
  onSelectByCriteria?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  nodes,
  onNodeSelect,
  onDuplicateSelected,
  hasSelection,
  onSelectByCriteria,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Filter nodes based on search
  const filteredNodes = nodes.filter((node) => {
    if (node.id === "center") return false; // Don't show center node
    const data = node.data as unknown as CustomNodeData;
    const searchLower = search.toLowerCase();
    return (
      data.label?.toLowerCase().includes(searchLower) ||
      data.summary?.toLowerCase().includes(searchLower) ||
      data.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  // Group nodes by type
  const nodesByType = filteredNodes.reduce((acc, node) => {
    const type = (node.data as unknown as CustomNodeData).type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "frontend":
        return <Code className="w-4 h-4" />;
      case "backend":
        return <Box className="w-4 h-4" />;
      case "requirement":
        return <Target className="w-4 h-4" />;
      case "doc":
        return <FileText className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "frontend":
        return "Frontend";
      case "backend":
        return "Backend";
      case "requirement":
        return "Requirements";
      case "doc":
        return "Documentation";
      default:
        return "Other";
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput 
        placeholder="Search nodes or run commands..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Actions Section */}
        {hasSelection && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => {
                  onDuplicateSelected();
                  onClose();
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplicate Selected Nodes</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onNodeSelect("fit-selection");
                  onClose();
                }}
              >
                <Focus className="mr-2 h-4 w-4" />
                <span>Focus on Selection</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Nodes by Type */}
        {Object.entries(nodesByType).map(([type, typeNodes]) => (
          <CommandGroup key={type} heading={getTypeLabel(type)}>
            {typeNodes.map((node) => {
              const data = node.data as unknown as CustomNodeData;
              return (
                <CommandItem
                  key={node.id}
                  onSelect={() => {
                    onNodeSelect(node.id);
                    onClose();
                  }}
                >
                  {getTypeIcon(type)}
                  <div className="ml-2 flex-1">
                    <div className="font-medium">{data.label}</div>
                    {data.summary && (
                      <div className="text-xs text-gray-500 truncate">
                        {data.summary}
                      </div>
                    )}
                  </div>
                  {node.selected && (
                    <span className="text-xs text-indigo-600">Selected</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        {/* Quick Actions */}
        {search === "" && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {onSelectByCriteria && (
                <CommandItem
                  onSelect={() => {
                    onSelectByCriteria();
                    onClose();
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Select by Criteria</span>
                </CommandItem>
              )}
              <CommandItem
                onSelect={() => {
                  onNodeSelect("center");
                  onClose();
                }}
              >
                <Focus className="mr-2 h-4 w-4" />
                <span>Focus on Center Node</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onNodeSelect("fit-all");
                  onClose();
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Fit All Nodes</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
