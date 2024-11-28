import Tinker from "../tinker";
import { minifyPhp, retrieveContent } from "../utils";
import * as vscode from "vscode";

export default function () {
    if (!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage("No active editor open.");
        return;
    }

    let content: string|null = retrieveContent(vscode.window.activeTextEditor);

    if (!content) {
        vscode.window.showErrorMessage("No code to run.");
        return;
    }

    Tinker.run(minifyPhp(content));
}