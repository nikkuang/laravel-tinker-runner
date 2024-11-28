import OutputChannel from "./outputChannel";
import * as vscode from "vscode";
import { getCoreNodeModule, getLaravelWorkingDirectory } from "./utils";
import * as nodePty from "node-pty";
import { EXTENSION_NAME } from "./constants/app";

interface NodePty {
  spawn(
    file: string,
    args: string[] | string,
    options: nodePty.IPtyForkOptions | nodePty.IWindowsPtyForkOptions
  ): nodePty.IPty;
}

export default class Tinker {
  private static _instance: Tinker | null = null;
  private static _initializing: boolean = false;
  private readonly eventEmitter = new vscode.EventEmitter<string>();

  private pty: nodePty.IPty | null = null;
  private terminal: vscode.Terminal | null = null;
  private nodePty: NodePty | null = null;

  private constructor(
    private outputChannel: typeof OutputChannel = OutputChannel
  ) {}

  private getNodePty(): NodePty {
    if (!this.nodePty) {
      this.nodePty = getCoreNodeModule("node-pty") as NodePty;
    }
    return this.nodePty;
  }

  private async initializePty(): Promise<void> {
    const defaultShell: string = (await import("default-shell")).default;
    const nodePty = this.getNodePty();

    if (!nodePty) {
      throw new Error("Unable to load node-pty.");
    }

    let cwd: string | null = getLaravelWorkingDirectory(
      vscode.workspace.workspaceFolders
    );

    if (!cwd) {
      throw new Error("Unable to locate Laravel project.");
      return;
    }

    this.pty = nodePty.spawn(defaultShell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd,
      env: process.env,
    });

    this.pty.onData((data: string) => {
      this.outputChannel.append(data + "test");
      this.eventEmitter.fire(data);
    });
  }

  private async initializeTerminal(): Promise<void> {
    this.terminal = vscode.window.createTerminal({
      name: "Tinker",
      pty: {
        close: () => {
          this.outputChannel.append("Terminal Closed");
          this.dispose();
        },
        open: () => {
          this.outputChannel.append("Terminal Ready");
        },
        handleInput: (data: string) => {
          this.writeToPty(data);
        },
        onDidWrite: this.eventEmitter.event,
      } as vscode.Pseudoterminal,
    });
  }

  private startTinker(): void {
    this.writeToPty("php artisan tinker\r");
  }

  private writeToPty(data: string): void {
    if (!this.pty) {
      this.outputChannel.appendLine("Unable to write to pty.");
      return;
    }

    this.pty.write(data);
  }

  private writeToTerminal(data: string): void {
    this.eventEmitter.fire(data);
  }

  private async clearTerminal(): Promise<void> {
    if (this.terminal) {
      await vscode.commands.executeCommand("workbench.action.terminal.clear");
    }
  }

  private showTerminal(): void {
    if (this.terminal) {
      this.terminal.show();
    }
  }

  private dispose(): void {
    this.pty?.kill();
    this.pty = null;
    Tinker._instance = null; // Reset the singleton
  }

  static async run(code: string): Promise<void> {
    const tinker = await Tinker.instance();
    tinker.showTerminal();
    tinker.writeToPty("\r");
    await tinker.clearTerminal();
    tinker.writeToPty(code);
    tinker.writeToPty("\r");
  }

  static async instance(): Promise<Tinker> {
    if (!Tinker._instance && !Tinker._initializing) {
      Tinker._initializing = true;
      Tinker._instance = new Tinker();
      try {
        await Tinker._instance.initializePty();
        await Tinker._instance.initializeTerminal();
        Tinker._instance.startTinker();
      } catch (error: any) {
        Tinker._instance = null;
        vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${error.message}`);
        throw error;
      } finally {
        Tinker._initializing = false;
      }
    }

    while (Tinker._initializing) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for initialization
    }

    return Tinker._instance!;
  }

  static dispose(): void {
    Tinker.instance().then((tinker: Tinker) => tinker.dispose());
  }
}
