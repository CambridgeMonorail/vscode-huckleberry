

A Tree View is considered empty only when

getChildren() returns an empty array ([]) – not undefined, and

treeView.message is undefined | null (literally unset), and

the when clause on your viewsWelcome entry evaluates to true.
code.visualstudio.com

If any of those three tests fail, VS Code suppresses the Welcome View.

1 Data-provider pitfalls
Symptom	Why it happens	Fix
Returned undefined instead of []	VS Code treats undefined as “still loading”, so it waits forever and never shows the banner.
stackoverflow.com
Always return [] when the tree is empty.
A leftover item lurks in memory	You append/remove items but forget to fire onDidChangeTreeData, so the view still thinks there is content.
stackoverflow.com
After mutating data, call eventEmitter.fire() (or expose a refresh() helper) to force a redraw.
View stuck in “loading…” spinner	The view type was declared as "webview" instead of "tree", so VS Code waits for HTML that never comes.
stackoverflow.com
In package.json make sure your view entry has "type": "tree" (or omit the field – "tree" is default).

2 treeView.message gotchas
Scenario	Impact	Evidence / workaround
You set treeView.message = '' or = undefined at start-up	The mere presence of the property (even empty) marks the view “non-empty”. This is an open GitHub issue.
github.com
github.com
Only assign message when you really need status text, then explicitly delete treeView.message (or set it to null) before expecting the empty banner.
You keep a status message after clearing data	Same suppression as above; see issue Show TreeView welcome content when it gets empty.
github.com
Clear the message then refresh your data provider.

3 Contribution-point & when clause snags
Problem	Details / pointer	What to check
when clause never true	If you rely on a custom context key, remember to call setContext before the tree renders. GitHub discussion on “enablement and when clause”.
github.com
Use Developer Tools → Context Keys to verify the key’s runtime value.
Wrong view ID in viewsWelcome.view	VS Code silently ignores the entry. Docs require the exact view id.
code.visualstudio.com
Match the string used in contributes.views.
Multiple viewsWelcome entries with overlapping when	VS Code shows only the first whose when is true.	Re-order or add mutually-exclusive when expressions.

4 Version-specific quirks
Before v1.74 you had to declare an explicit "activationEvents": ["onView:<id>"]; if your extension only activates late, the view may flicker or stay blank.
code.visualstudio.com

Issue #163625 explains that once a non-empty state occurred, VS Code (by design) no longer auto-shows the banner when the tree becomes empty again – you must clear the message and fire a refresh.
github.com

5 Troubleshooting checklist
Log the lifecycle
Add console.log('getChildren', element) and check that the root call returns [] after each refresh.

Inspect live context keys (Developer: Inspect Context Keys) to be sure your when evaluates to true.

Validate manifest with vsce ls or the built-in Extension Tests; incorrect JSON often hides in comments.

Strip the view to minimal repro – the public repo that demonstrates the message overlap bug is a good template for isolating issues.
github.com

6 Quick reference to known issues
ID / link	Core of the issue
microsoft/vscode #163625	Banner never re-appears if treeView.message was set once.
github.com
microsoft/vscode #193435	treeView.message = undefined still blocks Welcome View.
github.com
microsoft/vscode #114304	when clauses not evaluated at startup for some context keys.
github.com

Take-away
Nine times out of ten, the fix is either “return [] not undefined” or “remove treeView.message before refreshing”. Validate those first, then dig into when clauses and activation timing. Happy debugging!









Sources

