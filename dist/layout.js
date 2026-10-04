// Screen-space placement shared by live labels and exported images.
// Keep each column inside its bounds; hide excess labels rather than overlap.
export function arrangeLabels(items, width, height, {top = 105, bottom = 74, gap = 8, left = 14, right = 14} = {}) {
  const available = height - top - bottom;
  const result = [];
  for (const side of [-1, 1]) {
    const column = items.filter(i => (i.x < width / 2 ? -1 : 1) === side)
      .sort((a, b) => (b.selected - a.selected) || a.y - b.y);
    let used = -gap;
    const kept = column.filter(i => {
      if (used + i.height + gap > available) return false;
      used += i.height + gap;
      return true;
    }).sort((a, b) => a.y - b.y);
    let y = top;
    for (const i of kept) {
      i.labelY = Math.max(y, Math.min(height - bottom - i.height, i.y - i.height / 2));
      y = i.labelY + i.height + gap;
    }
    let end = height - bottom;
    for (let k = kept.length - 1; k >= 0; k--) {
      const i = kept[k];
      i.labelY = Math.min(i.labelY, end - i.height);
      end = i.labelY - gap;
      i.labelX = side < 0 ? left : width - right - i.width;
      i.side = side;
      result.push(i);
    }
  }
  return result;
}
