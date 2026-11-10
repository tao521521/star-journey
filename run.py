"""Local preview server. Python standard library only; no installation needed."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse
import webbrowser

def main():
    parser = argparse.ArgumentParser(description='星火征程本地预览')
    parser.add_argument('--port', type=int, default=5173)
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent / 'dist'
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    url = f'http://127.0.0.1:{args.port}'
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as exc:
        print(f'无法使用端口 {args.port}：{exc}')
        print('请尝试：python run.py --port 5174 --open')
        return
    print(f'星火征程已启动：{url}\n按 Ctrl+C 停止服务。')
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
