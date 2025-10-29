import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

interface CreateFirstNodeProps {
  onCreateNode: () => void;
}

export const CreateFirstNode: React.FC<CreateFirstNodeProps> = ({ onCreateNode }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]">
      <div 
        className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-blue-300 
                   rounded-lg p-8 text-center shadow-lg cursor-pointer
                   hover:border-blue-500 hover:bg-blue-50/90 transition-all duration-300
                   pointer-events-auto group"
        onClick={onCreateNode}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="bg-blue-100 rounded-full p-4 group-hover:bg-blue-200 transition-colors">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <Sparkles className="h-4 w-4 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Create Your First Node
            </h3>
            <p className="text-gray-600 max-w-xs">
              Start building your workspace by adding your first concept, idea, or component.
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            Click here to begin
          </div>
        </div>
      </div>
    </div>
  );
};