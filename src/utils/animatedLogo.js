import spinners from "cli-spinners";

const frames = spinners.dots.frames;

export function startDevFixLogo() {
  let i = 0;

  const timer = setInterval(() => {
    i = (i + 1) % frames.length;
  }, 80);

  return {
    frame: () => frames[i],
    stop: () => clearInterval(timer),
  };
}
