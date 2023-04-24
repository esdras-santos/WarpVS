import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';


export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
		"warpvs-sidebar",
		sidebarProvider
		)
	);
	
	context.subscriptions.push(vscode.commands.registerCommand('warpvs.voyager', async () => {
		const answer = await vscode.window.showInformationMessage('Open TX with Voyager', 'Open');
		if(answer === "Open"){

		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('warpvs.transpile', async () => {
		await vscode.window.showInformationMessage('Transpiling')
	}));
}

export function deactivate() {}
