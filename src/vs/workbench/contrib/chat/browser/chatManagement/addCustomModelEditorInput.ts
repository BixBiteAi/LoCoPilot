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

const AddCustomModelEditorIcon = registerIcon('add-custom-model-editor-label-icon', Codicon.add, nls.localize('addCustomModelEditorLabelIcon', 'Icon of the Add Custom Model editor label.'));

export class AddCustomModelEditorInput extends EditorInput {

	static readonly ID: string = 'workbench.input.addCustomModel';

	readonly resource = undefined;

	constructor() {
		super();
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		return super.matches(otherInput) || otherInput instanceof AddCustomModelEditorInput;
	}

	override get typeId(): string {
		return AddCustomModelEditorInput.ID;
	}

	override getName(): string {
		return nls.localize('addCustomModelEditorInputName', "Language Models");
	}

	override getIcon(): ThemeIcon {
		return AddCustomModelEditorIcon;
	}

	override async resolve(): Promise<null> {
		return null;
	}
}
