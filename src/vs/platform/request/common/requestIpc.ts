/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { bufferToStream, streamToBuffer, VSBuffer } from '../../../base/common/buffer.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { Emitter, Event } from '../../../base/common/event.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IChannel, IServerChannel } from '../../../base/parts/ipc/common/ipc.js';
import { IHeaders, IRequestContext, IRequestOptions } from '../../../base/parts/request/common/request.js';
import { AuthInfo, Credentials, IRequestService, IRequestToFileResult } from './request.js';

type RequestResponse = [
	{
		headers: IHeaders;
		statusCode?: number;
	},
	VSBuffer
];

export interface IRequestToFileProgressEvent {
	bytesReceived: number;
	contentLength: number | undefined;
}

const DOWNLOAD_PROGRESS_EVENT = 'onDownloadProgress';

export class RequestChannel implements IServerChannel {

	private readonly _progressEmitters = new Map<string, Emitter<IRequestToFileProgressEvent>>();
	private readonly _progressDisposables = new Map<string, DisposableStore>();

	constructor(private readonly service: IRequestService) { }

	listen(context: any, event: string, arg?: any): Event<any> {
		if (event === DOWNLOAD_PROGRESS_EVENT && typeof arg === 'string') {
			const requestId = arg;
			let emitter = this._progressEmitters.get(requestId);
			if (!emitter) {
				const store = new DisposableStore();
				emitter = new Emitter<IRequestToFileProgressEvent>();
				store.add(emitter);
				this._progressEmitters.set(requestId, emitter);
				this._progressDisposables.set(requestId, store);
			}
			return emitter.event;
		}
		throw new Error('Invalid listen');
	}

	call(context: any, command: string, args?: any, token: CancellationToken = CancellationToken.None): Promise<any> {
		switch (command) {
			case 'request': return this.service.request(args[0], token)
				.then(async ({ res, stream }) => {
					const buffer = await streamToBuffer(stream);
					return <RequestResponse>[{ statusCode: res.statusCode, headers: res.headers }, buffer];
				});
			case 'requestToFile': {
				const options = args[0];
				const destinationFilePath = args[1];
				const requestId = args[2] as string | undefined;
				const emitter = requestId ? this._progressEmitters.get(requestId) : undefined;
				const onProgress = emitter
					? (bytesReceived: number, contentLength: number | undefined) => emitter.fire({ bytesReceived, contentLength })
					: undefined;
				const promise = this.service.requestToFile?.(options, destinationFilePath, token, onProgress)
					?? Promise.reject(new Error('requestToFile is not supported'));
				return promise.finally(() => {
					if (requestId) {
						this._progressDisposables.get(requestId)?.dispose();
						this._progressDisposables.delete(requestId);
						this._progressEmitters.delete(requestId);
					}
				});
			}
			case 'resolveProxy': return this.service.resolveProxy(args[0]);
			case 'lookupAuthorization': return this.service.lookupAuthorization(args[0]);
			case 'lookupKerberosAuthorization': return this.service.lookupKerberosAuthorization(args[0]);
			case 'loadCertificates': return this.service.loadCertificates();
		}
		throw new Error('Invalid call');
	}
}

export class RequestChannelClient implements IRequestService {

	declare readonly _serviceBrand: undefined;

	constructor(private readonly channel: IChannel) { }

	async request(options: IRequestOptions, token: CancellationToken): Promise<IRequestContext> {
		const [res, buffer] = await this.channel.call<RequestResponse>('request', [options], token);
		return { res, stream: bufferToStream(buffer) };
	}

	async requestToFile(options: IRequestOptions, destinationFilePath: string, token: CancellationToken, progressRequestId?: string): Promise<IRequestToFileResult> {
		return this.channel.call<IRequestToFileResult>('requestToFile', [options, destinationFilePath, progressRequestId], token);
	}

	onRequestToFileProgress(requestId: string): Event<IRequestToFileProgressEvent> {
		return this.channel.listen<IRequestToFileProgressEvent>(DOWNLOAD_PROGRESS_EVENT, requestId);
	}

	async resolveProxy(url: string): Promise<string | undefined> {
		return this.channel.call<string | undefined>('resolveProxy', [url]);
	}

	async lookupAuthorization(authInfo: AuthInfo): Promise<Credentials | undefined> {
		return this.channel.call<{ username: string; password: string } | undefined>('lookupAuthorization', [authInfo]);
	}

	async lookupKerberosAuthorization(url: string): Promise<string | undefined> {
		return this.channel.call<string | undefined>('lookupKerberosAuthorization', [url]);
	}

	async loadCertificates(): Promise<string[]> {
		return this.channel.call<string[]>('loadCertificates');
	}
}
