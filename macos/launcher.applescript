-- Skill Dex launcher: reads the repository folder from Contents/Resources/repo-path.txt (or $SKILLDEX_HOME) and runs launch.sh.
on run
	set appPath to POSIX path of (path to me)
	set cmd to "REPO=\"${SKILLDEX_HOME:-$(head -n 1 " & quoted form of (appPath & "Contents/Resources/repo-path.txt") & " 2>/dev/null)}\"; if [ -x \"$REPO/launch.sh\" ]; then \"$REPO/launch.sh\"; else exit 3; fi"
	try
		do shell script cmd
	on error
		display dialog "Skill Dex could not find its folder. Rebuild the app with macos/build-app.sh or edit Contents/Resources/repo-path.txt." buttons {"OK"} with icon stop
	end try
end run
