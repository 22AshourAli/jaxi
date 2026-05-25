Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npx next dev -p 3009 > .next\dev-log.txt 2>&1", 0, False
