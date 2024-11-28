import * as vscode from "vscode";
import { EXTENSION_ID, EXTENSION_NAME } from "./constants/app";
import runCommand from "./commands/run";
import OutputChannel from "./outputChannel";
import Tinker from "./tinker";

export function activate(context: vscode.ExtensionContext) {
  OutputChannel.appendLine(
    `Congratulations, your extension "${EXTENSION_NAME}" is now active!`
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${EXTENSION_ID}.run`, runCommand)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  OutputChannel.dispose();
  Tinker.dispose();
}
