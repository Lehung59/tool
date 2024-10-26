start wt -w 0 nt -d "F:\_TOOL\banana-fix3" cmd /k "python banana2.py"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\birdton_v2" cmd /k "node .\bird.js"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\clayton" cmd /k "node .\clayton.js"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\coubv23" cmd /k "node .\coub.js"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\freedog" cmd /k "node .\freedog.js"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\pip-fix2" cmd /k "node .\pip3.js"

timeout /t 10 /nobreak
start wt -w 0 nt -d "F:\_TOOL\rating" cmd /k "(echo y & timeout /t 1 & echo y & timeout /t 1 & echo y & timeout /t 1 & echo 10) | node .\rating.js"



  


