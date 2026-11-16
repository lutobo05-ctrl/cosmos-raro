@echo off
rem Doble clic en Windows: renderiza el short de AgujeroNegro y le pone el sonido.
cd /d "%~dp0"
where node >nul 2>nul || (echo ERROR: Falta Node.js ^(https://nodejs.org^) & pause & exit /b 1)
where ffmpeg >nul 2>nul || (echo ERROR: Falta ffmpeg ^(winget install ffmpeg^) & pause & exit /b 1)
if not exist "public\voz\voz.wav" (echo ERROR: Falta public\voz\voz.wav & pause & exit /b 1)
if not exist "audio\mezcla.wav" (echo ERROR: Falta audio\mezcla.wav & pause & exit /b 1)
if not exist node_modules (echo Instalando dependencias, solo la primera vez... & call npm install || (echo ERROR: npm install fallo & pause & exit /b 1))
if not exist salida mkdir salida
echo Renderizando, puede tardar...
call npx remotion render src/index.ts AgujeroNegro "salida/agujero_sin_audio.mp4" --codec h264 --crf 16 --props="{\"mute\":true}" || (echo ERROR: el render fallo & pause & exit /b 1)
ffmpeg -y -v error -i "salida/agujero_sin_audio.mp4" -i "audio/mezcla.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "salida/agujero_final.mp4" || (echo ERROR: no se pudo unir el audio & pause & exit /b 1)
echo.
echo LISTO: %cd%\salida\agujero_final.mp4
pause
