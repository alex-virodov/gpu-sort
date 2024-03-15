import matplotlib.pyplot as plt
from pyavlib.pltutil import plt_clf_subplots
import numpy as np
import matplotlib.pyplot as plt
import numpy as np
import glm as glm


def main():
    ax = plt_clf_subplots(2, 2)
    xy_linspace = np.linspace(-2, 2, 64)
    x, y = np.meshgrid(xy_linspace, xy_linspace)

    xy = np.stack((x.flatten(), y.flatten()))
    print(f'{xy.shape=}')
    p = np.zeros(shape=(2, 1))
    Vinv = np.diag([6, 0.9])
    R = np.array(glm.mat2(glm.rotate(2.0)))
    print(f'{R=}')
    Vinv = R.T @ Vinv @ R
    # Vinv[0][0] = 1
    # Vinv[1][1] = 0.3
    # Vinv[0][1] = 0.5
    # Vinv[1][0] = 0.5
    xy_minus_p = xy - p
    print(f'{xy_minus_p.shape=}')
    exp_arg_1 = Vinv @ (xy - p)
    print(f'{exp_arg_1.shape=}')
    exp_arg_2 = np.sum((xy - p) * exp_arg_1, axis=0)
    print(f'{exp_arg_2.shape=}')

    A = 1.0
    beta = 0.2
    cdata = A * np.exp(-0.5 * exp_arg_2)
    cdata[cdata < beta] = 0
    cdata[cdata > beta] = A
    cdata = cdata.reshape(x.shape)

    print(f'{cdata.shape=}')

    ax[0].scatter(x, y, c=cdata, s=10)

    # todo: proper eigenvalues. This works only if Vinv is diagonal.
    cov = glm.vec3(Vinv[0][0], Vinv[0][1], Vinv[1][1])
    det = (cov.x * cov.z - cov.y * cov.y)
    mid = 0.5 * (cov.x + cov.z)
    lambda1 = mid + np.sqrt(max(0.0, mid * mid - det))
    lambda2 = mid - np.sqrt(max(0.0, mid * mid - det))
    print(f'{mid=} {det=} {lambda1=} {lambda2=}')
    print(f'{np.linalg.eig(Vinv)=}')

    cut_factor = np.sqrt(-2 * np.log(beta / A))
    cut_x = cut_factor * np.sqrt(1.0 / min(lambda1, lambda2))
    cut_y = cut_factor * np.sqrt(1.0 / min(lambda1, lambda2))
    ax[0].plot([cut_x, cut_x], [-cut_y, +cut_y], 'r')
    ax[0].plot([-cut_x, -cut_x], [-cut_y, +cut_y], 'r')
    ax[0].plot([-cut_x, +cut_x], [cut_y, cut_y], 'b')
    ax[0].plot([-cut_x, +cut_x], [-cut_y, -cut_y], 'b')
    ax[0].set_xlim(-3, 3)
    ax[0].set_ylim(-3, 3)








if __name__ == '__main__':
    main()