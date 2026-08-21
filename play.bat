@echo off
echo Starting Under the Table...

echo [1/2] Starting Backend Server...
start "Under the Table - Server" cmd /k "cd server && echo Installing server dependencies... && npm install && echo Starting server... && npm run start"

echo [2/2] Starting Frontend Client...
start "Under the Table - Client" cmd /k "cd client && echo Installing client dependencies... && npm install && echo Starting client... && npm run dev"

echo Both processes have been launched in new windows!
echo Once the client finishes starting, you can access the game at http://localhost:5173
pause
