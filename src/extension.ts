import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './SidebarProvider';
import { BASE_PATH, compileCairo, compileSolFiles, createCairoProject, handleTranspilationError, outputResult, postProcessCairoFile, transpile } from './export';


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
		const fpath = vscode.window.activeTextEditor?.document.uri.path.split('/')
		fpath?.pop
		const options = {
			dev: false,
			outputDir: `${fpath?.join('/')}/warp_output`,
			debugInfo: false,
			stubs: true,
			strict: true,
			warnings: true,
			compileCairo: true,
			formatCairo: false
		  }
		const f = vscode.window.activeTextEditor?.document.uri.path;
		const ast = compileSolFiles([f!], options);
		const contractToHashMap = new Map<string, string>();

		try {
			transpile(ast, options)
			.map(([fileName, cairoCode]) => {
				outputResult(path.parse(fileName).name, fileName, cairoCode, options, ast);
				return fileName;
			})
			.map((file) =>
				postProcessCairoFile(file, options.outputDir, options.debugInfo, contractToHashMap),
			)
			.forEach((file: string) => {
				createCairoProject(path.join(options.outputDir, file));
				if (options.compileCairo) {
				const { success, resultPath, abiPath } = compileCairo(
					path.join(options.outputDir, file),
					BASE_PATH,
					options,
				);
				if (!success) {
					if (resultPath !== undefined) {
					fs.unlinkSync(resultPath);
					}
					if (abiPath !== undefined) {
					fs.unlinkSync(abiPath);
					}
				}
				}
			});
		} catch (e) {
			handleTranspilationError(e);
		}
		vscode.window.showInformationMessage('Solidty file succefully transpiled!')
	}));
}

export function deactivate() {}
