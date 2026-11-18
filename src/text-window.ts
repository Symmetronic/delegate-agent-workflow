export const TEXT_COLUMNS = 34;
export const TEXT_LINES = 4;

export type TextPage = readonly string[];

function wrapWords(text: string, columns: number): readonly string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter((part) => part !== "")) {
    const chunks: string[] = [];
    for (let start = 0; start < word.length; start += columns) {
      chunks.push(word.slice(start, start + columns));
    }
    for (const chunk of chunks) {
      const joined = line === "" ? chunk : `${line} ${chunk}`;
      if (joined.length <= columns) {
        line = joined;
      } else {
        lines.push(line);
        line = chunk;
      }
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines;
}

export function paginate(
  text: string,
  columns: number = TEXT_COLUMNS,
  linesPerPage: number = TEXT_LINES,
): readonly TextPage[] {
  const lines = wrapWords(text, columns);
  const pages: TextPage[] = [];
  for (let start = 0; start < lines.length; start += linesPerPage) {
    pages.push(lines.slice(start, start + linesPerPage));
  }
  return pages;
}
