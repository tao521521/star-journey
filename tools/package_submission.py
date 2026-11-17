"""生成便于离线交付的源码包，明确排除凭据、Git元数据和提交目录本身。"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '提交'
SOURCE_DIRS = ('dist', 'tests', 'tools', '.github')
SOURCE_FILES = ('.gitignore', 'README.md', 'run.py', '启动项目.bat', 'netlify.toml',
                '设计与素材说明.md', '素材与史实核查.md', '验证记录.md',
                '演示与提交说明.md', 'GitHub与Netlify部署说明.md')

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    OUT.mkdir(exist_ok=True)
    files = [ROOT / name for name in SOURCE_FILES]
    for directory in SOURCE_DIRS:
        files.extend(p for p in (ROOT / directory).rglob('*')
                     if p.is_file() and '__pycache__' not in p.parts)
    files = sorted(set(files))
    hashes = {}
    archive = OUT / '星火征程-完整源码.zip'
    with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
        for file in files:
            relative = file.relative_to(ROOT)
            assert not any(part in {'.git', '.netlify', '提交'} for part in relative.parts)
            assert not file.name.startswith('.env')
            data = file.read_bytes()
            hashes[relative.as_posix()] = digest(data)
            z.writestr('星火征程/' + relative.as_posix(), data)
    with ZipFile(archive) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(files)
    (OUT / '源码核验清单.json').write_text(json.dumps({
        '源码包': archive.name,
        '文件数': len(files),
        '源码包SHA256': digest(archive.read_bytes()),
        '文件SHA256': hashes,
        '排除内容': ['Git元数据', 'Netlify本机状态', '环境变量及账号凭据', '提交文件夹本身']
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'已生成：{archive}，共 {len(files)} 个文件')

if __name__ == '__main__':
    main()
