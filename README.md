== Conclusion ==
The performance of GPU Bitonic sort [1] is roughly the same as CPU counting sort [2], at least in the context of rendering point clouds.

[CHART HERE]

== Motivation ==
For Gaussian Splatting [4], visualization requires rendering of transparent primitives, and to render them correctly, they must be sorted [5]. A WebGL implementation of Gaussian splatting viewer [6] uses counting sort on CPU, and I was wondering if a GPU sort would be better. A review article [7] suggested Bitonic sort, and provided parts of implementation, but I implemented the sort mostly from the wikipedia code and picture[8].

== Code Organization ==
The purpose was to measure performance in the context of the problem, as opposed to synthetic tests, as additional considerations (e.g. GL API calls/context switches) can affect the performance significantly. The context I chose was to render point clouds, but without the additional complexity of rendering actual gaussian splats, as this requires much trickier quad formation.

The CPU sorting with GPU point cloud visualization is implemented in `sort_eval.html`


== Next steps ==
1. Measure performance on other hardware I have: Desktop (i7/GTX3080) and Android phone (Samsung S10).
2. Better and more automated performance measurement so there's less manual work.
3. Detailed profiling in e.g. Nvidia Nsight to see if the GPU bitonic sort can be improved. Currently seems like memory bottleneck for each pass.




















reference: https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/