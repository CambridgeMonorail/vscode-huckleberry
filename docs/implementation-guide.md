# Developing a VS Code “Task Master” Chat Extension

## Introduction

Building a **Task Master** extension in Visual Studio Code allows you to replicate and extend the AI-driven task management of Claude Task Master entirely within VS Code. Thanks to the June 2024 *“Extensions Are All You Need”* update, VS Code extensions can now integrate **Copilot Chat** participants and AI agents without calling external APIs directly ([GitHub Copilot Extensions are all you need](https://code.visualstudio.com/blogs/2024/06/24/extensions-are-all-you-need#:~:text=You%20might%20be%20most%20familiar,for%20the%20new%20API%20concepts)). In this guide, we’ll develop a step-by-step plan for a VS Code extension that uses the official Chat and Agent APIs to interact with Anthropic’s Claude model (via VS Code’s provided access) rather than direct Anthropic API calls. The extension will register a custom chat participant (e.g. `@taskmaster`) that interprets natural language and automates project task management actions in your workspace.

We will cover everything from project structure and manifest setup to using VS Code’s **Language Model API** and **Chat API** for tool-based agent actions. By the end, you should have a clear roadmap to implement features such as parsing a PRD into tasks, suggesting next tasks, marking tasks complete, expanding tasks into subtasks, and updating tasks – all through conversational interaction. We’ll also discuss how to persist task state in files and provide the AI with persistent instructions for consistent behaviour. *(Note: Phase 2 enhancements like web research with Perplexity or OpenAI will be outlined as optional extensions.)*

## Project Structure and Setup

To start, scaffold a typical VS Code extension project (using Yeoman or `vsce` if you prefer). Ensure you’re targeting VS Code **1.93+** (mid-2024 or later), since the Chat/Agent APIs became stable around that time. Key files in our project structure will include:

- **`package.json`** – The extension manifest where we declare our chat participant and any language model tools. This is also where extension name, activation events, and other VS Code contributions are defined.
- **`src/extension.ts`** – The main extension code file. On activation, it will register the chat participant and language model tools, and implement their functionality.
- **`src/tools/*.ts`** – (Recommended) separate modules for each tool, implementing the logic for tasks like reading files, writing task files, marking completion, etc.
- **Assets** – (Optional) such as an icon for the chat participant avatar.

A minimal structure might look like:

```text
taskmaster-extension/
├─ package.json
├─ src/
│   ├─ extension.ts
│   └─ tools/
│       ├─ ReadFileTool.ts
│       ├─ WriteFileTool.ts
│       └─ TaskUpdateTool.ts
└─ .vscodeignore (for packaging)
```

Ensure your `package.json` includes an appropriate `"activationEvents"`. For a chat participant, you can use an activation event so that VS Code loads your extension when the participant is invoked. For example, you might use `"onStartupFinished"` to always activate, or `"onChatParticipant:your-extension-id"` (when supported) to activate on demand. With structure in place, let’s move on to defining the chat participant.

## Registering the Chat Participant (AI Agent)

VS Code’s chat extensions work by contributing a **chat participant** – essentially a conversational agent specialized for a domain ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=Visual%20Studio%20Code%27s%20Copilot%20Chat,queries%20within%20a%20specific%20domain)). Our extension’s participant will act as a “Task Master” that manages project tasks. To register it, edit the `package.json` contributions:

```json
"contributes": {
    "chatParticipants": [
        {
            "id": "yourpublisher.taskmaster", 
            "fullName": "Task Master AI",
            "name": "taskmaster",
            "description": "AI task management assistant",
            "isSticky": true
        }
    ]
}
```

This declares a participant with a unique `id`, a user-facing name, an `@` name for mentions (`@taskmaster` in the chat), and a brief description. We set `"isSticky": true` so that once the user starts chatting with Task Master, the UI keeps the `@taskmaster` prefix by default for subsequent prompts ([Tutorial: Build a code tutorial chat participant with the Chat API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat-tutorial#:~:text=,field%20as%20a%20placeholder%20text)). With this manifest entry, users can invoke the agent in Copilot Chat by typing `@taskmaster ...`.

Next, in `extension.ts` (inside the `activate` function), create the chat participant in code. After registration in the manifest, *“all your extension has to do is create the participant by using `vscode.chat.createChatParticipant`”* ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=using%20,and%20a%20request%20handler)). For example:

```ts
export function activate(context: vscode.ExtensionContext) {
    // Define the request handler for our participant
    const handler: vscode.ChatRequestHandler = async (request, chatContext, stream) => {
        // (We will implement this next)
    };
    // Create the chat participant using the same ID as in package.json
    const participant = vscode.chat.createChatParticipant('yourpublisher.taskmaster', handler);
    // Optionally set an icon for the agent’s avatar
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "media/taskmaster-icon.png");
}
```

This uses the Chat API to create a participant and ties it to our handler function. The handler will receive user messages and produce responses. At this point, if you run the extension (`F5` for a new Extension Development Host window), you should see that typing `@taskmaster` in the Copilot Chat opens an entry with the description “AI task management assistant”. The next step is to implement the participant’s logic using VS Code’s **Language Model API** (which gives us access to the Claude model via Copilot) and to integrate tool usage for agent actions.

## Implementing the Chat Handler and Prompt

Our chat participant’s handler function is where the “AI brain” of Task Master lives. Here we interpret user prompts and generate appropriate responses or actions. There are two complementary approaches we can use (and even combine):

1. **LLM-powered responses:** Forward the user’s request to a language model (Claude) to decide on the outcome, possibly invoking tools for actions. VS Code’s Language Model API allows us to send prompts to the models available in Copilot Chat ([GitHub Copilot Extensions are all you need](https://code.visualstudio.com/blogs/2024/06/24/extensions-are-all-you-need#:~:text=With%20the%20Language%20Model%20API%2C,the%20technology%20stack%20being%20used)).
2. **Procedural handling:** Add any custom logic before/after the model call, for example to intercept certain commands or validate model outputs.

For a rich agent behavior, we’ll primarily rely on the LLM (Claude) with carefully crafted prompts and tool support. Start by defining a **base system prompt** for the agent – a set of instructions that gives the agent its persona and high-level behavior. For instance:

```ts
const SYSTEM_PROMPT = `
You are "Task Master", an AI project manager integrated in VS Code.
You can create and manage tasks in the project workspace. 
You have access to tools (functions) for file operations and task updates.
Your responses should be in Markdown, and for actions, you will invoke the appropriate tools.
`;
```

This prompt establishes the agent’s role and reminds it of tools availability. We’ll pass this to the model on each request. Additionally, to maintain context across turns, include the conversation history. In VS Code, `ChatContext` provides `context.history`, which you can use to retrieve prior messages in the conversation ([Tutorial: Build a code tutorial chat participant with the Chat API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat-tutorial#:~:text=%2F%2F%20get%20all%20the%20previous,ChatResponseTurn)). This helps Task Master handle follow-up requests in context (for example, knowing which tasks were created earlier).

Inside the handler, we construct the model input and call the model:

```ts
const handler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
    // Prepare the conversation prompt for the model
    const history = context.history
        .filter(h => h instanceof vscode.ChatResponseTurn)
        .map(h => {
            // Convert each past response turn to a plain text message for the model
            const resp = h as vscode.ChatResponseTurn;
            const text = resp.response.map(part => {
                // concatenate all parts (since response can have multiple markdown parts)
                return part.toString();
            }).join("");
            return vscode.LanguageModelChatMessage.fromAssistant(text);
        });
    const userMessage = vscode.LanguageModelChatMessage.fromUser(request.prompt);
    const systemMessage = vscode.LanguageModelChatMessage.fromSystem(SYSTEM_PROMPT);
    const messages = [systemMessage, ...history, userMessage];

    // Use the model from the request context (likely Claude via Copilot back-end)
    const response = await request.model.sendRequest(messages, { temperature: 0.2 }, token);
    for await (const chunk of response.text) {
        stream.markdown(chunk); // stream response back to chat UI
    }
};
```

In this snippet, we build an array of chat messages including our system prompt, any prior assistant responses (so the model remembers what tasks it already created or what was discussed), and the new user query. Then we call `request.model.sendRequest(...)` to get an AI completion, streaming it to the UI as it arrives ([Tutorial: Build a code tutorial chat participant with the Chat API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat-tutorial#:~:text=%2F%2F%20send%20the%20request%20const,token)). By default, `request.model` uses whichever model is active for that chat (for example, GPT-4 or Claude). **To use Claude**, instruct the user (or via settings) to select a Claude model for the chat session if available – the extension itself does not hard-code the model, ensuring we use *“the model from the chat context”* unless specified ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=,enable%20references%20and%2For%20response%20text)). (In the future, VS Code may allow explicitly choosing Claude via an API parameter if multiple models are accessible.)

**Tool usage:** The above basic implementation would just return an AI-generated answer. To empower the agent to perform actions (like file creation), we need to integrate **Language Model Tools**. Tools allow the model to invoke extension-defined functions in a structured way during its response generation ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=A%20language%20model%20tool%20is,the%20context%20of%20the%20conversation)) ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=Why%20implement%20a%20language%20model,tool%20in%20your%20extension)). VS Code’s agent mode will automatically consider these tools when responding to user prompts, if we supply them.

We have two ways to integrate tool calls in the handler: using the `@vscode/chat-extension-utils` library for convenience, or manually detecting when to call a tool. The utils library is recommended for our case. We can modify the handler like so:

```ts
import * as chatUtils from '@vscode/chat-extension-utils';

const handler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
    // Determine which tools to make available for this prompt
    const tools = vscode.lm.tools.filter(tool => tool.tags?.includes('taskmaster'));
    // Send the request to LLM, including tool definitions
    const result = await chatUtils.sendChatParticipantRequest(
        request, context, 
        { 
          prompt: SYSTEM_PROMPT, 
          tools,
          responseStreamOptions: { stream, references: true, responseText: true }
        }, 
        token
    );
    return result.result; // This returns any final metadata or errors, if needed
};
```

Here we retrieve our extension’s tools (tagged for Task Master), and call `sendChatParticipantRequest` with the conversation context plus the tool list ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=2,sendChatParticipantRequest)). This utility will handle packaging the tool descriptions and the prompt to the model, streaming back either a direct answer or triggering tool invocations. The model may decide to call one of the provided tools (if the user’s request requires it) as part of generating its answer. When a tool is invoked, VS Code will prompt the user for confirmation (by default) and then run the tool’s code, feeding the result back to the model ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=3,method)). This loop continues until the model finishes addressing the request ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=Using%20a%20GitHub%20MCP%20Tool,in%20Chat)). From the extension developer’s perspective, using `sendChatParticipantRequest` abstracts away the details of the function-call protocol – you just list the tools and the model handles the rest.

**Note:** Always provide clear instructions in the system prompt about when and how the agent should use tools. Our Task Master prompt already hints that tools are available for file ops and updates. You may further say “Use the tools to make changes rather than telling the user to do it.” This encourages the AI to act autonomously (with user approval for each action).

Finally, ensure to handle cancellation tokens and errors. If the model returns an error or doesn’t know what to do, the handler can catch that and send a fallback message (e.g., *“I’m sorry, I couldn’t complete that request.”*). With the chat participant and handler in place, we can move on to defining the actual tools that implement the task management operations.

## Defining Language Model Tools for Task Management

To automate CLI-style actions like creating files or updating JSON content, we leverage VS Code’s **Language Model Tools API**. A *language model tool* is essentially a function in your extension that the AI can call (via the agent mechanism) to perform some operation ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=A%20language%20model%20tool%20is,the%20context%20of%20the%20conversation)). We will create a set of tools to cover Task Master’s core commands: parsing a PRD into tasks (file read/write), suggesting next task (possibly just reasoning, so we might not need a tool for this), marking tasks complete (file update), expanding/adding tasks (file update), and updating task details (file update).

### Tool definitions in `package.json`

In the extension manifest, add a `"languageModelTools"` contribution for each tool. For example, we might define a **ReadFileTool** like:

```json
"contributes": {
  // ... (chatParticipants as above)
  "languageModelTools": [
    {
      "name": "taskmaster_readFile",
      "displayName": "Read File",
      "description": "Read a file's content from the workspace.",
      "modelDescription": "Use this tool to read the contents of a file. Input is a JSON with a \"path\" to the file. It returns the text content of that file.",
      "canBeReferencedInPrompt": true,
      "toolReferenceName": "readFile",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {"type": "string", "description": "Path to the file to read"}
        },
        "required": ["path"]
      }
    },
    {
      "name": "taskmaster_writeFile",
      "displayName": "Write File",
      "description": "Create or overwrite a file with given content.",
      "modelDescription": "Use this tool to create or update a file in the workspace. Input should include \"path\" (file path) and \"content\" (text to write). Use for creating tasks.json and task files, or updating them.",
      "canBeReferencedInPrompt": true,
      "toolReferenceName": "writeFile",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "content": {"type": "string"}
        },
        "required": ["path","content"]
      }
    },
    {
      "name": "taskmaster_markDone",
      "displayName": "Mark Task Done",
      "description": "Mark a task as completed in tasks.json",
      "modelDescription": "Marks a task as completed. Input: { \"id\": \"task ID\" }. This will update the tasks.json to set that task's status to done.",
      "canBeReferencedInPrompt": true,
      "toolReferenceName": "markDone",
      "inputSchema": {
        "type": "object",
        "properties": { "id": {"type": "string"} },
        "required": ["id"]
      }
    }
    // ... (optional more tools like 'addTask', 'analyzeComplexity', etc.)
  ]
}
```

Each tool entry includes: a unique `name` (we prefix with `taskmaster_`), a user-friendly name, a `modelDescription` which is a **crucial field describing to the LLM what the tool does and how to use it**, and an `inputSchema` defining the expected parameters ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=Static%20configuration%20in%20)) ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=4,modelDescription)). We set `canBeReferencedInPrompt: true` and give a `toolReferenceName` so that a user *or* the assistant could manually invoke the tool with `#readFile`, `#writeFile`, etc., in the chat. This also makes them available in agent mode automatically ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=Users%20can%20enable%20or%20disable,MCP%29%20tools)). The modelDescription should be very clear so Claude knows when to call these. For example, `taskmaster_writeFile` explicitly mentions it’s for creating `tasks.json` and task files – so if the user says “Parse this PRD and create tasks,” the model can decide: *I should call `writeFile` to save the generated tasks.*

*(Tip: Avoid ambiguous or overlapping tool functions. Each tool should do one thing clearly. The above selection covers generic file IO and a specific task operation. You might add more specialized tools (like one to create a task entry without full content), but our generic approach keeps things simple.)*

### Implementing tool logic in code

After defining tools in `package.json`, implement them in your extension’s activation. On extension activation, register each tool using its `name` as declared ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=1,vscode.lm.registerTool)):

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // ... after creating chat participant ...
    context.subscriptions.push(
        vscode.lm.registerTool('taskmaster_readFile', new ReadFileTool())
    );
    context.subscriptions.push(
        vscode.lm.registerTool('taskmaster_writeFile', new WriteFileTool())
    );
    context.subscriptions.push(
        vscode.lm.registerTool('taskmaster_markDone', new MarkDoneTool())
    );
}
```

Implement each tool class to adhere to `vscode.LanguageModelTool<TInput, TResult>` interface. Each will define: a **`prepareInvocation`** (optional, to confirm action with user) and an **`invoke`** method (to actually perform the action). For brevity, we’ll sketch the core logic:

- **ReadFileTool.invoke**: Parse `options.input.path`, use `vscode.workspace.fs.readFile` to read the file’s bytes, then return a `LanguageModelToolResult` containing the text. For example:

  ```ts
  import * as vscode from 'vscode';
  export class ReadFileTool implements vscode.LanguageModelTool<{ path: string }> {
      async invoke(options: vscode.LanguageModelToolInvocationOptions<{path: string}>, token: vscode.CancellationToken) {
          const { path } = options.input;
          try {
              const uri = vscode.Uri.file(path);
              const content = await vscode.workspace.fs.readFile(uri);
              const text = new TextDecoder().decode(content);
              // Return the file text so the LLM can use it (as a string part of the result)
              return new vscode.LanguageModelToolResult([ new vscode.LanguageModelTextPart(text) ]);
          } catch (err: any) {
              throw new Error(`Failed to read file: ${err.message}`);
          }
      }
      // (prepareInvocation can also be added to confirm file path with user, if desired)
  }
  ```

- **WriteFileTool.invoke**: Extract `path` and `content` from input. Use `vscode.workspace.fs.writeFile` to write the given content to that path (creating directories if needed). Return a result indicating success, for example a confirmation message or the first  line of the file written. For instance:

  ```ts
  export class WriteFileTool implements vscode.LanguageModelTool<{ path: string, content: string }> {
      async invoke(options: vscode.LanguageModelToolInvocationOptions<{path:string, content:string}>, token: vscode.CancellationToken) {
          const { path, content } = options.input;
          try {
              const uri = vscode.Uri.file(path);
              const data = new TextEncoder().encode(content);
              // Ensure parent directory exists
              await vscode.workspace.fs.createDirectory(vscode.Uri.file(require('path').dirname(path)));
              await vscode.workspace.fs.writeFile(uri, data);
              return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(`Wrote ${content.length} characters to ${path}`)
              ]);
          } catch (err: any) {
              throw new Error(`Unable to write file ${path}: ${err.message}`);
          }
      }
      // prepareInvocation could confirm overwriting a file, but generic confirmation is usually enough.
  }
  ```

- **MarkDoneTool.invoke**: Read `id` from input. Open the `tasks.json` (assume it’s at a known location, e.g. workspace root or a `tasks/` folder) – you can leverage our ReadFileTool internally or use FS again. Parse the JSON, find the task with matching `id`, mark its status as complete (e.g. set `"done": true` or move it to a done list), then write the file back (could call WriteFileTool or directly fs.writeFile). Also optionally update the corresponding task file (e.g. append “✅ Completed” in `tasks/task_<id>.txt`). Return a short confirmation message. If the task ID is not found, throw an Error so the model knows it failed.

Each tool can provide a custom `prepareInvocation` that returns a confirmation dialog text for the user ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=3,method)). For example, `WriteFileTool.prepareInvocation` might show *“Create or overwrite file `<path>`?”*. If you omit this, VS Code will show a generic confirmation (with the tool’s name and input) by default. Users must approve a tool invocation (unless they’ve chosen to auto-approve in settings) to ensure no unwanted actions occur ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=If%20,a%20certain%20tool)) ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=be%20easily%20installed%20and%20managed,7%20Sonnet%2C%20reflecting%20improved%20agent)). As a developer, craft these messages to be clear and informative, since a confused user might deny the action.

After implementing the classes, don’t forget to tag them with a property if you filtered by tag. For example, you might give each tool class a static property or assign a runtime property like `this.tags = ['taskmaster']` so that our earlier `filter(tool => tool.tags?.includes('taskmaster'))` picks them up. Alternatively, simply collect them in an array and pass that array to `sendChatParticipantRequest` directly.

## Task Files and State Management

Now that our agent can read and write files, we should decide how to structure the **task data** in the user’s workspace. Claude Task Master uses a `tasks.json` plus individual task files (e.g. `tasks/task_001.txt`). We will follow that approach:

- **`tasks.json`** – a JSON database of tasks, containing an array of task objects. Each task can have fields like `id` (e.g. `"TASK-001"`), `title`, `description`, `completed` (boolean), `dependencies` (list of task IDs), `priority`, etc. This file serves as the authoritative list of tasks and their statuses.
- **Task files** – for each task (especially larger ones), a text file under `tasks/` directory (or similar) containing details of the task. It could initially hold the description or any notes, and users/AI can expand it with more info, acceptance criteria, etc. The file name could be derived from the task ID (e.g. `TASK-001.txt` or `task_001.txt`).

When the user asks the agent to “parse a PRD and generate tasks,” the intended outcome is that `tasks.json` gets created/updated with new tasks, and for each new task an individual file is created with the description. Our tools will handle the file creation, but *the content to write* comes from the AI. So, how does the AI know what to write? The flow would be:

1. **User prompt:** e.g. “@taskmaster Parse the requirements document `PRD.md` and generate tasks.”
2. **Agent reasoning (Claude model):** It will likely call `readFile` tool with `{"path": "PRD.md"}` to get the content of the PRD (our ReadFileTool will return the text).
3. After receiving the PRD text, the model analyzes it and decides on a list of tasks needed. It then formats a JSON or text representing the tasks.
4. **Agent actions:** The model might call `writeFile` to create `tasks.json` with the JSON content, and call `writeFile` again for each task’s file. For example, it could call `writeFile` with `path:"tasks/TASK-001.txt", content:"Task 001: Setup project skeleton\nDescription: ..."` etc., for each task.
5. Each of those tool calls will prompt the user to allow file creation. Upon approval, the files are written.
6. **Agent response:** The agent finally responds in chat, perhaps summarizing what it did: e.g. “✅ I created `tasks.json` with 5 tasks, and generated individual task files for each. You can find them in the `tasks/` folder. ([Context is all you need: Better AI results with custom instructions](https://code.visualstudio.com/blogs/2025/03/26/custom-instructions#:~:text=Try%20this%3A%20create%20a%20file,special%20to%20make%20it%20work)) Would you like me to suggest a next task to tackle?” (Notice we can include a little prompt for the next action.)

At this point, the tasks are persisted on disk. This means even if the chat session ends or VS Code is reloaded, the tasks remain. This is a key benefit of using file-based state: **persistency**. We don’t need a complex in-memory state or database – everything lives in the workspace, visible to the user (which is transparent and editable). Persisting state in files also means the AI itself can read those files later to get the current state (via the `readFile` tool or via context if we feed it).

**Marking tasks complete:** This operation will be triggered when the user says something like “mark task 3 as complete” or clicks a UI button we might add. The agent should update `tasks.json` and possibly the task file (maybe add a “(Completed)” tag or move it). If the model is confident, it could call the `markDone` tool with `{ "id": "TASK-003" }`. Our MarkDoneTool will then handle editing the JSON. Alternatively, the model might choose to read the JSON, modify it internally, and call `writeFile` with the new content – but this is more error-prone. By providing a high-level `markDone` tool, we encapsulate the logic and minimize the chance of formatting errors. We should design MarkDoneTool to clearly confirm what it will do (e.g., “Mark task TASK-003 as completed in tasks.json”). Once done, it could return a confirmation like “Task TASK-003 marked as complete.” The agent can include that in its response.

**Suggesting the next task:** This might not require a tool at all. The user could simply ask “What’s the next task I should do?” The agent (Claude) can read the `tasks.json` to see which tasks are incomplete and perhaps their priorities. How does it get the content? We have multiple options:

- We could rely on the AI’s memory if `tasks.json` content was already seen in this session (say, from creation time). But safer is to fetch the latest data. We might encourage the model (via prompt engineering) to use the `readFile` tool on `tasks.json` when it needs up-to-date task info.
- We could implement a custom tool like `getTasksStatus` that returns a summary of pending tasks, but that’s optional. Likely, just using `readFile("tasks.json")` and letting the model parse the JSON to decide is enough (Claude is quite capable of reading JSON content and understanding it).

Thus, for “suggest next task,” the agent might call `readFile` to get tasks.json, then reply with something like: *“The highest priority open task is TASK-002: Implement authentication. I suggest starting with that.”* (We can also incorporate priority sorting logic into a tool if needed, but that might be overkill.)

**Expanding tasks into subtasks:** This is a similar pattern – the user might say “Break TASK-002 into subtasks.” The agent can read the task file or tasks.json entry for TASK-002 to understand it, then generate new task entries (TASK-002a, TASK-002b, etc.). It would then call `writeFile` to update `tasks.json` with the new subtasks and create their files. We could add a convenience tool like `addTask` that takes a parent task ID and a new task object to add, but it’s achievable with generic file writes as well (the model just needs to produce the updated JSON). For reliability, you might implement an `AddTaskTool` that takes fields and appends a well-formed task to the JSON, to avoid JSON syntax errors from the model.

In all cases, test these flows thoroughly. Verify that the JSON remains valid after updates. You may consider using a JSON schema or even a VS Code custom editor or tree view to display tasks nicely, but those are outside our current scope. The focus here is that the **agent’s design plus tools yields a working autonomous task manager**.

## Conversation Flow Examples

Let’s walk through a typical session to solidify how the extension behaves:

- **Initialize Task Master:** The user might open Copilot Chat and type: `@taskmaster Initialize task management for this project.` Since there is no PRD specified, the agent could either ask for more info or simply create an empty `tasks.json` template. Our agent (with the base prompt and perhaps some additional training in `.github/copilot-instructions.md`, discussed next) might decide to set up the structure. It could call `writeFile` to create an empty `tasks.json` with just `{"tasks": []}` and maybe reply: *“I’ve created a tasks.json file to track our tasks. You can ask me to add tasks or parse a spec to generate tasks.”* This sets the stage.

- **Parse PRD into tasks:** Now the user says, `@taskmaster Parse the PRD.md and generate tasks with IDs, titles, and descriptions.` The agent will use `ReadFileTool` to get `PRD.md` content (user will approve). Then the model (Claude) analyzes that text and comes up with, say, 5 tasks. It formats a JSON (or it might format Markdown list and then call the tool – but likely, since it knows it has a `writeFile` tool for tasks.json, it will prepare the JSON string as content). It then calls `writeFile` tool to write `tasks.json` (user approves creation). The content might be something like:

  ```json
  {
    "tasks": [
      { "id": "TASK-001", "title": "Setup project structure", "description": "Create initial project scaffolding", "dependencies": [], "priority": "high", "completed": false },
      { "id": "TASK-002", "title": "Implement authentication", "description": "Create signup and login functionality", "dependencies": ["TASK-001"], "priority": "high", "completed": false },
      ...
    ]
  }
  ```

  It might next call `writeFile` for each task description file (or perhaps the description above is enough and it skips separate files – that’s up to our design/prompting). If we want separate files, the agent could create `tasks/TASK-001.txt` with content like “**TASK-001: Setup project structure** – Create initial project scaffolding… (etc)”. All these tool calls will require user confirmation, but since this is the first big action the user requested, it’s expected. After the tools run, the agent streams a response listing the tasks. Because chat responses support markdown, it can present the tasks nicely, e.g.:

  **Output:**
  *“I’ve created 5 tasks from the PRD:*  
  - **TASK-001:** Setup project structure (not started)  
  - **TASK-002:** Implement authentication (dep: TASK-001)  
  - …  

  *You can find the full list in `tasks.json` and individual files in the `tasks/` folder. Let me know if you want to refine these or start with a specific task!”*

  (This combined confirmation and next-step suggestion makes the UX smooth.)

- **Suggest next task:** The user might then ask `@taskmaster Which task should I do first?` The agent will likely use the tasks data. Perhaps it already knows TASK-001 has no dependencies and is high priority. It can answer directly: *“I recommend starting with TASK-001: Setup project structure, since it’s a prerequisite for others.”* If the agent isn’t sure, it could call `readFile` on `tasks.json` to double-check and then answer.

- **Mark task complete:** Once the user finishes a task (perhaps outside the agent’s actions), they might say `@taskmaster Mark TASK-001 as complete.` The agent will call `markDone` tool with `{"id": "TASK-001"}` (user approves the edit). The MarkDoneTool updates `tasks.json` (setting TASK-001 `"completed": true`). It could also append in `TASK-001.txt` something like “Status: Completed on 2025-04-16.” After the tool runs, the agent replies: *“Marked TASK-001 as completed ✅. Great job! (I updated tasks.json accordingly.)”* Because we included references in streaming options, VS Code might even show a diff or reference to the changed file in the chat if we enable that.

- **Expand a task into subtasks:** Suppose the user says `@taskmaster Expand TASK-002 into subtasks.` The agent will read TASK-002’s details (maybe via `tasks.json` or `TASK-002.txt`), then generate a few subtasks like TASK-002-a, TASK-002-b. It will call `writeFile` to update `tasks.json` with those new subtasks inside TASK-002 (or as separate tasks with a dependency link to 002). Alternatively, it could treat them as new tasks with IDs TASK-003, 004, etc., if a strict hierarchy isn’t needed – this depends on how you want to model subtasks. In any case, it will create entries and possibly files for each. Then respond with the new breakdown.

- **Update task details:** If the user says something like `@taskmaster Change TASK-003 priority to low and title to "Implement OAuth".` The agent can handle this by reading tasks.json, locating TASK-003, modifying those fields, and writing back. This could be done via a dedicated tool (we didn’t explicitly add one for editing arbitrary fields). The model might attempt to do it by itself: e.g., read file, edit JSON string internally, and call `writeFile`. Claude is usually good at editing text if instructed carefully, but to be safe, you *could* implement an `UpdateTaskTool` that takes `id`, `fields` to update (e.g. a partial task object) and merges changes. This is an extensibility point for your extension if you foresee many such updates.

Throughout all these flows, remember to handle errors. For example, if a user asks to mark a task that doesn’t exist, our tool should throw an error. The error message should be written in a way that the model can relay to the user usefully. E.g., `throw new Error("Task TASK-999 not found. Please check the ID.")`. The Chat API will pass this back and the model will likely respond with that message.

Also consider concurrency: if two requests come quickly, our simple design should queue them (the VS Code Chat API serializes interactions per session). But if the user manually edits the files outside of the chat, the agent might be unaware until it reads them again – which is fine.

By now, our Task Master extension can handle core task management via chat. The user can converse with `@taskmaster` to manage their project tasks in a natural way, and the agent uses VS Code’s own model integration to do the heavy lifting.

 ([image]()) *Custom chat participants like our Task Master appear in VS Code’s Chat view. They can be invoked with `@name` and can stream rich Markdown answers. Here, the official sample `@cat` participant is shown as an example ([GitHub Copilot Extensions are all you need](https://code.visualstudio.com/blogs/2024/06/24/extensions-are-all-you-need#:~:text=You%20might%20be%20most%20familiar,for%20the%20new%20API%20concepts)).*

## Persistent Custom Guidance with Copilot Instructions

One challenge with AI agents is ensuring consistent behaviour across sessions or keeping custom constraints in mind. Claude Task Master (especially when used in Cursor editor) utilized a `.cursor/rules/dev_workflow.mdc` file to guide the AI on the development workflow. In VS Code, we have an analogous feature: **custom instructions** via a `.github/copilot-instructions.md` file.

If the user (or you, as the extension developer) creates a file at `.github/copilot-instructions.md` in the workspace, Copilot Chat will automatically incorporate it into the context for all prompts ([Context is all you need: Better AI results with custom instructions](https://code.visualstudio.com/blogs/2025/03/26/custom-instructions#:~:text=Try%20this%3A%20create%20a%20file,special%20to%20make%20it%20work)). This is an ideal place to put persistent directives for Task Master’s behaviour. For example, you might instruct: *“The AI Task Master should always double-check with the user before making destructive changes. It should format task lists in markdown. It should not reveal sensitive info,”* etc. Because this file is in the workspace, it travels with the project (and can be edited by the user to tune the AI’s style or rules).

**How to use it:** You can mention in your extension’s documentation that the user should add any custom guidelines to `.github/copilot-instructions.md`. If desired, the extension could even write an initial version (with user consent) when initializing task management. For instance, when the user first asks to initialize, Task Master could add a section to that file like:

```markdown
## Task Master Guidelines
- Always use the `tasks.json` file to keep track of tasks.
- Before marking a task complete, ensure all its subtasks are done.
- Use clear, concise language when reporting task status.
```

This will then be part of the model’s context on subsequent prompts. Do note that the content of this file is visible to the user and should not contain any secret prompts from the extension that you wouldn’t want the user to see. It’s a user-editable instruction set. The benefit is persistence: even if the chat thread is reset, these instructions remain in effect in the background for Copilot ([Adding custom instructions for GitHub Copilot - GitHub Docs](https://copilot-instructions.md/#:~:text=instructions,The%20complete%20set%20of)).

Custom instructions can drastically improve consistency and keep your agent aligned with user expectations or team conventions. Leverage this feature to maintain Task Master’s “personality” and operational rules.

## Phase 2: Advanced Extensions (Optional)

The MVP we described uses VS Code’s built-in model (Claude via Copilot) and tools. This already achieves local automation, but we can extend Task Master with more powerful features if needed:

- **Research-backed Task Expansion:** Sometimes the tasks might require researching a topic (e.g., “Investigate best practices for X”). In Phase 2, you could integrate an external API like *Perplexity AI* (which performs web searches and synthesis) or OpenAI’s functions for web browsing, to help the agent gather information. For example, you might implement a `researchWeb` tool that, given a query, calls an external service and returns a summary or relevant findings. This can help Task Master when a user asks for an analysis or a technology comparison as a task. **Important:** These integrations should be gated behind user-provided API keys (for instance, require the user to set `taskMaster.perplexityApiKey` in settings). This ensures the user opts in and is aware of any external data usage. Always handle keys securely (do not log them, etc.).

- **Complexity Analysis or Estimation:** An “optional complexity analysis” feature could use either the same Claude model or a specialized model (perhaps GPT-4 or a dedicated estimation model) to rate task complexity. You might create a command like `Analyze complexity` which causes the agent to call an external API or simply have the agent do it with its own reasoning. For example, the agent could consider factors (number of dependencies, scope of description) and label a task as Low/Medium/High complexity. This could be added as a field in `tasks.json`. Implement this as a tool (if using external API) or just an extra step in the conversation (if using the same model – e.g., user asks for complexity, the agent reads the task and responds with an assessment).

- **Integration with VS Code Tasks or UI:** To avoid confusion with VS Code’s built-in tasks (which use `.vscode/tasks.json` for running build tasks), you might integrate with the VS Code **Task Provider** API ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=,Theming)) ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=,Telemetry)) to expose these AI tasks in the UI (for instance, showing them in the tasks panel or a custom tree view). This is a larger development effort but could make the tasks more visible outside the chat. In a Phase 2, you could create a TreeView that reads `tasks.json` and displays tasks with checkboxes for completion, etc., and still allow the chat to drive updates. This provides a dual interface: via chat or via GUI.

- **MCP (Model Control Protocol) compatibility:** The Anthropic MCP mentioned in Claude Task Master’s README is a protocol for tool usage. VS Code’s adoption of agent tools is conceptually similar (and in fact, agent mode supports an *MCP server* integration ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=The%20aforementioned%20support%20for%20the,of%20multiple%20tools%20and%20services))). If needed, you could register your extension’s tools under MCP so that other AI clients (not just Copilot Chat) could discover and use them. However, since we are focusing on VS Code’s native APIs, this isn’t required – VS Code’s agent mode already makes our tools available to the model ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=,approving%20all%20tools%20without%20confirmation)).

Each of these enhancements should be added in a modular way: ensure the core functionality (Phase 1) works independently, then add new tools or commands conditionally. For example, only register the `researchWeb` tool if `perplexityApiKey` is provided in settings. Document these extras clearly so users know how to enable them.

## Agent Design Tips and Best Practices

Before wrapping up, here are some general tips for designing a robust AI agent extension:

- **Intent mapping vs. free-form AI:** Decide how much you rely on the AI to interpret user intent versus using structured commands. We gave the AI freedom to parse natural language and choose tools. This makes the extension very flexible (the user doesn’t *have* to remember exact commands). However, you can still guide the AI with the `commands` property in the participant contribution. In our manifest, we could add something like:

  ```json
  "commands": [
    { "name": "parsePRD", "description": "Parse a Product Requirements Doc and generate project tasks." },
    { "name": "markComplete", "description": "Mark a task as completed by ID." },
    ...
  ]
  ```

  This lets the user see or autocomplete specific commands (triggered by a `/` perhaps) and gives the model explicit named intents to latch onto. In the sample cat extension, commands and disambiguation help the model understand user requests unambiguously ([vscode-extension-samples/chat-sample/package.json at main · microsoft/vscode-extension-samples · GitHub](https://github.com/microsoft/vscode-extension-samples/blob/main/chat-sample/package.json#:~:text=)) ([vscode-extension-samples/chat-sample/package.json at main · microsoft/vscode-extension-samples · GitHub](https://github.com/microsoft/vscode-extension-samples/blob/main/chat-sample/package.json#:~:text=)). You can use this to prevent confusion, but it’s optional. Our design trusts the model with natural language, supplemented by the clear tool definitions.

- **Testing and fallback:** As you develop, simulate various user inputs. Ensure the agent doesn’t take destructive actions without tools (e.g., it should not just output “Run `rm -rf /` in terminal” or something – unlikely with our prompt, but good to be safe!). The advantage of the VS Code Chat API is that the model cannot execute anything outside of the tools you provide, and each tool requires user approval ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=If%20,a%20certain%20tool)). This sandboxing is critical for safety. Still, handle edge cases: if the user asks something nonsensical for this domain, perhaps the agent should politely say it can’t help (you can detect in the model output or use a fallback if no tools apply and the query isn’t task-related).

- **Keep responses user-friendly:** Use the streaming and formatting capabilities. The Chat API supports markdown, code fences, links, and even buttons in responses ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=When%20a%20user%20explicitly%20mentions,the%20supported%20response%20output%20types)). For instance, after creating tasks, you might include a little Markdown snippet with links to open the files or a button `[Open tasks.json]`. You can generate a VS Code URI command link (e.g., `vscode://file/<path-to-tasks.json>`) if needed. This enhances UX beyond plain text.

- **Performance considerations:** For large PRDs or many tasks, be mindful of token limits. Claude is known for large context windows (even up to 100k tokens in newest versions), so it might handle big files. But the VS Code `request.model` may have its own limits depending on the user’s plan (Copilot likely uses GPT-4 or Claude with certain limits). It’s wise to chunk very long files in `ReadFileTool` (maybe only read first N KB unless user specifically asks for full). You could also do streaming reads, but that complicates returning the result to the model. Perhaps warn if file is too large.

- **Security and privacy:** Since this extension deals with file contents and potentially external APIs, be transparent. Inform the user if any data is sent out (in Phase 2 features). For Phase 1, everything stays local to Copilot, which means it’s processed by the Copilot service (OpenAI/Anthropic on the backend) similarly to normal Copilot usage. Ensure you’re not inadvertently exposing secrets. The user’s code could contain secrets; if they ask the agent to do something with a file containing credentials, those credentials might be read by the LLM. This is analogous to using Copilot on that file anyway, but good to keep in mind in documentation.

## Conclusion

With the steps above, you can develop a comprehensive VS Code extension that turns Claude (via Copilot Chat) into an automated project manager for your tasks. We leveraged the new Chat Participant API to embed a custom AI assistant in VS Code ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=Visual%20Studio%20Code%27s%20Copilot%20Chat,queries%20within%20a%20specific%20domain)), and the Language Model Tools API to give it actuating power to modify files ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=,augment%20a%20user%27s%20debugging%20experience)). The Task Master agent can parse specs, create and update task files, and guide a developer through their to-do list using natural language. All of this is achieved without direct calls to Anthropic’s API – instead, we use the VS Code-provided model interfaces, which means our extension works seamlessly with GitHub Copilot’s infrastructure (and benefits from any model Microsoft provides, including future Claude updates).

By following this guide, you should be able to implement the core functionality (Phase 1) and have a roadmap for optional enhancements like research integration (Phase 2). As you build the extension, refer to the official VS Code documentation for chat and language model features – they are frequently updated with new examples and best practices. Notably, the VS Code team has showcased how powerful these integrations can be: *“With chat **Agent Mode** in Visual Studio Code, you can use natural language to define a high-level task and start an agentic session to accomplish that task. In agent mode, Copilot autonomously plans the work, determines relevant files and context, makes edits, and invokes tools to fulfill the request.”* ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=,documentation)) Our Task Master is a specialized agent focusing on task management, but the philosophy is the same.

Finally, don’t forget to test the extension thoroughly and iterate on the prompts/instructions. A small change in wording can greatly affect how the AI behaves. Use the `.github/copilot-instructions.md` to fine-tune persistent behaviours and encourage users to provide feedback. Good luck with building your Task Master extension – with VS Code’s AI extension APIs, *extensions are indeed all you need* to supercharge your editor with AI capabilities! ([GitHub Copilot Extensions are all you need](https://code.visualstudio.com/blogs/2024/06/24/extensions-are-all-you-need#:~:text=You%20might%20be%20most%20familiar,for%20the%20new%20API%20concepts))

**Sources:**

- Official VS Code Chat Extension Guide ([Chat extensions | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat#:~:text=Visual%20Studio%20Code%27s%20Copilot%20Chat,queries%20within%20a%20specific%20domain)) ([Tutorial: Build a code tutorial chat participant with the Chat API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat-tutorial#:~:text=%22chatParticipants%22%3A%20%5B%20%7B%20%22id%22%3A%20%22chat,true%20%7D)) and Tutorial ([Tutorial: Build a code tutorial chat participant with the Chat API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/chat-tutorial#:~:text=%2F%2F%20send%20the%20request%20const,token)) – useful for understanding chat participant setup and handlers.
- VS Code Language Model & Tools API References ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=By%20implementing%20a%20language%20model,in%20your%20extension%2C%20you%20can)) ([LanguageModelTool API | Visual Studio Code Extension API](https://code.visualstudio.com/api/extension-guides/tools#:~:text=1,vscode.lm.registerTool)) – details on defining and registering AI tools for agent use.
- VS Code June 2024 Blog *“GitHub Copilot Extensions are all you need”* ([GitHub Copilot Extensions are all you need](https://code.visualstudio.com/blogs/2024/06/24/extensions-are-all-you-need#:~:text=You%20might%20be%20most%20familiar,for%20the%20new%20API%20concepts)) – introduction of Chat and LLM APIs enabling extensions like this.
- VS Code March 2025 Updates on Agent Mode ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=,documentation)) ([VS Code v1.99 Is All About Copilot Chat AI, Including Agent Mode -- Visual Studio Magazine](https://visualstudiomagazine.com/Articles/2025/04/04/VS-Code-v1-99-Is-All-About-Copilot-Chat.aspx#:~:text=,approving%20all%20tools%20without%20confirmation)) – insights into how agent mode and tools are used (our extension aligns with these concepts).
- GitHub Copilot Custom Instructions ([Context is all you need: Better AI results with custom instructions](https://code.visualstudio.com/blogs/2025/03/26/custom-instructions#:~:text=Try%20this%3A%20create%20a%20file,special%20to%20make%20it%20work)) – explains the usage of `.github/copilot-instructions.md` for persistent AI context, which we leverage for Task Master guidance.
