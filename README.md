# 理解线性代数 · 中文精译

David Austin《Understanding Linear Algebra》第 1–4 章的中文翻译，使用 VitePress 构建。

- 原书：<https://understandinglinearalgebra.org/home.html>
- 源码：<https://github.com/davidaustinm/ula>
- 许可：CC BY 4.0

## 本地开发

```bash
bun install
bun run dev
```

## 构建

```bash
bun run build
```

## 翻译流程

`tools/` 下是 PreTeXt XML → Markdown 的转换与校验脚本（uv 管理）：

```bash
cd tools
uv run python ptx2md.py      # 生成英文底稿，已存在的中文文件不会被覆盖
uv run python check_math.py  # 比对译文与英文底稿的公式、图片、锚点
```

`tools/baseline/` 保存英文底稿，用于逐条核对公式。
