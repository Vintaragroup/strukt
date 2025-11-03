import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Sparkles, Users, Target, ClipboardList, AlertTriangle } from "lucide-react";

export interface IdeaKickoffValues {
  coreIdea?: string;
  primaryAudience?: string;
  coreOutcome?: string;
  launchScope?: string;
  primaryRisk?: string;
}

type StepKey = keyof IdeaKickoffValues;

type StepConfig = {
  id: StepKey;
  title: string;
  description: string;
  placeholder: string;
  required?: boolean;
  variant: "textarea" | "input";
  icon: ComponentType<{ className?: string }>;
};

const STEPS: StepConfig[] = [
  {
    id: "coreIdea",
    title: "What are you building?",
    description: "Describe the idea in a sentence so we can anchor everything else.",
    placeholder: "A concierge app that builds a personal festival itinerary...",
    required: true,
    variant: "textarea",
    icon: Sparkles,
  },
  {
    id: "primaryAudience",
    title: "Who needs this first?",
    description: "Name the people or teams that will feel the impact immediately.",
    placeholder: "Festival goers who feel overwhelmed picking shows",
    required: true,
    variant: "input",
    icon: Users,
  },
  {
    id: "coreOutcome",
    title: "How will you know it works?",
    description: "Share the success signal or KPI that matters most.",
    placeholder: "80% of users build a schedule in under 3 minutes",
    required: true,
    variant: "textarea",
    icon: Target,
  },
  {
    id: "launchScope",
    title: "What must launch in version one?",
    description: "Capture the short list of must-have capabilities for your first release.",
    placeholder: "Personalized schedule builder, map integration, notifications",
    variant: "textarea",
    icon: ClipboardList,
  },
  {
    id: "primaryRisk",
    title: "What could block progress?",
    description: "Call out any risk, dependency, or unknown you want us to watch.",
    placeholder: "Collecting reliable event data from third-party APIs",
    variant: "textarea",
    icon: AlertTriangle,
  },
];

interface IdeaKickoffDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (values: IdeaKickoffValues) => void;
  initialValues?: IdeaKickoffValues;
}

export function IdeaKickoffDialog({ open, onClose, onComplete, initialValues }: IdeaKickoffDialogProps) {
  const [values, setValues] = useState<IdeaKickoffValues>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const hydrated: IdeaKickoffValues = {
      coreIdea: initialValues?.coreIdea ?? "",
      primaryAudience: initialValues?.primaryAudience ?? "",
      coreOutcome: initialValues?.coreOutcome ?? "",
      launchScope: initialValues?.launchScope ?? "",
      primaryRisk: initialValues?.primaryRisk ?? "",
    };
    setValues(hydrated);

    const firstIncomplete = STEPS.findIndex((step) => step.required && !hydrated[step.id]?.trim());
    setStepIndex(firstIncomplete === -1 ? 0 : firstIncomplete);
    setError(null);
  }, [open, initialValues]);

  const currentStep = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);
  const isLastStep = stepIndex >= STEPS.length - 1;

  const sanitizeValues = useCallback((input: IdeaKickoffValues): IdeaKickoffValues => {
    return (Object.entries(input) as Array<[StepKey, string | undefined]>).reduce<IdeaKickoffValues>((acc, [key, value]) => {
      const clean = value?.trim();
      if (clean) {
        acc[key] = clean;
      }
      return acc;
    }, {});
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setValues((prev) => ({
        ...prev,
        [currentStep.id]: value,
      }));
      if (error) {
        setError(null);
      }
    },
    [currentStep.id, error]
  );

  const goToStep = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), STEPS.length - 1);
    setStepIndex(clamped);
    setError(null);
  }, []);

  const handleNext = useCallback(() => {
    const raw = values[currentStep.id] ?? "";
    const trimmed = raw.trim();
    if (currentStep.required && trimmed.length === 0) {
      setError("Let’s capture a quick note before moving on.");
      return;
    }

    const merged: IdeaKickoffValues = {
      ...values,
      [currentStep.id]: trimmed,
    };
    setValues(merged);

    if (!isLastStep) {
      goToStep(stepIndex + 1);
      return;
    }

    setError(null);
    onComplete(sanitizeValues(merged));
  }, [currentStep, goToStep, isLastStep, onComplete, sanitizeValues, stepIndex, values]);

  const handleSkip = useCallback(() => {
    if (currentStep.required) {
      handleNext();
      return;
    }

    const merged: IdeaKickoffValues = {
      ...values,
      [currentStep.id]: "",
    };
    setValues(merged);

    if (isLastStep) {
      onComplete(sanitizeValues(merged));
      return;
    }

    goToStep(stepIndex + 1);
    setError(null);
  }, [currentStep, goToStep, handleNext, isLastStep, onComplete, sanitizeValues, stepIndex, values]);

  const currentValue = values[currentStep.id] ?? "";
  const CurrentIcon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-indigo-700">
            <CurrentIcon className="w-5 h-5" />
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {currentStep.variant === "textarea" ? (
            <Textarea
              key={currentStep.id}
              value={currentValue}
              placeholder={currentStep.placeholder}
              onChange={(event) => handleChange(event.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
          ) : (
            <Input
              key={currentStep.id}
              value={currentValue}
              placeholder={currentStep.placeholder}
              onChange={(event) => handleChange(event.target.value)}
              autoFocus
            />
          )}

          <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wide">
            <span>
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            {currentStep.required && <span>Required</span>}
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (stepIndex === 0) {
                onClose();
                return;
              }
              goToStep(stepIndex - 1);
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            {stepIndex === 0 ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-2">
            {!currentStep.required && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
              >
                Skip
              </Button>
            )}
            <Button type="button" onClick={handleNext}>
              {isLastStep ? "Save idea" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
