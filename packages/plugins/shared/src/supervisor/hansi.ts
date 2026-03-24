/**
 * (H)elper for (A)NSI.
 */
import stripAnsi from "strip-ansi";

const ESC = `\x1b`;
const CSI = ESC + `[`;

export class Hansi {
  static pad(lines = 1): void {
    for (let i = 0; i < lines; i++) {
      process.stdout.write(`\n`);
    }
    Hansi.cursorUp(lines);
  }

  static cursorUp(lines = 1): void {
    process.stdout.write(CSI + `${lines}A`);
  }

  static clearScreenDown(): void {
    process.stdout.write(CSI + `J`);
  }

  static linesRequired(content: string, width: number): number {
    const wrapRegex = new RegExp(`([^\n]{0,${width}})(\n)?`, `gm`); // Ensure we are no wider than width
    const wrappedContent = stripAnsi(content).match(wrapRegex) ?? [``];

    return wrappedContent.length - 1;
  }
}
