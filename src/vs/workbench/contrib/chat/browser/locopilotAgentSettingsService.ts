/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { AGENT_SYSTEM_PROMPT_GENERAL, AGENT_SYSTEM_PROMPT_TOOLS_AND_INTERNAL, ASK_MODE_SYSTEM_PROMPT, TOOLS_PROMPT_WITHOUT_EDIT } from './agents/agentPrompts.js';

export const ILoCoPilotAgentSettingsService = createDecorator<ILoCoPilotAgentSettingsService>('locopilotAgentSettingsService');

const STORAGE_KEY_ASK_PROMPT = 'locopilot.agentSettings.askModeSystemPrompt';
const STORAGE_KEY_AGENT_PROMPT = 'locopilot.agentSettings.agentModeSystemPrompt';
const STORAGE_KEY_MAX_ITERATIONS = 'locopilot.agentSettings.maxIterationsPerRequest';
const STORAGE_KEY_AUTO_RUN_SANDBOX = 'locopilot.agentSettings.autoRunCommandsInSandbox';

export const DEFAULT_MAX_ITERATIONS = 25;

export interface ILoCoPilotAgentSettingsService {
	readonly _serviceBrand: undefined;

	getAskModeSystemPrompt(): string;
	getAgentModeSystemPrompt(): string;
	getFullAskModeSystemPrompt(): string;
	getFullAgentModeSystemPrompt(): string;
	getMaxIterationsPerRequest(): number;
	getAutoRunCommandsInSandbox(): boolean;

	setAskModeSystemPrompt(value: string): void;
	setAgentModeSystemPrompt(value: string): void;
	setMaxIterationsPerRequest(value: number): void;
	setAutoRunCommandsInSandbox(value: boolean): void;

	restoreAskModeSystemPromptDefault(): void;
	restoreAgentModeSystemPromptDefault(): void;
	restoreAllToDefault(): void;
}

export class LoCoPilotAgentSettingsService implements ILoCoPilotAgentSettingsService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) { }

	/** Returns only the general (user-editable) part of the Ask mode system prompt. */
	getAskModeSystemPrompt(): string {
		const stored = this.storageService.get(STORAGE_KEY_ASK_PROMPT, StorageScope.APPLICATION);
		return stored ?? '';
	}

	/** Returns only the general (user-editable) part of the Agent mode system prompt. */
	getAgentModeSystemPrompt(): string {
		const stored = this.storageService.get(STORAGE_KEY_AGENT_PROMPT, StorageScope.APPLICATION);
		return stored ?? '';
	}

	/** Returns full system prompt for Ask mode: general + tools (without edit). For use when sending to LLM. */
	getFullAskModeSystemPrompt(): string {
		const prompt = this.getAskModeSystemPrompt();
		return (prompt || ASK_MODE_SYSTEM_PROMPT) + TOOLS_PROMPT_WITHOUT_EDIT;
	}

	/** Returns full system prompt for Agent mode: general + tools. For use when sending to LLM. */
	getFullAgentModeSystemPrompt(): string {
		const prompt = this.getAgentModeSystemPrompt();
		return (prompt || AGENT_SYSTEM_PROMPT_GENERAL) + AGENT_SYSTEM_PROMPT_TOOLS_AND_INTERNAL;
	}

	getMaxIterationsPerRequest(): number {
		const stored = this.storageService.get(STORAGE_KEY_MAX_ITERATIONS, StorageScope.APPLICATION);
		if (stored === undefined || stored === '') {
			// Persist default so it's saved like other settings
			this.storageService.store(STORAGE_KEY_MAX_ITERATIONS, String(DEFAULT_MAX_ITERATIONS), StorageScope.APPLICATION, StorageTarget.USER);
			return DEFAULT_MAX_ITERATIONS;
		}
		const n = parseInt(stored, 10);
		return isNaN(n) || n < 1 ? DEFAULT_MAX_ITERATIONS : Math.min(100, Math.max(1, n));
	}

	setAskModeSystemPrompt(value: string): void {
		this.storageService.store(STORAGE_KEY_ASK_PROMPT, value, StorageScope.APPLICATION, StorageTarget.USER);
	}

	setAgentModeSystemPrompt(value: string): void {
		this.storageService.store(STORAGE_KEY_AGENT_PROMPT, value, StorageScope.APPLICATION, StorageTarget.USER);
	}

	setMaxIterationsPerRequest(value: number): void {
		const clamped = Math.min(100, Math.max(1, value));
		this.storageService.store(STORAGE_KEY_MAX_ITERATIONS, String(clamped), StorageScope.APPLICATION, StorageTarget.USER);
	}

	getAutoRunCommandsInSandbox(): boolean {
		return this.storageService.getBoolean(STORAGE_KEY_AUTO_RUN_SANDBOX, StorageScope.APPLICATION, false);
	}

	setAutoRunCommandsInSandbox(value: boolean): void {
		this.storageService.store(STORAGE_KEY_AUTO_RUN_SANDBOX, String(value), StorageScope.APPLICATION, StorageTarget.USER);
	}

	restoreAskModeSystemPromptDefault(): void {
		this.storageService.remove(STORAGE_KEY_ASK_PROMPT, StorageScope.APPLICATION);
	}

	restoreAgentModeSystemPromptDefault(): void {
		this.storageService.remove(STORAGE_KEY_AGENT_PROMPT, StorageScope.APPLICATION);
	}

	restoreAllToDefault(): void {
		this.storageService.remove(STORAGE_KEY_ASK_PROMPT, StorageScope.APPLICATION);
		this.storageService.remove(STORAGE_KEY_AGENT_PROMPT, StorageScope.APPLICATION);
		this.storageService.remove(STORAGE_KEY_MAX_ITERATIONS, StorageScope.APPLICATION);
		this.storageService.remove(STORAGE_KEY_AUTO_RUN_SANDBOX, StorageScope.APPLICATION);
	}
}
