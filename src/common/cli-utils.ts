import { relative } from "path";
import { Usage } from "./model";

function printUnused(
  usages: Record<string, Usage>,
  label: "component" | "pipe" | "service" | "directive"
) {
  const unused = Object.values(usages)
    .filter(usage => usage.probablyUnused)
    .sort(compareUsagesByFilePath);
  if (!unused.length) {
    process.stdout.write(`\nNo unused ${label}s found\n\n`);
    return;
  }
  const longestUnusedClassName = Math.max(
    ...unused.map(({ className }) => className.length)
  );
  process.stdout.write(
    `\nFound ${unused.length} probably unused ${label}(s)\n`
  );
  unused.forEach(usage => {
    process.stdout.write(
      ` - ${usage.className.padEnd(longestUnusedClassName)} ${relative(
        "./",
        usage.filePath
      )}\n`
    );
  });
  process.stdout.write(`\n`);
}

function printProgressBar(
  current: number,
  total: number,
  label: string = "Progress"
) {
  const percentage = Math.floor((current / total) * 100);
  const rest = 100 - percentage;
  process.stdout.clearLine(-1);
  process.stdout.write(
    `\r${label}: ${"".padEnd(percentage, "=")}${"".padEnd(
      rest,
      "-"
    )} [${current}/${total}]`
  );
  if (current === total) {
    process.stdout.write("\n");
  }
}

function printProgress(
  current: number,
  total: number,
  label: string = "Progress"
) {
  const percentage = Math.floor((current / total) * 100);
  process.stdout.clearLine(-1);
  process.stdout.write(`\r${label}: ${current}/${total} ${percentage}%`);
  if (current === total) {
    process.stdout.write("\n");
  }
}

function compareUsagesByFilePath(a: Usage, b: Usage): number {
  return a.filePath.localeCompare(b.filePath);
}

export { printUnused, printProgress };
