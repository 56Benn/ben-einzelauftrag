@REM Maven Wrapper startup script for Windows

@echo off
@setlocal

set MAVEN_OPTS=-Xmx1024m

if exist "%JAVA_HOME%" goto foundJavaHome
if exist "%LOCALAPPDATA%\Programs\Eclipse Adoptium" set JAVA_HOME=%LOCALAPPDATA%\Programs\Eclipse Adoptium
if exist "%LOCALAPPDATA%\Programs\Microsoft" set JAVA_HOME=%LOCALAPPDATA%\Programs\Microsoft
if exist "C:\Program Files\Eclipse Adoptium" set JAVA_HOME=C:\Program Files\Eclipse Adoptium
if exist "C:\Program Files\Microsoft" set JAVA_HOME=C:\Program Files\Microsoft

:foundJavaHome
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
    echo Please set the JAVA_HOME variable in your environment to match the
    echo location of your Java installation.
    exit /b 1
)

set WRAPPER_JAR="%USERPROFILE%\.m2\wrapper\maven-wrapper.jar"
if not exist %WRAPPER_JAR% (
    echo Maven Wrapper JAR not found. Please run: mvn wrapper:wrapper
    exit /b 1
)

"%JAVA_HOME%\bin\java.exe" %MAVEN_OPTS% -jar %WRAPPER_JAR% %*

