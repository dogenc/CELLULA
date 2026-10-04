from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import webbrowser

LOGO = """
 ██████╗ ███████╗ ██╗      ██╗      ██╗   ██╗ ██╗       █████╗
██╔════╝ ██╔════╝ ██║      ██║      ██║   ██║ ██║      ██╔══██╗
██║      █████╗   ██║      ██║      ██║   ██║ ██║      ███████║
██║      ██╔══╝   ██║      ██║      ██║   ██║ ██║      ██╔══██║
╚██████╗ ███████╗ ███████╗ ███████╗ ╚██████╔╝ ███████╗ ██║  ██║
 ╚═════╝ ╚══════╝ ╚══════╝ ╚══════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═╝
      Z E L L B I O L O G I E   ·   3 D   ·   O P E N   S O U R C E
"""

def main():
    folder = Path(__file__).resolve().parent / "dist"
    if not (folder / "index.html").is_file():
        raise SystemExit("Bitte zuerst die gesamte ZIP-Datei entpacken.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(folder))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8766), handler)
    except OSError:
        raise SystemExit("Port 8766 ist belegt. Beende einen bereits laufenden CELLULA-Start und versuche es erneut.")
    try:
        print(LOGO)
    except UnicodeEncodeError:
        print("CELLULA · Zellbiologie in 3D")
    print("CELLULA: http://127.0.0.1:8766")
    print("Nur auf diesem Computer erreichbar. Beenden: Strg+C.")
    webbrowser.open("http://127.0.0.1:8766")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
