import matplotlib.pyplot as plt
from pyavlib.pltutil import plt_clf_subplots
import numpy as np
import matplotlib.pyplot as plt
import numpy as np
import glm as glm

def plot_vector(ax, v, color):
    ax.plot([0, v.x], [0, v.y], [0, v.z], color)

def plot_line(ax, v1, v2, color):
    ax.plot([v1.x, v2.x], [v1.y, v2.y], [v1.z, v2.z], color)

def plot_axes(ax, m, style=''):
    plot_vector(ax, m * glm.vec4(1, 0, 0, 1), 'r' + style)
    plot_vector(ax, m * glm.vec4(0, 1, 0, 1), 'g' + style)
    plot_vector(ax, m * glm.vec4(0, 0, 1, 1), 'b' + style)

def plot_frustrum(ax, m, fovx, fovy, color):
    ccenter = glm.vec4(0, 0, 0, 1)
    cfwd = glm.vec4(0, 0, -1, 1)

    c00 = m * glm.rotateZ(glm.rotateY(cfwd, fovy), fovx)
    c01 = m * glm.rotateZ(glm.rotateY(cfwd, fovy), -fovx)
    c10 = m * glm.rotateZ(glm.rotateY(cfwd, -fovy), fovx)
    c11 = m * glm.rotateZ(glm.rotateY(cfwd, -fovy), -fovx)
    cfwd = m * cfwd
    ccenter = m * ccenter
    plot_line(ax, ccenter, cfwd, color + '--')
    plot_line(ax, ccenter, c00, color)
    plot_line(ax, ccenter, c01, color)
    plot_line(ax, ccenter, c10, color)
    plot_line(ax, ccenter, c11, color)
    plot_line(ax, c00, c01, color)
    plot_line(ax, c01, c10, color)
    plot_line(ax, c11, c10, color)
    plot_line(ax, c11, c00, color)
    return (cfwd, ccenter, c00, c01, c10, c11)
#
# def plot_plane(ax, v_center, v_normal, step, steps, color):
#     # Find first non-collinear (in loose sense) vector to normal. That will be the tangent (after orthonormalization).
#     v_normal = Vector4(v_normal.x, v_normal.y, v_normal.z, 0).normalize()
#     v_tangent = Vector4(1, 0, 0, 0)
#     if (v_tangent.dot(v_normal) > 0.8):
#         v_tangent = Vector4(0, 1, 0, 0)
#     if (v_tangent.dot(v_normal) > 0.8):
#         v_tangent = Vector4(0, 0, 1, 0)
#     if (v_tangent.dot(v_normal) > 0.8):
#         raise ValueError(f'failed to build v_tangent vector to normal {v_normal}')
#     print(f'pre-orthonormalization normal={v_normal} v_tangent={v_tangent}')
#     v_tangent = (v_tangent - v_normal * v_tangent.dot(v_normal)).normalize()
#     v_bitangent = v_normal.cross(v_tangent)
#     print(f'post-orthonormalization normal={v_normal} v_tangent={v_tangent} v_bitangent={v_bitangent}')
#     for i in np.arange(-steps, steps+1):
#         line_start = v_center + v_tangent * (step * steps) + v_bitangent * (step * i)
#         line_end   = v_center + v_tangent * (step * -steps) + v_bitangent * (step * i)
#         plot_line(ax, line_start, line_end, color)
#         line_start = v_center + v_bitangent * (step * steps) + v_tangent * (step * i)
#         line_end   = v_center + v_bitangent * (step * -steps) + v_tangent * (step * i)
#         plot_line(ax, line_start, line_end, color)

def main():
    ax = plt_clf_subplots(1, 1,
                          subplot_kws_map={0:{'projection': '3d'}})

    plt.sca(ax[0])
    plot_size = 3
    ax[0].set_xlim(-plot_size, plot_size)
    ax[0].set_ylim(-plot_size, plot_size)
    ax[0].set_zlim(-plot_size, plot_size)
    plot_axes(ax[0], glm.mat4(1.0), '')
    plot_frustrum(ax[0], glm.mat4(1.0), 1.0, 1.0, 'r')

    z = -3
    xy_linspace = np.linspace(-1.0, 1.0, 16)
    z_linspace = np.linspace(-1.0 + z, 1.0 + z, 16)
    xdata, ydata, zdata = np.meshgrid(xy_linspace, xy_linspace, z_linspace)
    xdata += np.random.randn(*xdata.shape) * 0.02
    ydata += np.random.randn(*ydata.shape) * 0.02
    zdata += np.random.randn(*zdata.shape) * 0.02
    print(f'{zdata.shape=}')
    xyz = np.stack((xdata.flatten(), ydata.flatten(), zdata.flatten()))
    print(f'{xyz.shape=}')
    p = np.zeros(shape=(3, 1))
    p[2] = z
    Vinv = np.eye(3)
    # Vinv[0][0] = 5
    xyz_minus_p = xyz - p
    print(f'{xyz_minus_p.shape=}')
    exp_arg_1 = Vinv @ (xyz - p)
    print(f'{exp_arg_1.shape=}')
    exp_arg_2 = np.sum((xyz - p) * exp_arg_1, axis=0)
    print(f'{exp_arg_2.shape=}')

    gaussain_normalization_factor = 1.0
    cdata = gaussain_normalization_factor * np.exp(-0.5 * exp_arg_2)
    cdata = cdata.reshape(xdata.shape)
    print(f'{cdata.shape=}')

    ax[0].scatter(xdata, ydata, zdata, c=cdata, s=cdata * 10)
    ax[0].set_xlabel('x')
    ax[0].set_ylabel('y')
    ax[0].set_zlabel('z')



if __name__ == '__main__':
    main()