import * as vscode from 'vscode';
// import * as path from 'path';
import { SidebarProvider } from './SidebarProvider';
import path from 'path';
import { execSync } from 'child_process';


export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
		"warpvs-sidebar",
		sidebarProvider
		)
	);
	
	
	context.subscriptions.push(vscode.commands.registerCommand('warpvs.transpile', async () => {
		const f = vscode.window.activeTextEditor?.document.uri.path;
		const warpPath = path.resolve(__dirname, '..', 'bin', 'warp');
		console.log(warpPath);
		execSync(`${warpPath} ${f}`);
		
		vscode.window.showInformationMessage('Solidty file succefully transpiled!')
	}));
}

export function deactivate() {}
