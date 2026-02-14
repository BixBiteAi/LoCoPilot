/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../../base/common/themables.js';
import * as nls from '../../../../../nls.js';
import { registerIcon } from '../../../../../platform/theme/common/iconRegistry.js';
import { IUntypedEditorInput } from '../../../../common/editor.js';
import { EditorInput } from '../../../../common/editor/editorInput.js';

const CustomLanguageModelsListEditorIcon = registerIcon('custom-language-models-list-editor-label-icon', Codicon.listUnordered, nls.localize('customLanguageModelsListEditorLabelIcon', 'Icon of the Custom Language Models List editor label.'));

export class CustomLanguageModelsListEditorInput extends EditorInput {

	static readonly ID: string = 'workbench.input.customLanguageModelsList';

	readonly resource = undefined;

	constructor() {
		super();
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		return super.matches(otherInput) || otherInput instanceof CustomLanguageModelsListEditorInput;
	}

	override get typeId(): string {
		return CustomLanguageModelsListEditorInput.ID;
	}

	override getName(): string {
		return nls.localize('customLanguageModelsListEditorInputName', "Language Models");
	}

	override getIcon(): ThemeIcon {
		return CustomLanguageModelsListEditorIcon;
	}

	override async resolve(): Promise<null> {
		return null;
	}
}
