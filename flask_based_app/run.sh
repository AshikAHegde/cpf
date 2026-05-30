
#!/bin/bash
fuser -k 5000/tcp 2>/dev/null
source venv/bin/activate
python app.py
