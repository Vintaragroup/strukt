import { useState, useEffect } from "react";
import { X, MousePointer2, Sparkles, Layers, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  position: "center" | "top-right" | "bottom-left" | "top-left";
  highlight?: {
    element: string; // CSS selector
    padding?: number;
  };
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to FlowForge! 🎉",
    description: "A modern visual requirements whiteboard for project planning. Let's take a quick tour of the key features.",
    icon: Sparkles,
    position: "center",
  },
  {
    title: "Center Focal Node",
    description: "Your project starts here. Click the blue handles around the center node to create connected nodes that radiate outward.",
    icon: Layers,
    position: "center",
    highlight: {
      element: '[data-id="center"]',
      padding: 20,
    },
  },
  {
    title: "Drag to Create Nodes",
    description: "Select any node, then click the circular handles to add connected nodes. Click once to place the new node anywhere on the canvas.",
    icon: MousePointer2,
    position: "top-left",
  },
  {
    title: "Rich Text Editing",
    description: "Each node can contain multiple cards with rich text formatting, todo lists, and expandable content. Just click 'Add Card' at the bottom of any node.",
    icon: Layers,
    position: "top-right",
  },
  {
    title: "AI Assistant & Templates",
    description: "Click the AI button in the bottom right to get suggestions, generate requirements, or start from a template.",
    icon: Sparkles,
    position: "bottom-left",
    highlight: {
      element: '[data-tour="ai-button"]',
      padding: 12,
    },
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingOverlay({ onComplete, onSkip }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Update highlight position
  useEffect(() => {
    if (step.highlight) {
      const element = document.querySelector(step.highlight.element);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, step.highlight]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepPosition = () => {
    switch (step.position) {
      case "top-right":
        return "top-8 right-8";
      case "bottom-left":
        return "bottom-8 left-8";
      case "top-left":
        return "top-8 left-8";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
      
      {/* Highlight spotlight */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute pointer-events-none"
          style={{
            left: highlightRect.left - (step.highlight?.padding || 0),
            top: highlightRect.top - (step.highlight?.padding || 0),
            width: highlightRect.width + (step.highlight?.padding || 0) * 2,
            height: highlightRect.height + (step.highlight?.padding || 0) * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.5)",
            borderRadius: "1rem",
            border: "3px solid rgba(99, 102, 241, 0.8)",
          }}
        />
      )}

      {/* Step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`absolute ${getStepPosition()} w-full max-w-md pointer-events-auto`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl mb-1">{step.title}</h3>
                    <p className="text-indigo-100 text-sm">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20 text-white shrink-0"
                  onClick={onSkip}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "w-8 bg-indigo-500"
                        : index < currentStep
                        ? "w-1.5 bg-indigo-300"
                        : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="text-gray-600"
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onSkip}
                    className="border-gray-300"
                  >
                    Skip Tour
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg gap-2"
                  >
                    {isLastStep ? "Get Started" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
