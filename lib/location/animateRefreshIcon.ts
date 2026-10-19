export function animateRefreshIcon(button: Element): void {
  const icon = button.querySelector("svg");
  if (!icon) return;

  icon.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration: 700, easing: "linear" }
  );
}
