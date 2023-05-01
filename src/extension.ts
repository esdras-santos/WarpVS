import * as vscode from 'vscode';
// import * as path from 'path';
import { SidebarProvider } from './SidebarProvider';
import { compileSolFiles } from './solCompile';
import { handleTranspilationError, transpile } from './transpiler';
import { outputResult } from './io';


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
		
		const f = vscode.window.activeTextEditor?.document.uri.path;
		const ast = compileSolFiles([f!], options);

		try {
			transpile(ast, options)
			.map(([fileName, cairoCode]) => {
				outputResult(path.parse(fileName).name, fileName, cairoCode, options, ast);
				return fileName;
			})
			
		} catch (e) {
			handleTranspilationError(e);
		}
		vscode.window.showInformationMessage('Solidty file succefully transpiled!')
	}));
}

export function deactivate() {}
