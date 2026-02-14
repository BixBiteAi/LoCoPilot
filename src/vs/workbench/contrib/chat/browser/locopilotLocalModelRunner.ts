/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ICustomLanguageModelsService } from '../common/customLanguageModelsService.js';
import { ChatConfiguration } from '../common/constants.js';
import { ILoCoPilotFileLog } from './locopilotFileLog.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import {
	detectLlamaBackend,
	getRecommendedBackend,
	getDefaultLlamaServerPaths,
	getLlamaCppServerCommand,
	getLlamaServerBaseUrl,
	LOCOPILOT_LLAMA_SERVER_PORT,
	LlamaBackend
} from './locopilotLlamaCppServer.js';
import { IPathService } from '../../../services/path/common/pathService.js';

/** Command IDs for terminal (avoid direct terminal contrib import for compile). */
const CMD_TERMINAL_NEW = 'workbench.action.terminal.new';
const CMD_TERMINAL_SEND_SEQUENCE = 'workbench.action.terminal.sendSequence';

export class LoCoPilotLocalModelRunner extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'locopilot.localModelRunner';

	constructor(
		@ICustomLanguageModelsService private readonly customLanguageModelsService: ICustomLanguageModelsService,
		@ICommandService private readonly commandService: ICommandService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IFileService private readonly fileService: IFileService,
		@IPathService private readonly pathService: IPathService,
		@ILogService private readonly logService: ILogService,
		@ILoCoPilotFileLog private readonly locopilotFileLog: ILoCoPilotFileLog,
	) {
		super();
		this._registerCommands();
	}

	private _registerCommands(): void {
		const self = this;
		registerAction2(class extends Action2 {
			constructor() {
				super({ id: 'locopilot.startLlamaServer', title: { value: 'Start Llama Server', original: 'Start Llama Server' } });
			}
			async run(accessor: ServicesAccessor, modelId?: string): Promise<void> {
				if (modelId) {
					await self.startServerInTerminal(modelId);
				}
			}
		});
		registerAction2(class extends Action2 {
			constructor() {
				super({ id: 'locopilot.runOllamaModel', title: { value: 'Run Ollama Model', original: 'Run Ollama Model' } });
			}
			async run(accessor: ServicesAccessor, modelId?: string): Promise<void> {
				if (modelId) {
					await self.runOllamaModelInTerminal(modelId);
				}
			}
		});
	}

	/**
	 * Returns the backend that will be used (or is recommended) for running the model.
	 * Priority: GPU (CUDA) > Apple Metal > Vulkan > CPU.
	 */
	getBackend(): LlamaBackend {
		return getRecommendedBackend();
	}

	/**
	 * Returns ordered list of backends to try (best first).
	 */
	getBackendPriority(): LlamaBackend[] {
		return detectLlamaBackend();
	}

	/**
	 * Base URL for the local llama server (OpenAI-compatible). Use this when sending chat requests.
	 */
	getServerBaseUrl(): string {
		return getLlamaServerBaseUrl(LOCOPILOT_LLAMA_SERVER_PORT);
	}

	/**
	 * Command and args to run the llama.cpp server for the given model.
	 * Caller can run this in a terminal or via a process spawner.
	 * Uses locopilot.llamaCpp.serverPath when set (works on Mac, Windows, Linux).
	 */
	getServerRunConfig(modelId: string): { command: string; args: string[]; backend: LlamaBackend } | undefined {
		const model = this.customLanguageModelsService.getCustomModels().find(m => m.id === modelId);
		if (!model || !model.localPath) {
			return undefined;
		}
		const backend = getRecommendedBackend();
		const serverPath = this.configurationService.getValue<string>(ChatConfiguration.LocopilotLlamaCppServerPath);
		const { command, args } = getLlamaCppServerCommand(model.localPath, backend, serverPath);
		return { command, args, backend };
	}

	/**
	 * Resolves the path to use for llama-server: configured path, or first conventional path that exists (~/llama.cpp/build/bin), or undefined (use PATH).
	 */
	private async resolveServerPath(): Promise<string | undefined> {
		const configured = this.configurationService.getValue<string>(ChatConfiguration.LocopilotLlamaCppServerPath)?.trim();
		if (configured) {
			return configured;
		}
		const userHome = await this.pathService.userHome();
		const homeFs = userHome.fsPath;
		const pathsToTry = getDefaultLlamaServerPaths(homeFs);
		for (const p of pathsToTry) {
			try {
				const stat = await this.fileService.stat(URI.file(p));
				if (stat.isFile || stat.isDirectory) {
					return p;
				}
			} catch {
				// skip
			}
		}
		return undefined;
	}

	/** Resolves localPath to a .gguf file path (if it's a directory, finds first .gguf). */
	private async resolveModelFilePath(localPath: string): Promise<string> {
		const uri = URI.file(localPath);
		try {
			const stat = await this.fileService.stat(uri);
			if (stat.isFile && localPath.toLowerCase().endsWith('.gguf')) {
				return localPath;
			}
			if (stat.isDirectory) {
				const dirStat = await this.fileService.resolve(uri);
				const children = dirStat.children ?? [];
				const gguf = children.find(c => c.name.toLowerCase().endsWith('.gguf'));
				if (gguf) {
					return gguf.resource.fsPath;
				}
				for (const c of children) {
					if (c.isDirectory) {
						const subStat = await this.fileService.resolve(c.resource);
						const subGguf = (subStat.children ?? []).find(x => x.name.toLowerCase().endsWith('.gguf'));
						if (subGguf) {
							return subGguf.resource.fsPath;
						}
					}
				}
			}
		} catch {
			// ignore
		}
		return localPath;
	}

	/**
	 * Starts the llama.cpp server for the given model in a new terminal.
	 * Uses recommended backend (GPU/Metal/CPU). The server runs until the terminal is closed.
	 */
	async startServerInTerminal(modelId: string): Promise<void> {
		const model = this.customLanguageModelsService.getCustomModels().find(m => m.id === modelId);
		if (!model || !model.localPath) {
			this._log(`[LoCoPilot Runner] Model ${modelId} not found or has no local path.`);
			return;
		}
		const modelPath = await this.resolveModelFilePath(model.localPath);
		const backend = getRecommendedBackend();
		const serverPath = await this.resolveServerPath();
		const { command, args } = getLlamaCppServerCommand(modelPath, backend, serverPath);
		this._log(`[LoCoPilot Runner] Starting llama.cpp server for model ${modelId} with backend: ${backend}`);
		// Build command line for the user's shell (path with spaces/quotes escaped)
		const modelPathArg = args[args.indexOf('-m') + 1];
		const escapedPath = modelPathArg && (modelPathArg.includes(' ') || modelPathArg.includes('"'))
			? `"${modelPathArg.replace(/"/g, '\\"')}"`
			: modelPathArg;
		const argsCli = [...args];
		const mIdx = argsCli.indexOf('-m');
		if (mIdx >= 0 && argsCli[mIdx + 1] !== undefined) {
			argsCli[mIdx + 1] = escapedPath ?? argsCli[mIdx + 1];
		}
		const cmdLine = [command, ...argsCli].join(' ');
		
		this._log(`[LoCoPilot Runner] Executing: ${cmdLine}`);
		if (!serverPath) {
			this._log(`[LoCoPilot Runner] Note: If this fails, install llama.cpp (e.g. clone and build to ~/llama.cpp) or set the path in LoCoPilot Settings → Agent Settings → Llama.cpp server path.`);
		}
		
		try {
			await this.commandService.executeCommand(CMD_TERMINAL_NEW);
			// Brief delay so the new terminal is focused before we send the command
			await new Promise<void>(resolve => setTimeout(resolve, 400));
			await this.commandService.executeCommand(CMD_TERMINAL_SEND_SEQUENCE, { text: cmdLine + '\n' });
			this._log(`[LoCoPilot Runner] Terminal started with: ${cmdLine}`);
		} catch (e) {
			this._log(`[LoCoPilot Runner] Failed to start terminal: ${e}`);
			throw e;
		}
	}

	/**
	 * Runs the Ollama model in a new terminal.
	 */
	async runOllamaModelInTerminal(modelId: string): Promise<void> {
		const model = this.customLanguageModelsService.getCustomModels().find(m => m.id === modelId);
		if (!model || model.provider !== 'ollama') {
			this._log(`[LoCoPilot Runner] Ollama model ${modelId} not found.`);
			return;
		}
		const baseUrl = (model.localPath || 'http://localhost:11434').replace(/\/$/, '');
		// If baseUrl is not default, we might need to set OLLAMA_HOST
		const hostEnv = baseUrl !== 'http://localhost:11434' ? `OLLAMA_HOST=${baseUrl} ` : '';
		const cmdLine = `${hostEnv}ollama run ${model.modelName}`;
		this._log(`[LoCoPilot Runner] Running Ollama model: ${cmdLine}`);
		try {
			await this.commandService.executeCommand(CMD_TERMINAL_NEW);
			await new Promise<void>(resolve => setTimeout(resolve, 400));
			await this.commandService.executeCommand(CMD_TERMINAL_SEND_SEQUENCE, { text: cmdLine + '\n' });
		} catch (e) {
			this._log(`[LoCoPilot Runner] Failed to run Ollama in terminal: ${e}`);
			throw e;
		}
	}

	runModel(modelId: string): void {
		this.startServerInTerminal(modelId);
	}

	private _log(msg: string, ...args: unknown[]): void {
		this.logService.info(msg, ...args);
		this.locopilotFileLog.log(msg, ...args);
	}
}
