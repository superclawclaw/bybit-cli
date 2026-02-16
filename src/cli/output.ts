import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * Format data as a pretty-printed JSON string.
 */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format data as a CLI table with styled headers.
 * Uses the project theme color #87ceeb (light blue) for header text.
 */
export function formatTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const table = new Table({
    head: headers.map((h) => chalk.hex('#87ceeb')(h)),
    style: { head: [], border: ['gray'] },
  });

  for (const row of rows) {
    table.push([...row]);
  }

  return table.toString();
}

/**
 * Options for outputResult.
 * Supports both single items and arrays.
 */
export interface OutputOptions<T> {
  readonly data: T | readonly T[];
  readonly jsonOutput: boolean;
  readonly headers: readonly string[];
  readonly toRow: (item: T) => readonly string[];
}

/**
 * Output data as either JSON or a formatted table.
 * When jsonOutput is true, prints pretty JSON to stdout.
 * When jsonOutput is false, converts data to table rows and prints a styled table.
 */
export function outputResult<T>(options: OutputOptions<T>): void {
  if (options.jsonOutput) {
    console.log(formatJson(options.data));
    return;
  }

  const items = Array.isArray(options.data) ? options.data : [options.data];
  const rows = items.map(options.toRow);
  console.log(formatTable(options.headers, rows));
}
