export type WhiteboardTool = "none" | "eraser" | "lasso" | "rectangle" | "freehand";
export type LassoMode = "partial" | "full";

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface RectangleShapePayload {
  kind: "rectangle";
  position: WhiteboardPoint;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  borderRadius: number;
}

export interface FreehandShapePayload {
  kind: "freehand";
  position: WhiteboardPoint;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  points: WhiteboardPoint[];
}

export type WhiteboardShapePayload = RectangleShapePayload | FreehandShapePayload;

export interface WhiteboardShapeData extends WhiteboardShapePayload {
  id?: string;
}
