# LoCoPilot

LoCoPilot is a powerful code editor by **Bixbite AI**. It combines the simplicity of a code editor with what developers need for their core edit-build-debug cycle: comprehensive code editing, navigation, and understanding, lightweight debugging, a rich extensibility model, and integration with existing tools. LoCoPilot supports **local and cloud** language models so you can code with the AI that fits your workflow.

## About LoCoPilot

LoCoPilot is developed and maintained by **Bixbite AI**.

**Repository:** [https://github.com/BixBiteAi/LoCoPilot](https://github.com/BixBiteAi/LoCoPilot)

- **Bugs** – [Report a bug](https://github.com/BixBiteAi/LoCoPilot/issues/new?template=bug_report.md) or [search existing issues](https://github.com/BixBiteAi/LoCoPilot/issues)
- **Feature requests** – [Open a feature request](https://github.com/BixBiteAi/LoCoPilot/issues/new?template=feature_request.md) or [see existing ideas](https://github.com/BixBiteAi/LoCoPilot/issues?q=is%3Aissue+label%3Aenhancement)
- **Community** – [GitHub Discussions](https://github.com/BixBiteAi/LoCoPilot/discussions) for questions and chat

## Install and run

**Prerequisites:** [Node.js](https://nodejs.org/) (LTS recommended), npm.

1. **Clone and enter the repo**
   ```bash
   git clone https://github.com/BixBiteAi/LoCoPilot.git
   cd LoCoPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run LoCoPilot**
   - **macOS / Linux:** from the repo root, run:
     ```bash
     ./scripts/code.sh
     ```
     This will compile if needed, then launch LoCoPilot.
   - **Windows:** from the repo root, run:
     ```bash
     scripts\code.bat
     ```

**Development (with auto-compile on save):** Run `npm run dev` (or `./scripts/dev.sh` on macOS/Linux). This starts the watch tasks and launches the app so code changes are picked up automatically.

**Web / server:** To run as a web app or code-server, use `./scripts/code-web.sh` or `./scripts/code-server.sh` (and their `.bat` equivalents on Windows). See the script files for usage.

## How to use LoCoPilot

LoCoPilot lets you use **local or cloud** language models in the editor. You add models in **LoCoPilot Settings**, then choose which model to use in the **Chat** panel.

### Adding a model (local or cloud)

1. Open the **Chat** panel (e.g. from the activity bar or View menu).
2. In the chat header, open the **model dropdown** (the current model name).
3. Click **"Add Language Models"** (or **"Add Premium Models"**). This opens **LoCoPilot Settings** on the **Add Language Model** tab.
4. In LoCoPilot Settings:
   - **Model Type:** choose **Cloud** or **Local**.
   - **Model Provider:**  
     - Cloud: Anthropic, OpenAI, or Google (API key required).  
     - Local: HuggingFace or Localhost (for models running on your machine).
   - Fill in the required fields (API key or token, model name/ID, etc.) and optional limits (max input/output tokens) if needed.
   - Click **Add** to save. The new model appears in your **Language Models** list.

### Using a model in chat

- In the **Chat** panel, open the **model dropdown** again. All models you added (and any built-in ones) appear in the list.
- Select the model you want. You can now use **Ask** (chat only) or **Agent** (chat with tools, e.g. terminal, edits).

### Agent settings

In **LoCoPilot Settings**, open the **Agent Settings** section to:

- **Max iterations per request** – limit how many steps the agent can take per request.
- **Auto approve terminal commands** – when on, terminal commands from the agent run without asking (in a sandbox). Default: off.
- **System prompts** – customize the system prompt for **Agent** mode and for **Ask** mode (Markdown supported).
- Use **Save** to apply, **Cancel** to discard, or **Restore to default** to reset prompts and options.

You can open LoCoPilot Settings anytime from the model dropdown in the Chat panel (**Add Language Models**) or via the command palette: search for **LoCoPilot Settings**.

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report issues, ask questions, and submit pull requests.

## Feedback

For feedback and support related to LoCoPilot, please contact Bixbite AI.

## Bundled Extensions

LoCoPilot includes built-in extensions in the [extensions](extensions) folder (grammars, snippets, and language support). Extensions that provide rich language support (e.g. inline suggestions, Go to Definition) use the suffix `language-features`.

## Development Container

This repository includes a development container for [Dev Containers](https://aka.ms/vscode-remote/download/containers) and [GitHub Codespaces](https://github.com/features/codespaces). Use **Dev Containers: Clone Repository in Container Volume...** or **Codespaces: Create New Codespace**. Docker / the Codespace should have at least **4 Cores and 6 GB of RAM (8 GB recommended)**. See the [development container README](.devcontainer/README.md) for details.

## License

Copyright (c) 2015 - present Microsoft Corporation. All rights reserved.
Copyright (c) Bixbite AI. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license. This project uses source code from the [MIT-licensed VS Code project](https://github.com/microsoft/vscode).
