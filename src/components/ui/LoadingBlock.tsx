const BAR_WIDTHS = ["100%", "92%", "84%", "76%", "68%", "60%"];

export function LoadingBlock() {
  return (
    <div className="flex flex-col gap-3">
      {BAR_WIDTHS.map((width) => (
        <div
          key={width}
          className="h-3 rounded-8 bg-surface-2"
          style={{ width }}
        />
      ))}
    </div>
  );
}
