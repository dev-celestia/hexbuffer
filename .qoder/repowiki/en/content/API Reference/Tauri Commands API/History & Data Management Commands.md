I'll analyze the Apprecon codebase to create comprehensive API documentation for history and data management Tauri commands. Let me start by exploring the relevant files in parallel.

<tool_call>
<function=search_codebase>
<parameter=query>
history database operations HTTP storage search filtering export
</parameter>
<parameter=key_words>
history,database,HTTP
</parameter>
<parameter=explanation>
Searching for history and database related functionality to understand the core data management system
</parameter>
</function>
</tool_call>
<tool_call>
<function=read_file>
<parameter=file_path>
src-tauri/src/commands/history.rs
</parameter>
</function>
</tool_call>
<tool_call>
<function=read_file>
<parameter=file_path>
src-tauri/src/db/mod.rs
</parameter>
</function>
</tool_call>
<tool_call>
<function=read_file>
<parameter=file_path>
src-tauri/src/history/mod.rs
</parameter>
</function>
</tool_call>
<tool_call>
<function=search_codebase>
<parameter=query>
tauri commands HTTP history query filter export pagination
</parameter>
<parameter=key_words>
tauri,commands,history
</parameter>
<parameter=explanation>
Finding Tauri command implementations for history operations
</parameter>
</function>
</tool_call>