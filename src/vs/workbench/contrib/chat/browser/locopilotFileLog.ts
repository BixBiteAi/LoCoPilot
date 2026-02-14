/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { joinPath } from '../../../../base/common/resources.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IEnvironmentService } from '../../../../platform/environment/common/environment.js';
import { ILogger, ILoggerService } from '../../../../platform/log/common/log.js';

export const ILoCoPilotFileLog = createDecorator<ILoCoPilotFileLog>('loCoPilotFileLog');

export interface ILoCoPilotFileLog {
	readonly _serviceBrand: undefined;
	/** Append a line to the LoCoPilot .log file (in addition to console). Use for [LoCoPilot*] messages so they are not trimmed. */
	log(message: string, ...args: unknown[]): void;
}

const LOG_ID = 'locopilot';
const LOG_NAME = 'LoCoPilot';

function formatArg(a: unknown): string {
	if (a === null) return 'null';
	if (a === undefined) return 'undefined';
	if (typeof a === 'string') return a;
	if (typeof a === 'number' || typeof a === 'boolean') return String(a);
	try {
		return JSON.stringify(a);
	} catch {
		return String(a);
	}
}

export class LoCoPilotFileLog extends Disposable implements ILoCoPilotFileLog {
	declare readonly _serviceBrand: undefined;
	private readonly _fileLogger: ILogger;

	constructor(
		@ILoggerService loggerService: ILoggerService,
		@IEnvironmentService environmentService: IEnvironmentService,
	) {
		super();
		const logUri = joinPath(environmentService.logsHome, `${LOG_ID}.log`);
		this._fileLogger = this._register(loggerService.createLogger(logUri, { id: LOG_ID, name: LOG_NAME }));
	}

	log(message: string, ...args: unknown[]): void {
		const line = args.length ? `${message} ${args.map(formatArg).join(' ')}` : message;
		this._fileLogger.info(line);
	}
}
