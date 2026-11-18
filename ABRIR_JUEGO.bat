@echo off
cd /d "%~dp0"
title 卢沟桥 1937 - La Defensa del Puente
echo Iniciando servidor local del juego...
start "" http://localhost:8124
python -m http.server 8124
