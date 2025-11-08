export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const distanceBetweenPoints = (a: Point, b: Point) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const orientation = (p: Point, q: Point, r: Point) => {
  const value = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(value) < 0.000001) return 0;
  return value > 0 ? 1 : 2;
};

const onSegment = (p: Point, q: Point, r: Point) => {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
};

export const segmentsIntersect = (p1: Point, q1: Point, p2: Point, q2: Point) => {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
};

export const segmentIntersectsRect = (p1: Point, p2: Point, rect: Rect) => {
  const rectPoints: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  // Segment inside rect
  if (
    pointInRect(p1, rect) ||
    pointInRect(p2, rect)
  ) {
    return true;
  }

  // Intersect with any rect edge
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    if (segmentsIntersect(p1, p2, rectPoints[i], rectPoints[next])) {
      return true;
    }
  }
  return false;
};

export const pointInRect = (point: Point, rect: Rect) => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

export const pointInPolygon = (point: Point, polygon: Point[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x <
        ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) +
          xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const rectInsidePolygon = (rect: Rect, polygon: Point[]) => {
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  return corners.every((corner) => pointInPolygon(corner, polygon));
};

export const rectIntersectsPolygon = (rect: Rect, polygon: Point[]) => {
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  if (corners.some((corner) => pointInPolygon(corner, polygon))) {
    return true;
  }
  // Check polygon edges intersecting rect
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    if (segmentIntersectsRect(p1, p2, rect)) {
      return true;
    }
  }
  return false;
};
