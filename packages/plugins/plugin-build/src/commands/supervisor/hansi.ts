/**
 * (H)elper for (A)NSI.
 */
import stripAnsi from "strip-ansi";

const ESC = `\x1b`;
const CSI = ESC + `[`;

export class Hansi {
  static row = 0;

  static column = 0;

  static pad(lines = 1): void {
    for (let i = 0; i < lines; i++) {
      process.stdout.write(`\n`);
    }
    Hansi.cursorUp(lines);
  }

  static cursorUp(lines = 1): void {
    process.stdout.write(CSI + `${lines}A`);
  }

  static cursorSave(): void {
    process.stdout.write(CSI + `s`);
  }

  static cursorRestore(): void {
    process.stdout.write(CSI + `u`);
  }

  static autoWrap(active: boolean): void {
    active
      ? process.stdout.write(CSI + `?7h`)
      : process.stdout.write(CSI + `?7l`);
  }

  static clearScreenDown(): void {
    process.stdout.write(CSI + `J`);
  }

  static async cursorPositionReport(): Promise<{ x: number; y: number }> {
    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.once("data", (data) => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        const [y, x] = data
          .slice(2, data.length - 1)
          .toString()
          .split(";")
          .map(Number);

        resolve({ x, y });
      });
      process.stdout.write(CSI + `6n`);
    });
  }

  static setScrollableRegion(top: number, bottom: number): void {
    process.stdout.write(CSI + `${top};${bottom}r`);
  }

  static resetScrollableRegion(): void {
    process.stdout.write(CSI + `r`);
  }

  static moveTo(position: { x: number; y: number }): void {
    process.stdout.write(CSI + `${position.y};${position.x}H`);
  }

  static cursorHome(): void {
    process.stdout.write(CSI + `H`);
  }

  static alternateScreen(): void {
    process.stdout.write(CSI + `?1049h`);
  }

  static mainScreen(): void {
    process.stdout.write(CSI + `?1049l`);
  }

  static linesRequired(content: string, width: number): number {
    const wrapRegex = new RegExp(`([^\n]{0,${width}})(\n)?`, `gm`); // Ensure we are no wider than width
    const wrappedContent = stripAnsi(content).match(wrapRegex) ?? [``];

    return wrappedContent.length - 1;
  }
}
