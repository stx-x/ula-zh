---
title: 关于本书与版权
---

# 关于本书与版权

## 原书

**《Understanding Linear Algebra》** 由美国大谷州立大学（Grand Valley State University）的 **David Austin** 教授撰写，是一本面向初学者的开放线性代数教材。它刻意把几何直觉放在形式化证明之前：先让学生看见直线、平面与解集的关系，再引入矩阵与算法。

- 原书主页：[understandinglinearalgebra.org](https://understandinglinearalgebra.org/home.html)
- 源码仓库：[github.com/davidaustinm/ula](https://github.com/davidaustinm/ula)

## 许可

原书以 [Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/) 许可发布，允许复制、分发、改编与商业使用，前提是保留署名。本中文译文沿用同一许可：

> 本译文基于 David Austin 的 *Understanding Linear Algebra*，原文以 CC BY 4.0 发布；译文同样以 CC BY 4.0 发布。

如果你引用本书，建议同时注明原作者、原书链接与本译文链接。

## 翻译说明

译文**按原书段落顺序逐段直译**，不增删内容，只调整语序以符合中文表达，同时遵守三条约束：

1. **公式不动。** 所有数学公式直接取自原书 PreTeXt 源文件中的 LaTeX，包括矩阵、`aligned` / `alignedat` 对齐环境、行内符号与编号。译文只改动词与语序，不改符号。
2. **结构不动。** 活动、定义、命题、例题、练习的编号与顺序与原书一致；交叉引用会跳到对应位置。
3. **术语一致。** 关键术语首次出现时附英文原文，之后统一使用中文。

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| linear system | 线性方程组 | 也简称「方程组」 |
| solution space | 解空间 | 全部解的集合 |
| Gaussian elimination | 高斯消元 | 也称「高斯消元法」 |
| augmented matrix | 增广矩阵 | 系数矩阵右侧接常数列 |
| row echelon form | 行阶梯形 | 简称 REF |
| reduced row echelon form | 简化行阶梯形 | 简称 RREF |
| pivot position | 主元位置 | 首元所在位置 |
| free variable | 自由变量 | 不对应主元的变量 |
| consistent | 相容 | 至少有一个解 |
| inconsistent | 不相容 | 无解 |

## 技术说明

本站使用 [VitePress](https://vitepress.dev/) 构建，数学公式由 [KaTeX](https://katex.org/) 渲染。转换流程是：读取原书 PreTeXt XML → 解析编号与交叉引用 → 输出 Markdown（保留 LaTeX）→ 人工翻译与校对。图表使用原书 PreFigure 生成的 SVG 矢量图，缩放不失真。

## 勘误与反馈

发现公式错误、术语不一致或语句不通，欢迎提交 issue。勘误时请注明小节号与原书对应段落，方便对照源文件核查。
