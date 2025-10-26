import { Node, Edge } from "reactflow";

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  // Add a new state to history
  push(state: HistoryState) {
    // Remove any states after current index (when user made changes after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push(this.deepClone(state));
    this.currentIndex++;

    // Maintain max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // Check if there's a previous state to undo to
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if there's a next state to redo to
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Undo to previous state
  undo(): HistoryState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.deepClone(this.history[this.currentIndex]);
  }

  // Redo to next state
  redo(): HistoryState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.deepClone(this.history[this.currentIndex]);
  }

  // Get current state
  getCurrentState(): HistoryState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.deepClone(this.history[this.currentIndex]);
  }

  // Get history info for debugging/UI
  getHistoryInfo() {
    return {
      currentIndex: this.currentIndex,
      historyLength: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  // Clear all history
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  // Initialize with a state
  initialize(state: HistoryState) {
    this.clear();
    this.push(state);
  }

  // Deep clone to prevent mutation issues
  private deepClone(state: HistoryState): HistoryState {
    return {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };
  }
}
