@echo off
chcp 65001 >nul
echo =======================================================
echo    A C A I   D A   R O S E  -  Servidor de Impressao
echo    Configuracao de Inicializacao Automatica (Windows)
echo =======================================================
echo.

set TARGET_EXE=%~dp0acaidarose-print-agent.exe
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_DIR%\AcaidaRose-PrintAgent.lnk

if not exist "%TARGET_EXE%" (
    echo [ERRO] Executavel nao encontrado: %TARGET_EXE%
    echo Verifique se os arquivos foram descompactados corretamente.
    pause
    exit /b 1
)

echo [1/2] Criando atalho na pasta Inicializar do Windows...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_EXE%'; $s.WorkingDirectory = '%~dp0'; $s.Arguments = '--minimized'; $s.Description = 'Açaí da Rose - Servidor de Impressão Windows'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [2/2] Atalho criado com sucesso em:
    echo       %SHORTCUT_PATH%
    echo.
    echo =======================================================
    echo   PRONTO! O Servidor de Impressao agora iniciara
    echo   automaticamente sempre que este computador ligar.
    echo =======================================================
) else (
    echo [AVISO] Nao foi possivel criar o atalho automaticamente.
    echo Copie manualmente o executavel para:
    echo %STARTUP_DIR%
)

echo.
echo Deseja iniciar o Servidor de Impressao agora? (S/N)
set /p START_NOW="> "
if /i "%START_NOW%"=="S" (
    start "" "%TARGET_EXE%"
)

exit /b 0

