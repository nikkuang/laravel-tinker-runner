import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// https://github.com/microsoft/vscode/issues/84439#issuecomment-552328194
export function getCoreNodeModule(moduleName: string): any {
  try {
    return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
  } catch (err) {}

  try {
    return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
  } catch (err) {}

  return null;
}

export function getLaravelWorkingDirectory(
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined
): string | null {
  if (workspaceFolders && workspaceFolders.length > 0) {
    for (let i = 0; i < workspaceFolders.length; i++) {
      const workspacePath = workspaceFolders[i].uri.fsPath;

      // Check if 'artisan' exists in the root directory
      const artisanPath = path.join(workspacePath, "artisan");
      if (fs.existsSync(artisanPath)) {
        return workspacePath;
      } else {
        // Check if 'composer.json' lists Laravel
        const composerPath = path.join(workspacePath, "composer.json");
        if (fs.existsSync(composerPath)) {
          const composerContent = JSON.parse(
            fs.readFileSync(composerPath, "utf8")
          );
          if (
            composerContent.require &&
            composerContent.require["laravel/framework"]
          ) {
            return workspacePath;
          }
        }
      }
    }
  }

  return null;
}

export function retrieveContent(
  editor: vscode.TextEditor | undefined
): string | null {
  if (!editor) {
    return null;
  }

  const selection = editor.selection;
  let phpCode = selection.isEmpty
    ? editor.document.getText()
    : editor.document.getText(selection);

  return phpCode.trim();
}

export function minifyPhp(phpCode: string): string {
  // Remove PHP tags
  phpCode = phpCode.replace(/<\?php|<\?|<\?=/g, "").replace(/\?>/g, "");

  // Remove single-line comments
  phpCode = phpCode.replace(/\/\/.*$/gm, ""); // Matches `//` comments
  phpCode = phpCode.replace(/#.*$/gm, ""); // Matches `#` comments

  // Remove multi-line comments
  phpCode = phpCode.replace(/\/\*[\s\S]*?\*\//g, ""); // Matches `/* ... */` comments

  // Trim unnecessary spaces and line breaks
  phpCode = phpCode
    .replace(/\s+/g, " ") // Collapse multiple spaces into a single space
    .replace(/>\s+</g, "><") // Trim spaces between PHP tags
    .trim();

  return phpCode;
}
