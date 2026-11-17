"""将展示截图导出为固定帧率的兼容 MP4；不参与网页运行。

生成时需要 Pillow，以及 PATH 中的 ffmpeg 或 imageio-ffmpeg。
"""
from pathlib import Path
import argparse
import shutil
import subprocess

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT, FPS = 1280, 720, 30


def ffmpeg_path(explicit):
    if explicit:
        return explicit
    installed = shutil.which('ffmpeg')
    if installed:
        return installed
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        raise SystemExit('请安装 ffmpeg 或 imageio-ffmpeg，或通过 --ffmpeg 指定路径。')


def verify_timeline(ffmpeg, video, expected_frames):
    result = subprocess.run([
        ffmpeg, '-v', 'error', '-xerror', '-i', str(video), '-map', '0:v:0',
        '-pix_fmt', 'rgb24', '-f', 'framemd5', '-'
    ], check=True, capture_output=True, encoding='utf-8')
    lines = result.stdout.splitlines()
    if '#tb 0: 1/30' not in lines or '#dimensions 0: 1280x720' not in lines:
        raise RuntimeError('视频尺寸或时间基不符合兼容版要求')
    frames = [line.split(',') for line in lines if line and not line.startswith('#')]
    if len(frames) != expected_frames:
        raise RuntimeError('视频实际帧数与展示时长不一致')
    if any(int(frame[2]) != index or int(frame[3]) != 1
           for index, frame in enumerate(frames)):
        raise RuntimeError('视频时间戳不连续')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    parser.add_argument('--seconds', type=int, default=6)
    parser.add_argument('--output', type=Path,
                        default=ROOT / '提交/演示视频/星火征程-功能展示-兼容版.mp4')
    args = parser.parse_args()
    if args.seconds < 1:
        parser.error('--seconds 必须大于0')
    images = sorted((ROOT / '提交/展示截图').glob('[0-9]*.jpg'))
    if not images:
        raise SystemExit('缺少展示截图')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_name(args.output.stem + '.tmp.mp4')
    ffmpeg = ffmpeg_path(args.ffmpeg)
    command = [
        ffmpeg, '-y', '-v', 'error', '-f', 'rawvideo', '-pixel_format', 'rgb24',
        '-video_size', f'{WIDTH}x{HEIGHT}', '-framerate', str(FPS), '-i', 'pipe:0',
        '-an', '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1',
        '-c:v', 'libx264', '-profile:v', 'baseline', '-level:v', '3.1',
        '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709',
        '-color_trc', 'bt709', '-r', str(FPS), '-fps_mode', 'cfr',
        '-g', str(FPS * 2), '-frames:v', str(len(images) * args.seconds * FPS),
        '-video_track_timescale', '90000', '-movflags', '+faststart', str(temporary)
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for index, image in enumerate(images, 1):
            with Image.open(image) as source:
                scaled = ImageOps.contain(source.convert('RGB'), (WIDTH, HEIGHT), Image.Resampling.LANCZOS)
                canvas = Image.new('RGB', (WIDTH, HEIGHT), '#faf7f1')
                canvas.paste(scaled, ((WIDTH - scaled.width) // 2, (HEIGHT - scaled.height) // 2))
                frame = canvas.tobytes()
            for _ in range(args.seconds * FPS):
                process.stdin.write(frame)
            print(f'Scene {index}/{len(images)} encoded', flush=True)
    except BrokenPipeError:
        pass
    finally:
        process.stdin.close()
    error = process.stderr.read().decode('utf-8', errors='replace')
    if process.wait() != 0:
        raise SystemExit(error)
    # 完整解码通过后再替换交付文件，避免输出半成品。
    verify_timeline(ffmpeg, temporary, len(images) * args.seconds * FPS)
    temporary.replace(args.output)
    print(f'Exported {len(images) * args.seconds}s, {FPS}fps, {WIDTH}x{HEIGHT}', flush=True)


if __name__ == '__main__':
    main()
