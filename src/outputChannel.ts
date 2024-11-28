import * as vscode from 'vscode';
import { OUTPUT_CHANNEL_NAME } from './constants/app';

export default class OutputChannel {
  private static _channel: vscode.OutputChannel;

  static get channel(): vscode.OutputChannel {
    if (!OutputChannel._channel) {
      OutputChannel._channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
    }

    return OutputChannel._channel;
  }

  static appendLine(message: string): void {
    OutputChannel.channel.appendLine(message); 
  }

  static append(message: string): void {
    OutputChannel.channel.append(message); 
  }

  static show(): void {
    OutputChannel.channel.show();
  }

  static clear(): void {
    OutputChannel.channel.clear();
  }

  static dispose(): void {
    OutputChannel.channel.dispose();
  }
}
