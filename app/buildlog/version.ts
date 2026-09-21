import type { BuildlogItem } from "./types";

type ParsedVersion = {
  core: [string, string, string];
  prerelease: string[] | null;
};

const numericWithLeadingZero = (value: string) =>
  value.length > 1 && value.startsWith("0");

export function parseSemanticVersion(value: string): ParsedVersion | null {
  const match = value
    .trim()
    .match(
      /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/,
    );
  if (!match) return null;

  const core: [string, string, string] = [match[1], match[2], match[3] || "0"];
  if (core.some(numericWithLeadingZero)) return null;

  const prerelease = match[4]?.split(".") || null;
  if (
    prerelease?.some(
      (identifier) => /^\d+$/.test(identifier) && numericWithLeadingZero(identifier),
    )
  ) {
    return null;
  }
  return { core, prerelease };
}

function compareNumeric(left: string, right: string) {
  if (left.length !== right.length) return left.length - right.length;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function comparePrerelease(left: string[] | null, right: string[] | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] === undefined) return -1;
    if (right[index] === undefined) return 1;
    const leftNumeric = /^\d+$/.test(left[index]);
    const rightNumeric = /^\d+$/.test(right[index]);
    if (leftNumeric && rightNumeric) {
      const difference = compareNumeric(left[index], right[index]);
      if (difference !== 0) return difference;
    } else if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    } else if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return 0;
}

export function compareShippedVersions(left: BuildlogItem, right: BuildlogItem) {
  const leftVersion = parseSemanticVersion(left.badge);
  const rightVersion = parseSemanticVersion(right.badge);
  if (leftVersion && rightVersion) {
    for (let index = 0; index < leftVersion.core.length; index += 1) {
      const difference = compareNumeric(
        leftVersion.core[index],
        rightVersion.core[index],
      );
      if (difference !== 0) return -difference;
    }
    return -comparePrerelease(leftVersion.prerelease, rightVersion.prerelease);
  }
  if (leftVersion) return -1;
  if (rightVersion) return 1;
  return left.display_order - right.display_order;
}

export function sortShippedNewest(items: BuildlogItem[]) {
  return [...items].sort(compareShippedVersions);
}

export function getLatestShippedVersion(
  items: BuildlogItem[],
  fallback: string,
) {
  return sortShippedNewest(items).find((item) => parseSemanticVersion(item.badge))
    ?.badge || fallback;
}
