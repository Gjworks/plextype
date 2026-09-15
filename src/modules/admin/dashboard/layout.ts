export const DASHBOARD_WIDGET_STORAGE_KEY = 'gjworks.admin.dashboard.widgets';

export type WidgetColSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type PlacedWidget = { id: string; colSpan: WidgetColSpan };

const legacyWidths: Record<string, WidgetColSpan> = { small: 4, medium: 6, wide: 8, full: 12 };

export function parseDashboardLayout(raw: string | null, defaults: Record<string, WidgetColSpan>): PlacedWidget[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.flatMap((item): PlacedWidget[] => {
      const id = typeof item === 'string' ? item : item?.id;
      if (typeof id !== 'string' || !Object.hasOwn(defaults, id) || seen.has(id)) return [];
      seen.add(id);
      const width = item?.colSpan;
      const colSpan = Number.isInteger(width) && width >= 3 && width <= 12
        ? width as WidgetColSpan
        : typeof item?.size === 'string' && Object.hasOwn(legacyWidths, item.size)
          ? legacyWidths[item.size]
          : defaults[id];
      return [{ id, colSpan }];
    });
  } catch {
    return [];
  }
}
