import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128


def main():
    parser = argparse.ArgumentParser(description="预览生成后的 Style Mix 静态站点")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parent.parent / ".cache/seo-preview")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    if not (args.directory / "index.html").is_file():
        parser.error("没有生成的首页，请先运行 node scripts/build-site.mjs")

    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *values):
            if not args.quiet:
                super().log_message(*values)

    with PreviewServer((args.bind, args.port), partial(Handler, directory=str(args.directory))) as server:
        print(f"http://{args.bind}:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
