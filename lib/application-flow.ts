import { applicationStatuses, type SavedApplication } from "./applications.ts";

export function applicationCounts(applications: Pick<SavedApplication, "status">[]) {
  return applicationStatuses.map(status => applications.filter(application => application.status === status).length);
}

export function flowLayout(values: number[]) {
  const counts = applicationStatuses.map((_, index) => Math.max(0, Number.isFinite(values[index]) ? values[index] : 0));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const scale = total ? Math.min(210 / total, 38 / Math.max(...counts)) : 0;
  const height = total * scale;
  let cursor = 200 - height / 2;
  return {
    total, height, top: 200 - height / 2,
    branches: applicationStatuses.map((status, index) => {
      const thickness = counts[index] * scale;
      const y = 55 + index * 58;
      const start = cursor;
      cursor += thickness;
      const top = y - thickness / 2;
      return { status, count: counts[index], thickness, y, top,
        path: `M 218 ${start} C 420 ${start}, 472 ${top}, 680 ${top} L 680 ${top + thickness} C 472 ${top + thickness}, 420 ${start + thickness}, 218 ${start + thickness} Z` };
    }),
  };
}
